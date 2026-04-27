/**
 * Cloudflare Turnstile site keys.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
export const TURNSTILE_SITE_KEY_TEST_ALWAYS_PASS = "1x00000000000000000000AA";

export const TURNSTILE_SITE_KEY_PRODUCTION = "0x4AAAAAAC2YcBhp6CTslR9_";

export function getTurnstileSiteKey(): string {
	const fromEnv = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
	if (fromEnv) return fromEnv;
	if (process.env.NODE_ENV === "development")
		return TURNSTILE_SITE_KEY_TEST_ALWAYS_PASS;
	return TURNSTILE_SITE_KEY_PRODUCTION;
}
