import { createHmac, timingSafeEqual } from "crypto";

const SIG_PREFIX = "v1|";

/**
 * HMAC-SHA256 hex for embed widget script URL + API calls.
 * Scoped per tenant — rotating `LEAD_EMBED_WIDGET_SECRET` revokes all embeds.
 */
export function signEmbedTenant(tenantId: string, secret: string): string {
	const msg = `${SIG_PREFIX}${tenantId.trim()}`;
	return createHmac("sha256", secret).update(msg, "utf8").digest("hex");
}

export function verifyEmbedTenantSignature(
	tenantId: string,
	sigHex: string,
	secret: string | undefined,
): boolean {
	if (!secret?.trim() || !tenantId.trim() || !sigHex.trim()) return false;
	const expected = signEmbedTenant(tenantId, secret.trim());
	try {
		const a = Buffer.from(expected, "hex");
		const b = Buffer.from(sigHex.trim(), "hex");
		return a.length === b.length && timingSafeEqual(a, b);
	} catch {
		return false;
	}
}
