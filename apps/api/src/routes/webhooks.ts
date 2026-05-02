import { Elysia, t } from "elysia";
import { leads, transactions, tryInsertLead, tryInsertTransaction } from "@dba/shared/lib/d1Leads";
import { createD1Client } from "@dba/shared/db/client";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

interface CfEnv {
  // D1Database is a CF Workers global; use unknown for TS compat outside worker context
  DB?: unknown;
}

export const webhooks = new Elysia({ prefix: "/webhooks" }).post(
  "/stripe",
  async ({ body, headers, store }) => {
    const sig = headers["stripe-signature"];
    if (!sig) {
      return { status: 400, body: { error: "Missing stripe-signature header" } };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      return {
        status: 400,
        body: { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_email;
      const amountTotal = session.amount_total;
      const stripeSessionId = session.id;

      if (!customerEmail) {
        return { status: 400, body: { error: "Missing customer_email in session" } };
      }

      // Upsert lead via global ledger db (wired in index.ts at startup)
      const leadId = crypto.randomUUID();
      await tryInsertLead({
        id: leadId,
        email: customerEmail,
        source: "Contact_Form",
        status: "Closed",
        turnstile_passed: null,
        metadata: JSON.stringify({ stripeSessionId, plan: session.metadata?.plan ?? null }),
        created_at: Date.now(),
      });

      // Resolve actual lead id (may differ if upsert hit existing row)
      let resolvedLeadId = leadId;
      try {
        const d1 = (store as { env?: CfEnv }).env?.DB;
        if (d1) {
          const db = createD1Client(d1);
          const existing = await db
            .select({ id: leads.id })
            .from(leads)
            .where(eq(leads.email, customerEmail))
            .limit(1);
          if (existing[0]) resolvedLeadId = existing[0].id;
        }
      } catch {
        // best-effort — fall back to generated id
      }

      await tryInsertTransaction({
        stripe_session_id: stripeSessionId,
        customer_email: customerEmail,
        amount_total: amountTotal,
        plan_name: session.metadata?.plan ?? null,
        status: "completed",
        lead_id: resolvedLeadId,
        created_at: Date.now(),
      });
    }

    return { status: 200, body: { received: true } };
  },
  {
    body: t.String(),
    headers: t.Object({
      "stripe-signature": t.String(),
    }),
  },
);