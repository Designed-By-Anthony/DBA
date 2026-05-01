/**
 * Stripe "Thin" Webhook — /api/webhooks/stripe/thin
 *
 * Secret: STRIPE_THIN_WEBHOOK_SECRET
 */

import { createD1Client, leads } from "@dba/shared/db/client";
import { tryInsertTransaction } from "@dba/shared/lib/d1Leads";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { verifyStripeSignature } from "../_verify";

export async function POST(req: Request): Promise<Response> {
	const secret = process.env.STRIPE_THIN_WEBHOOK_SECRET;
	if (!secret) {
		console.error("[stripe/thin] STRIPE_THIN_WEBHOOK_SECRET is not configured");
		return new Response("Webhook secret not configured", { status: 500 });
	}

	const rawBody = await req.text();
	const signatureHeader = req.headers.get("stripe-signature") ?? "";

	const valid = await verifyStripeSignature(rawBody, signatureHeader, secret);
	if (!valid) {
		console.error("[stripe/thin] Signature verification failed");
		return new Response("Invalid signature", { status: 400 });
	}

	let event: { type: string; id: string; data?: unknown };
	try {
		event = JSON.parse(rawBody) as typeof event;
	} catch {
		console.error("[stripe/thin] Failed to parse event body");
		return new Response("Invalid JSON", { status: 400 });
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = (event.data as { object?: Record<string, unknown> })
				?.object;
			if (session && typeof session.id === "string") {
				const customerEmail =
					typeof session.customer_email === "string"
						? session.customer_email
						: typeof session.customer_details === "object" &&
								session.customer_details &&
								typeof (session.customer_details as { email?: string })
									.email === "string"
							? (session.customer_details as { email: string }).email
							: null;
				const amountTotal =
					typeof session.amount_total === "number"
						? session.amount_total
						: null;
				const meta =
					typeof session.metadata === "object" && session.metadata
						? (session.metadata as Record<string, string>)
						: {};
				const planName =
					typeof meta.plan_name === "string" ? meta.plan_name : null;
				const paymentStatus =
					typeof session.payment_status === "string"
						? session.payment_status
						: "complete";

				let envWithDb: { DB?: unknown } = {};
				try {
					envWithDb = getCloudflareContext().env as { DB?: unknown };
				} catch {
					envWithDb = {};
				}

				const d1 = envWithDb.DB;
				if (d1) {
					const db = createD1Client(d1);
					const row = {
						stripe_session_id: session.id,
						customer_email: customerEmail,
						amount_total: amountTotal,
						plan_name: planName,
						status: paymentStatus,
						created_at: Date.now(),
					};
					await tryInsertTransaction(row, db);
					if (customerEmail) {
						try {
							await db
								.update(leads)
								.set({ status: "Provisioning" })
								.where(eq(leads.email, customerEmail));
						} catch {
							/* non-fatal */
						}
					}
				}
			}
			break;
		}
		case "payment_intent.succeeded":
			break;
		case "payment_intent.payment_failed":
			break;
		default:
			break;
	}

	return new Response(null, { status: 200 });
}
