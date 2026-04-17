import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { sendMail } from '@/lib/mailer';
import { complianceConfig } from '@/lib/theme.config';
import { apiError } from '@/lib/api-error';

/**
 * Calendly Webhook Handler
 * 
 * Receives events from Calendly:
 * - invitee.created → new booking
 * - invitee.canceled → booking cancelled
 * 
 * Setup: In Calendly → Integrations → Webhooks → Create Webhook
 * URL: https://admin.designedbyanthony.com/api/webhooks/calendly
 * Events: invitee.created, invitee.canceled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event; // "invitee.created" | "invitee.canceled"
    const payload = body.payload;

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

    // Find existing prospect by email
    const prospectQuery = await db
      .collection('prospects')
      .where('email', '==', inviteeEmail)
      .limit(1)
      .get();

    let prospectId: string;

    if (prospectQuery.empty) {
      // Create a new prospect from the booking
      const ref = db.collection('prospects').doc();
      prospectId = ref.id;

      await ref.set({
        name: inviteeName,
        email: inviteeEmail,
        phone: payload.text_reminder_number || '',
        company: '',
        website: '',
        targetUrl: '',
        status: 'contacted', // They booked a call, so they're past "lead"
        dealValue: 0,
        source: 'Calendly',
        tags: ['Calendly Booking'],
        notes: `Booked: ${eventName}`,
        assignedTo: '',
        createdAt: new Date().toISOString(),
        lastContactedAt: new Date().toISOString(),
        unsubscribed: false,
        calendlyEventUrl: eventUrl,
      });
    } else {
      prospectId = prospectQuery.docs[0].id;
      const currentStatus = prospectQuery.docs[0].data().status;

      // Auto-advance to "contacted" if they're still a lead
      const updates: Record<string, unknown> = {
        lastContactedAt: new Date().toISOString(),
        calendlyEventUrl: eventUrl,
      };
      if (currentStatus === 'lead') {
        updates.status = 'contacted';
      }

      await db.collection('prospects').doc(prospectId).update(updates);
    }

    if (event === 'invitee.created') {
      // Log booking activity
      await db.collection('activities').add({
        prospectId,
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

      // Notify you
      try {
        await sendMail({
          from: `Agency OS <${complianceConfig.fromEmail}>`,
          to: [complianceConfig.adminNotificationEmail],
          subject: `📞 Call Booked: ${inviteeName || inviteeEmail}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
              <h2 style="margin: 0 0 16px; color: #fff;">📞 New Booking</h2>
              <p style="color: #ccc; margin: 0 0 8px;"><strong style="color: #fff;">${inviteeName}</strong> (${inviteeEmail})</p>
              <p style="color: #ccc; margin: 0 0 8px;">Event: ${eventName}</p>
              ${scheduledTime ? `<p style="color: #ccc; margin: 0 0 16px;">Time: ${new Date(scheduledTime).toLocaleString()}</p>` : ''}
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.designedbyanthony.com'}/admin/prospects/${prospectId}"
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
      // Log cancellation
      await db.collection('activities').add({
        prospectId,
        type: 'note_added',
        title: `Call cancelled: ${eventName}`,
        description: cancelReason || 'No reason provided',
        metadata: { eventName, cancelReason },
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, prospectId });
  } catch (error: unknown) {
    return apiError('webhooks/calendly', error);
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'calendly-webhook' });
}
