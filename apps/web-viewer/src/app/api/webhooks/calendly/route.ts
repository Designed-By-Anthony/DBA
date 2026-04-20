import { type NextRequest, NextResponse } from 'next/server';
import { getDb, withBypassRls, leads, activities } from '@dba/database';
import { and, eq } from 'drizzle-orm';
import { sendMail } from '@/lib/mailer';
import { complianceConfig } from '@/lib/theme.config';
import { escapeHtml } from '@/lib/email-utils';
import { getSecret, verifyCalendlySignature } from '@/lib/webhook-auth';
import { apiError } from '@/lib/api-error';
import { resolveCalendlyWebhookTenant } from '@/lib/lead-webhook-agency';

/**
 * Calendly Webhook Handler
 *
 * Receives events from Calendly:
 * - invitee.created → new booking
 * - invitee.canceled → booking cancelled
 *
 * Tenant routing: `resolveCalendlyWebhookTenant` — use `?tenant=<Clerk org id>` in the webhook URL
 * for multi-tenant, or `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` for a single org. Prospect lookup is scoped
 * to that tenant so shared emails do not attach to the wrong org’s pipeline.
 */
export async function POST(request: NextRequest) {
  const signingKey = getSecret('CALENDLY_WEBHOOK_SIGNING_KEY');
  if (!signingKey) {
    console.error('[calendly] webhook rejected: CALENDLY_WEBHOOK_SIGNING_KEY not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('calendly-webhook-signature');
  if (!verifyCalendlySignature(rawBody, signatureHeader, signingKey)) {
    console.warn('[calendly] invalid signature rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: { event?: string; payload?: Record<string, unknown> };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const event = body.event;
    const payload = body.payload as
      | {
          email?: string;
          name?: string;
          text_reminder_number?: string;
          event_type?: { name?: string };
          scheduled_event?: { start_time?: string; uri?: string };
          cancellation?: { reason?: string };
        }
      | undefined;

    if (!event || !payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const inviteeEmail = payload.email?.toLowerCase().trim();
    const inviteeName = payload.name || '';
    const eventName = payload.event_type?.name || 'Discovery Call';
    const scheduledTime = payload.scheduled_event?.start_time;
    const cancelReason = payload.cancellation?.reason;
    const eventUrl = payload.scheduled_event?.uri || '';

    if (!inviteeEmail) {
      return NextResponse.json({ error: 'No email in payload' }, { status: 400 });
    }

    const tenantResolution = await resolveCalendlyWebhookTenant(request);
    if (!tenantResolution.ok) {
      return NextResponse.json(
        { error: tenantResolution.message },
        { status: tenantResolution.status },
      );
    }
    const targetTenantId = tenantResolution.tenantId;

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const defaultAgencyId = process.env.LEAD_WEBHOOK_DEFAULT_AGENCY_ID?.trim();
    if (!defaultAgencyId) {
      console.error(
        '[calendly] LEAD_WEBHOOK_DEFAULT_AGENCY_ID is unset — cannot assign new bookings to a tenant',
      );
      return NextResponse.json(
        { error: 'Server misconfigured: set LEAD_WEBHOOK_DEFAULT_AGENCY_ID to your Clerk org id' },
        { status: 503 },
      );
    }

    let prospectId: string | undefined;

    await withBypassRls(db, async (tx) => {
      // Same email may exist under different tenants — scope by tenant + email.
      const prospectRows = await tx
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.emailNormalized, inviteeEmail),
            eq(leads.tenantId, targetTenantId),
          ),
        )
        .limit(1);

      let tenantId: string;

      if (prospectRows.length === 0) {
        const now = new Date().toISOString();
        const newProspectId = `cal_${Date.now()}`;

        await tx.insert(leads).values({
          tenantId: targetTenantId,
          prospectId: newProspectId,
          name: inviteeName,
          email: inviteeEmail,
          emailNormalized: inviteeEmail,
          phone: payload.text_reminder_number || '',
          company: '',
          source: 'Calendly',
          status: 'contacted',
          tags: ['Calendly Booking'],
          notes: `Booked: ${eventName}`,
          metadata: { calendlyEventUrl: eventUrl },
          createdAt: now,
          updatedAt: now,
        });

        prospectId = newProspectId;
        tenantId = targetTenantId;
      } else {
        const prospect = prospectRows[0];
        prospectId = prospect.prospectId;
        tenantId = prospect.tenantId;

        const updates: Record<string, unknown> = {
          lastContactedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (prospect.status === 'new') {
          updates.status = 'contacted';
        }

        await tx.update(leads).set(updates).where(eq(leads.prospectId, prospectId));
      }

      if (event === 'invitee.created') {
        await tx.insert(activities).values({
          tenantId,
          leadId: prospectId,
          type: 'call_booked',
          title: `Booked: ${eventName}`,
          description: scheduledTime
            ? `Scheduled for ${new Date(scheduledTime).toLocaleString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}`
            : 'Call scheduled',
          metadata: {
            eventName,
            scheduledTime,
            eventUrl,
            inviteeEmail,
          },
          createdAt: new Date().toISOString(),
        });

        // Notify admin
        try {
          const safeInviteeName = escapeHtml(inviteeName);
          const safeInviteeEmail = escapeHtml(inviteeEmail);
          const safeEventName = escapeHtml(eventName);
          await sendMail({
            from: `Agency OS <${complianceConfig.fromEmail}>`,
            to: [complianceConfig.adminNotificationEmail],
            subject:
              `📞 Call Booked: ` +
              String(inviteeName || inviteeEmail).replace(/[\r\n]+/g, ' '),
            html: `
                <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
                  <h2 style="margin: 0 0 16px; color: #fff;">📞 New Booking</h2>
                  <p style="color: #ccc; margin: 0 0 8px;"><strong style="color: #fff;">${safeInviteeName}</strong> (${safeInviteeEmail})</p>
                  <p style="color: #ccc; margin: 0 0 8px;">Event: ${safeEventName}</p>
                  ${scheduledTime ? `<p style="color: #ccc; margin: 0 0 16px;">Time: ${escapeHtml(new Date(scheduledTime).toLocaleString())}</p>` : ''}
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/prospects/${prospectId}"
                    style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
                    View in Agency OS →
                  </a>
                </div>
              `,
          });
        } catch (e) {
          console.error('Calendly notification email failed:', e);
        }
      } else if (event === 'invitee.canceled') {
        await tx.insert(activities).values({
          tenantId,
          leadId: prospectId,
          type: 'note_added',
          title: `Call cancelled: ${eventName}`,
          description: cancelReason || 'No reason provided',
          metadata: { eventName, cancelReason },
          createdAt: new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({ success: true, prospectId });
  } catch (error: unknown) {
    return apiError('webhooks/calendly', error);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'calendly-webhook' });
}
