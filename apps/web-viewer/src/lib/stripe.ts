import Stripe from 'stripe';
import {
  resolveVerticalTypeForStripe,
  STRIPE_META_CLIENT_ID,
  STRIPE_META_VERTICAL_TYPE,
} from '@/lib/stripe-metadata';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set. Add it to .env.local to enable payment features.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
    });
  }
  return _stripe;
}

// Re-export as `stripe` for backward compat
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as unknown as Record<string, unknown>)[prop as string];
  },
});

/**
 * Create a Stripe Checkout session for a one-time payment
 */
export async function createPaymentLink(params: {
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
  amount: number; // in dollars
  type: 'down_payment' | 'completion';
  description: string;
  /** Clerk org id — used for `vertical_type` metadata (Cloud SQL tenant). */
  organizationId: string;
}) {
  const vertical_type = await resolveVerticalTypeForStripe(params.organizationId);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.prospectEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(params.amount * 100), // Stripe uses cents
          product_data: {
            name: params.description,
            description: `${params.type === 'down_payment' ? 'Down Payment' : 'Completion Payment'} for ${params.prospectName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      prospectId: params.prospectId,
      type: params.type,
      [STRIPE_META_CLIENT_ID]: params.organizationId,
      [STRIPE_META_VERTICAL_TYPE]: vertical_type,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/payment-cancelled`,
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Create a Stripe Subscription for recurring retainer
 */
export async function createSubscription(params: {
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
  stripePriceId: string;
  organizationId: string;
}) {
  // First, find or create the Stripe customer
  const customers = await stripe.customers.list({ email: params.prospectEmail, limit: 1 });
  let customerId: string;

  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: params.prospectEmail,
      name: params.prospectName,
      metadata: { prospectId: params.prospectId },
    });
    customerId = customer.id;
  }

  const vertical_type = await resolveVerticalTypeForStripe(params.organizationId);
  // Create checkout session for the subscription
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: params.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      prospectId: params.prospectId,
      type: 'retainer',
      [STRIPE_META_CLIENT_ID]: params.organizationId,
      [STRIPE_META_VERTICAL_TYPE]: vertical_type,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/payment-cancelled`,
  });

  return { url: session.url, sessionId: session.id, customerId };
}
