/**
 * Stripe webhook signature verification using the Web Crypto API.
 *
 * Implements the same algorithm as `stripe.webhooks.constructEvent()` without
 * requiring the Stripe Node.js SDK — compatible with the Cloudflare Workers
 * runtime (`nodejs_compat`).
 *
 * Reference: https://stripe.com/docs/webhooks/signatures
 */

const TOLERANCE_SECONDS = 300; // reject events older than 5 minutes

/**
 * Verifies a Stripe `stripe-signature` header against the raw request body.
 *
 * @returns `true` if the signature is valid and within the replay-attack window.
 */
export async function verifyStripeSignature(
	rawBody: string,
	signatureHeader: string,
	secret: string,
): Promise<boolean> {
	// Parse the header: "t=<timestamp>,v1=<sig>[,v1=<sig>...]"
	const parts: Record<string, string[]> = {};
	for (const chunk of signatureHeader.split(",")) {
		const eq = chunk.indexOf("=");
		if (eq === -1) continue;
		const key = chunk.slice(0, eq);
		const val = chunk.slice(eq + 1);
		if (!parts[key]) parts[key] = [];
		parts[key].push(val);
	}

	const timestamp = parts["t"]?.[0];
	const signatures = parts["v1"] ?? [];

	if (!timestamp || signatures.length === 0) return false;

	// Replay-attack guard
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - Number(timestamp)) > TOLERANCE_SECONDS) return false;

	const signedPayload = `${timestamp}.${rawBody}`;
	const enc = new TextEncoder();

	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const mac = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));

	const computed = Array.from(new Uint8Array(mac))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return signatures.some((sig) => sig === computed);
}
