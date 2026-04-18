import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb, leads, activities } from '@dba/database';
import { eq } from 'drizzle-orm';
import { sendMail } from '@/lib/mailer';
import { complianceConfig } from '@/lib/theme.config';
import { escapeHtml } from '@/lib/email-utils';
import { isTestMode } from '@/lib/test-mode';
import { apiError } from '@/lib/api-error';
import type Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Stripe Webhook Handler
 *
 * Handles:
 * - checkout.session.completed → payment received
 * - invoice.paid → recurring retainer paid
 * - customer.subscription.deleted → retainer cancelled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    if (isTestMode()) {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      if (!webhookSecret) {
        console.error('Stripe webhook rejected: STRIPE_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
      }
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Stripe signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const db = getDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const prospectId = session.metadata?.prospectId;
        const paymentType = session.metadata?.type as 'down_payment' | 'completion' | 'retainer';

        if (!prospectId || !db) break;

        const amount = session.mode === 'payment'
          ? (session.amount_total || 0) / 100
          : 0;

        // Find prospect to get tenant_id
        const prospectRows = await db
          .select()
          .from(leads)
          .where(eq(leads.prospectId, prospectId))
          .limit(1);

        if (prospectRows.length === 0) break;
        const prospect = prospectRows[0];
        const tenantId = prospect.tenantId;

        // Log activity
        await db.insert(activities).values({
          tenantId,
          leadId: prospectId,
          type: 'payment_received',
          title: `Payment received: $${amount.toLocaleString()}`,
          description: `${paymentType?.replace('_', ' ')} via Stripe`,
          metadata: {
            amount,
            paymentType,
            stripeSessionId: session.id,
            customerEmail: session.customer_details?.email,
          },
          createdAt: new Date().toISOString(),
        });

        // Update prospect
        const updates: Record<string, unknown> = {};
        if (session.customer) {
          updates.stripeCustomerId = String(session.customer);
        }

        // Auto-advance pipeline: down payment → move to dev
        if (paymentType === 'down_payment' && prospect.status === 'proposal') {
          updates.status = 'active';
        }

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date().toISOString();
          await db
            .update(leads)
            .set(updates)
            .where(eq(leads.prospectId, prospectId));
        }

        // Notify admin
        try {
          const customerName = session.customer_details?.name || 'Unknown';
          const safeCustomerName = escapeHtml(customerName);
          const safePaymentType = escapeHtml(
            paymentType?.replace('_', ' ') || 'Payment',
          );
          await sendMail({
            from: `Agency OS <${complianceConfig.fromEmail}>`,
            to: [complianceConfig.adminNotificationEmail],
            subject:
              `💰 Payment Received: $${amount.toLocaleString()} — ` +
              customerName.replace(/[\r\n]+/g, ' '),
              html: `
                <div style="font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 32px; background: #0a0a0f; color: #e0e0e0; border-radius: 12px;">
                  <h2 style="color: #10b981; margin: 0 0 16px;">💰 Payment Received</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #888;">Client</td><td style="color: #fff;">${safeCustomerName}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;">Amount</td><td style="color: #10b981; font-size: 1.25em; font-weight: bold;">$${amount.toLocaleString()}</td></tr>
                    <tr><td style="padding: 8px 0; color: #888;">Type</td><td style="color: #fff;">${safePaymentType}</td></tr>
                  </table>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/prospects/${prospectId}"
                    style="display: inline-block; margin-top: 20px; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
                    View in Agency OS →
                  </a>
                </div>
              `,
          });
        } catch (e) {
          console.error('Payment notification email failed:', e);
        }

        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubscription = (invoice as unknown as Record<string, unknown>).subscription as string;

        if (invoiceSubscription && invoice.billing_reason === 'subscription_cycle' && db) {
          const customerRows = await db
            .select()
            .from(leads)
            .where(eq(leads.stripeCustomerId, String(invoice.customer)))
            .limit(1);

          if (customerRows.length > 0) {
            const prospect = customerRows[0];
            const amount = (invoice.amount_paid || 0) / 100;

            await db.insert(activities).values({
              tenantId: prospect.tenantId,
              leadId: prospect.prospectId,
              type: 'payment_received',
              title: `Retainer payment: $${amount.toLocaleString()}/mo`,
              description: 'Recurring subscription payment',
              createdAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (db) {
          const customerRows = await db
            .select()
            .from(leads)
            .where(eq(leads.stripeCustomerId, String(subscription.customer)))
            .limit(1);

          if (customerRows.length > 0) {
            const prospect = customerRows[0];
            await db.insert(activities).values({
              tenantId: prospect.tenantId,
              leadId: prospect.prospectId,
              type: 'note_added',
              title: 'Retainer subscription cancelled',
              description: 'Client\'s recurring subscription has been cancelled in Stripe',
              createdAt: new Date().toISOString(),
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return apiError('webhooks/stripe', error);
  }
}
