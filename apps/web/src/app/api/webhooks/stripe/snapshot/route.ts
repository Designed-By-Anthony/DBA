/**
 * Stripe "Snapshot" Webhook — /api/webhooks/stripe/snapshot
 *
 * Receives data-heavy Stripe events used for full state synchronization
 * (e.g. `customer.updated`, `invoice.finalized`, subscription lifecycle
 * events). Registered in the Stripe dashboard as a separate endpoint from
 * the Thin webhook so the larger payloads do not compete with fast-path
 * status updates.
 *
 * Secret: STRIPE_SNAPSHOT_WEBHOOK_SECRET
 */

import { verifyStripeSignature } from "../_verify";

export async function POST(req: Request): Promise<Response> {
	const secret = process.env.STRIPE_SNAPSHOT_WEBHOOK_SECRET;
	if (!secret) {
		console.error(
			"[stripe/snapshot] STRIPE_SNAPSHOT_WEBHOOK_SECRET is not configured",
		);
		return new Response("Webhook secret not configured", { status: 500 });
	}

	const rawBody = await req.text();
	const signatureHeader = req.headers.get("stripe-signature") ?? "";

	const valid = await verifyStripeSignature(rawBody, signatureHeader, secret);
	if (!valid) {
		console.error("[stripe/snapshot] Signature verification failed");
		return new Response("Invalid signature", { status: 400 });
	}

	let event: { type: string; id: string; data?: unknown };
	try {
		event = JSON.parse(rawBody) as typeof event;
	} catch {
		console.error("[stripe/snapshot] Failed to parse event body");
		return new Response("Invalid JSON", { status: 400 });
	}

	// Data-heavy state synchronization events
	switch (event.type) {
		case "customer.updated":
			// TODO: sync customer record to internal data store
			break;
		case "customer.subscription.created":
		case "customer.subscription.updated":
		case "customer.subscription.deleted":
			// TODO: reconcile subscription state
			break;
		case "invoice.finalized":
		case "invoice.paid":
		case "invoice.payment_failed":
			// TODO: update invoice records / trigger dunning flow
			break;
		default:
			// Unhandled event types are silently acknowledged
			break;
	}

	return new Response(null, { status: 200 });
}
