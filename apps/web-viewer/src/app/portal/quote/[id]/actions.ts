"use server";

import type Stripe from "stripe";
import { db } from "@/lib/firebase";
import { stripe } from "@/lib/stripe";
import {
  resolveVerticalTypeForStripe,
  STRIPE_META_VERTICAL_TYPE,
} from "@/lib/stripe-metadata";
import type { Quote } from "@/lib/types";

type CheckoutSessionCreateParams = NonNullable<
  Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
>;
type CheckoutLineItems = NonNullable<CheckoutSessionCreateParams["line_items"]>;

export async function acceptQuoteAndCheckoutAction(params: {
  quoteId: string;
  prospectId: string;
  packageId: string;
  signatureDataUrl: string;
}): Promise<{ url: string | null; error?: string }> {
  try {
    // 1. Fetch Quote
    const quoteQuery = await db.collectionGroup("quotes").where("id", "==", params.quoteId).limit(1).get();
    if (quoteQuery.empty) return { url: null, error: "Quote not found" };
    
    const quoteDoc = quoteQuery.docs[0];
    const quote = quoteDoc.data() as Quote;
    
    // 2. Fetch Prospect Info for Stripe Customer Creation
    const prospectDoc = await db.collection("prospects").doc(params.prospectId).get();
    if (!prospectDoc.exists) return { url: null, error: "Prospect not found" };
    const prospect = prospectDoc.data();
    
    // 3. Identify Selected Package
    const pkg = quote.packages.find(p => p.id === params.packageId);
    if (!pkg) return { url: null, error: "Package missing from quote payload" };

    // 4. Set up Stripe Line Items using Price IDs natively or passing raw amounts and Product IDs
    // For Stripe Checkout, if we have dynamic line items where we only have Product IDs, 
    // we can pass price_data inline
    const lineItems: CheckoutLineItems = pkg.items.map((item) => {
      const isRecurring = item.type === "recurring";
      return {
        quantity: 1,
        price_data: {
          currency: "usd",
          product: item.stripeProductId,
          unit_amount: item.priceCents,
          ...(isRecurring
            ? {
                recurring: {
                  interval: item.interval || "month",
                },
              }
            : {}),
        },
      };
    });

    const vertical_type = await resolveVerticalTypeForStripe(quote.agencyId);

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: pkg.totalRecurringCents > 0 ? 'subscription' : 'payment',
      line_items: lineItems,
      customer_email: prospect?.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}&prospect=${params.prospectId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/quote/${params.quoteId}`,
      metadata: {
        prospectId: params.prospectId,
        quoteId: params.quoteId,
        packageId: params.packageId,
        agencyId: quote.agencyId,
        [STRIPE_META_VERTICAL_TYPE]: vertical_type,
      }
    });

    if (!session.url) throw new Error("Failed to generate stripe session URL");

    // 6. Securely stamp the signature and lock the quote
    await quoteDoc.ref.update({
      status: 'accepted',
      selectedPackageId: params.packageId,
      signatureDataUrl: params.signatureDataUrl, // base64 string
      signedAt: new Date().toISOString(),
      stripeCheckoutSessionId: session.id, // reference
    });
    
    // Update CRM Pipeline explicitly
    await prospectDoc.ref.update({
      status: 'contracted',
    });

    return { url: session.url };

  } catch (err: unknown) {
    console.error("Checkout generation error:", err);
    return { url: null, error: err instanceof Error ? err.message : "Internal error" };
  }
}
