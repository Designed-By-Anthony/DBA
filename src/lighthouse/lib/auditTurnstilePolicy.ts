/**
 * `/lighthouse` audit bot gate: Turnstile is **opt-in** so production stays
 * stable without Cloudflare iframe + CSP friction. Set
 * `LIGHTHOUSE_STRICT_TURNSTILE=1` with `TURNSTILE_SECRET_KEY` + site key to
 * restore server verification.
 */
export function isAuditTurnstileStrict(): boolean {
	const v = process.env.LIGHTHOUSE_STRICT_TURNSTILE?.trim().toLowerCase();
	return v === "1" || v === "true" || v === "yes";
}
