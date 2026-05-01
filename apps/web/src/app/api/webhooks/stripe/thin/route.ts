/**
 * Stripe "Thin" Webhook — /api/webhooks/stripe/thin
 *
 * Receives lightweight, high-frequency Stripe events (e.g.
 * `checkout.session.completed`) for immediate status updates. Registered
 * in the Stripe dashboard as a separate endpoint from the Snapshot webhook
 * so each can receive only the event types it needs.
 *
 * Secret: STRIPE_THIN_WEBHOOK_SECRET
 */

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

	// High-speed status update events
	switch (event.type) {
		case "checkout.session.completed":
			// TODO: fulfill order / update subscription status
			break;
		case "payment_intent.succeeded":
			// TODO: mark payment as confirmed
			break;
		case "payment_intent.payment_failed":
			// TODO: notify customer / retry logic
			break;
		default:
			// Unhandled event types are silently acknowledged
			break;
	}

	return new Response(null, { status: 200 });
}
