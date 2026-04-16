/**
 * Cloudflare Turnstile site keys.
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 *
 * For local dev (`astro dev`), the test key is used automatically so the widget works on localhost.
 * For `astro preview` on `localhost` / `127.0.0.1`, `Layout.astro` rewrites `data-sitekey` to the test key
 * before loading `api.js`, so production builds can be previewed without Turnstile 110200.
 * Override anytime with `PUBLIC_TURNSTILE_SITE_KEY` (see `.env.example`). API verification must use the matching secret for test keys.
 */
export const TURNSTILE_SITE_KEY_TEST_ALWAYS_PASS = '1x00000000000000000000AA';

export const TURNSTILE_SITE_KEY_PRODUCTION = '0x4AAAAAAC2YcBhp6CTslR9_';

export function getTurnstileSiteKey(): string {
  const fromEnv = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return TURNSTILE_SITE_KEY_TEST_ALWAYS_PASS;
  return TURNSTILE_SITE_KEY_PRODUCTION;
}
