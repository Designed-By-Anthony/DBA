import Stripe from "stripe";
import {
  STRIPE_METADATA_CLERK_ORG,
  STRIPE_METADATA_PROSPECT_ID,
} from "@/lib/stripe-tenant-metadata";

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local to enable payment features.");
    }
    // API version: omit so Stripe account default applies (see integration blueprint).
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Re-export as `stripe` for backward compat
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as unknown as Record<string, unknown>)[prop as string];
  },
});

function escapeStripeSearchToken(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Create a Stripe Checkout session for a one-time payment
 */
export async function createPaymentLink(params: {
  clerkOrgId: string;
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
  amount: number; // in dollars
  type: "down_payment" | "completion";
  description: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.prospectEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(params.amount * 100), // Stripe uses cents
          product_data: {
            name: params.description,
            description: `${params.type === "down_payment" ? "Down Payment" : "Completion Payment"} for ${params.prospectName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      [STRIPE_METADATA_CLERK_ORG]: params.clerkOrgId,
      [STRIPE_METADATA_PROSPECT_ID]: params.prospectId,
      prospectId: params.prospectId,
      type: params.type,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-cancelled`,
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Create a Stripe Subscription for recurring retainer
 */
export async function createSubscription(params: {
  clerkOrgId: string;
  prospectId: string;
  prospectEmail: string;
  prospectName: string;
  stripePriceId: string;
}) {
  const emailQ = escapeStripeSearchToken(params.prospectEmail.trim().toLowerCase());
  const orgQ = escapeStripeSearchToken(params.clerkOrgId);

  const search = await stripe.customers.search({
    query: `email:'${emailQ}' AND metadata['${STRIPE_METADATA_CLERK_ORG}']:'${orgQ}'`,
    limit: 1,
  });

  let customerId: string;
  if (search.data.length > 0) {
    customerId = search.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: params.prospectEmail,
      name: params.prospectName,
      metadata: {
        [STRIPE_METADATA_CLERK_ORG]: params.clerkOrgId,
        [STRIPE_METADATA_PROSPECT_ID]: params.prospectId,
      },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: params.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      [STRIPE_METADATA_CLERK_ORG]: params.clerkOrgId,
      [STRIPE_METADATA_PROSPECT_ID]: params.prospectId,
      prospectId: params.prospectId,
      type: "retainer",
    },
    subscription_data: {
      metadata: {
        [STRIPE_METADATA_CLERK_ORG]: params.clerkOrgId,
        [STRIPE_METADATA_PROSPECT_ID]: params.prospectId,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-cancelled`,
  });

  return { url: session.url, sessionId: session.id, customerId };
}

/**
 * Create a Stripe Checkout session from an Agency OS invoice.
 * Links the invoice ID in metadata for webhook reconciliation.
 */
export async function createInvoiceCheckout(params: {
  clerkOrgId: string;
  invoiceId: string;
  invoiceNumber: string;
  prospectEmail?: string;
  lineItems: Array<{
    name: string;
    description?: string;
    unitPriceCents: number;
    quantity: number;
    interval?: string;
  }>;
}) {
  const stripeLineItems = params.lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.unitPriceCents,
        product_data: {
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
        },
        ...(item.interval && item.interval !== "one_time"
          ? { recurring: { interval: item.interval as "month" | "year" } }
          : {}),
      },
      quantity: item.quantity,
    }));

  const hasRecurring = params.lineItems.some((i) => i.interval && i.interval !== "one_time");

  const session = await stripe.checkout.sessions.create({
    mode: hasRecurring ? "subscription" : "payment",
    ...(params.prospectEmail ? { customer_email: params.prospectEmail } : {}),
    line_items: stripeLineItems,
    metadata: {
      [STRIPE_METADATA_CLERK_ORG]: params.clerkOrgId,
      invoiceId: params.invoiceId,
      invoiceNumber: params.invoiceNumber,
      source: "agency_os_invoice",
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/payment-cancelled`,
  });

  return { url: session.url, sessionId: session.id };
}
