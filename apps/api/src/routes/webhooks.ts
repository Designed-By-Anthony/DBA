import { Elysia, t } from "elysia";
import { db } from "@dba/shared";
import { leads, transactions } from "@dba/shared/src/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const webhooks = new Elysia({ prefix: "/webhooks" })
  .post(
    "/stripe",
    async ({ body, headers }) => {
      const sig = headers["stripe-signature"];
      if (!sig) {
        return {
          status: 400,
          body: { error: "Missing stripe-signature header" },
        };
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET!
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
          return {
            status: 400,
            body: { error: "Missing customer_email in session" },
          };
        }

        const existingLead = await db
          .select()
          .from(leads)
          .where(eq(leads.email, customerEmail))
          .get();

        let leadId: string;
        if (existingLead) {
          await db
            .update(leads)
            .set({ status: "Active Client" })
            .where(eq(leads.id, existingLead.id))
            .run();
          leadId = existingLead.id;
        } else {
          const newLead = await db
            .insert(leads)
            .values({
              id: crypto.randomUUID(),
              email: customerEmail,
              source: "Contact_Form",
              status: "Active Client",
              created_at: Date.now(),
            })
            .returning({ id: leads.id })
            .get();
          leadId = newLead.id;
        }

        await db
          .insert(transactions)
          .values({
            stripe_session_id: stripeSessionId,
            customer_email: customerEmail,
            amount_total: amountTotal,
            status: "completed",
            lead_id: leadId,
            created_at: Date.now(),
          })
          .run();
      }

      return { status: 200, body: { received: true } };
    },
    {
      body: t.String(),
      headers: t.Object({
        "stripe-signature": t.String(),
      }),
    }
  );