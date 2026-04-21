import crypto from "crypto";

/**
 * Shared helpers for authenticating incoming webhook requests.
 *
 * All helpers here fail closed: if the required env var is missing or the
 * signature / secret does not match, the caller is expected to treat that
 * as "reject". There is no fallback to unauthenticated parsing.
 */

/** Constant-time string compare. Returns false if lengths differ (without throwing). */
export function timingSafeEqualStr(a: string, b: string): boolean {
	const aBuf = Buffer.from(a, "utf8");
	const bBuf = Buffer.from(b, "utf8");
	if (aBuf.length !== bBuf.length) return false;
	return crypto.timingSafeEqual(aBuf, bBuf);
}

/** Resolve a webhook secret from env; returns null (not "") when unset. */
export function getSecret(envName: string): string | null {
	const v = process.env[envName];
	return v && v.length > 0 ? v : null;
}

/**
 * Verify a Calendly webhook signature header.
 *
 * Header format (Calendly docs): `t=<unix_ts>,v1=<hex_hmac_sha256>`
 * Signed string: `${ts}.${rawBody}`, key = Calendly webhook signing key.
 *
 * @param rawBody - exact request body string (must be the unparsed body).
 * @param headerValue - value of the `Calendly-Webhook-Signature` header.
 * @param signingKey - the signing key Calendly returned when the webhook was created.
 * @param toleranceSeconds - reject if `t` is older than this (default 5 min).
 */
export function verifyCalendlySignature(
	rawBody: string,
	headerValue: string | null,
	signingKey: string,
	toleranceSeconds = 300,
): boolean {
	if (!headerValue) return false;

	let ts: string | undefined;
	let v1: string | undefined;
	for (const part of headerValue.split(",")) {
		const [k, v] = part.split("=", 2);
		if (k === "t") ts = v;
		else if (k === "v1") v1 = v;
	}
	if (!ts || !v1) return false;

	const tsNum = Number(ts);
	if (!Number.isFinite(tsNum)) return false;
	const nowSec = Math.floor(Date.now() / 1000);
	if (Math.abs(nowSec - tsNum) > toleranceSeconds) return false;

	const expected = crypto
		.createHmac("sha256", signingKey)
		.update(`${ts}.${rawBody}`)
		.digest("hex");

	try {
		return crypto.timingSafeEqual(
			Buffer.from(expected, "hex"),
			Buffer.from(v1, "hex"),
		);
	} catch {
		return false;
	}
}

/**
 * Verify a simple shared-secret header (for our own internal webhooks
 * like /api/webhooks/agentic, /api/webhooks/idx).
 *
 * Pattern: caller sends `Authorization: Bearer <secret>` OR
 *          `x-webhook-secret: <secret>`. We accept either to make retrofit
 *          of existing callers easier. Both comparisons are constant-time.
 */
export function verifySharedSecret(
	headers: Headers,
	expected: string,
): boolean {
	const auth = headers.get("authorization");
	if (auth?.startsWith("Bearer ")) {
		if (timingSafeEqualStr(auth.slice("Bearer ".length), expected)) return true;
	}
	const direct = headers.get("x-webhook-secret");
	if (direct && timingSafeEqualStr(direct, expected)) return true;
	return false;
}
