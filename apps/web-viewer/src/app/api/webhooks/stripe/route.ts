import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase';
import { sendMail } from '@/lib/mailer';
import { complianceConfig } from '@/lib/theme.config';
import { escapeHtml } from '@/lib/email-utils';
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
 * 
 * Setup: In Stripe Dashboard → Developers → Webhooks → Add Endpoint
 * URL: https://admin.designedbyanthony.com/api/webhooks/stripe
 * Events: checkout.session.completed, invoice.paid, customer.subscription.deleted
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    // Verify webhook signature in production or local dev, but skip for E2E Playwright tests
    if (webhookSecret && process.env.NEXT_PUBLIC_IS_TEST !== 'true') {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Stripe signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(body) as Stripe.Event;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const prospectId = session.metadata?.prospectId;
        const paymentType = session.metadata?.type as 'down_payment' | 'completion' | 'retainer';

        if (!prospectId) break;

        const amount = session.mode === 'payment'
          ? (session.amount_total || 0) / 100
          : 0; // Subscription amount is in invoice.paid

        // Create invoice record
        await db.collection('invoices').add({
          prospectId,
          prospectName: session.customer_details?.name || '',
          type: paymentType || 'down_payment',
          amount,
          status: 'paid',
          stripePaymentIntentId: session.payment_intent || null,
          stripeInvoiceId: null,
          stripePaymentUrl: null,
          dueDate: null,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        // Log activity
        await db.collection('activities').add({
          prospectId,
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

        // Update prospect onboarding
        const prospectDoc = await db.collection('prospects').doc(prospectId).get();
        if (prospectDoc.exists) {
          const updates: Record<string, unknown> = {};

          if (paymentType === 'down_payment') {
            updates['onboarding.downPaymentReceived'] = true;
          } else if (paymentType === 'completion') {
            updates['onboarding.completionPaid'] = true;
          }

          if (session.customer) {
            updates.stripeCustomerId = session.customer;
          }

          if (Object.keys(updates).length > 0) {
            await db.collection('prospects').doc(prospectId).update(updates);
          }
        }

        // Auto-advance pipeline: down payment → move to "dev"
        if (paymentType === 'down_payment') {
          const prospect = await db.collection('prospects').doc(prospectId).get();
          if (prospect.exists && prospect.data()?.status === 'proposal') {
            await db.collection('prospects').doc(prospectId).update({ status: 'dev' });
          }
        }

        // Notify admin. Stripe-provided strings (customer name) are escaped —
        // the payer controls `customer_details.name` on the Checkout form, so
        // even a signature-verified event can still carry attacker-chosen HTML.
        try {
          const customerName = session.customer_details?.name || 'Unknown';
          const safeCustomerName = escapeHtml(customerName);
          const safePaymentType = escapeHtml(
            paymentType?.replace('_', ' ') || 'Payment',
          );
          await sendMail({
            from: `Agency OS <${complianceConfig.fromEmail}>`,
            to: [complianceConfig.adminNotificationEmail],
            // Subject is plain text; strip CRLF for header-injection safety.
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
        
        if (invoiceSubscription && invoice.billing_reason === 'subscription_cycle') {
          // Recurring retainer payment — find prospect by Stripe customer ID
          const customerRef = await db
            .collection('prospects')
            .where('stripeCustomerId', '==', invoice.customer)
            .limit(1)
            .get();

          if (!customerRef.empty) {
            const prospectId = customerRef.docs[0].id;
            const amount = (invoice.amount_paid || 0) / 100;

            await db.collection('invoices').add({
              prospectId,
              prospectName: customerRef.docs[0].data().name,
              type: 'retainer',
              amount,
              status: 'paid',
              stripeInvoiceId: invoice.id,
              paidAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

            await db.collection('activities').add({
              prospectId,
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
        const customerRef = await db
          .collection('prospects')
          .where('stripeCustomerId', '==', subscription.customer)
          .limit(1)
          .get();

        if (!customerRef.empty) {
          const prospectId = customerRef.docs[0].id;
          await db.collection('activities').add({
            prospectId,
            type: 'note_added',
            title: 'Retainer subscription cancelled',
            description: 'Client\'s recurring subscription has been cancelled in Stripe',
            createdAt: new Date().toISOString(),
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return apiError('webhooks/stripe', error);
  }
}
