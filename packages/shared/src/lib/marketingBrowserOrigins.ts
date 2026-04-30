/**
 * Origins allowed to call same-site marketing lead APIs from the browser.
 * Production: designedbyanthony.com (+ subdomains)
 * Staging: Cloudflare Pages preview hosts (*.pages.dev)
 * Local dev: localhost/127.0.0.1 ports used by the monorepo.
 */

const APEX_SUBDOMAIN_PATTERN =
	/^https:\/\/([a-z0-9-]+\.)*designedbyanthony\.com$/i;

const LOCAL_ORIGINS = new Set<string>([
	"http://localhost:3000", // pragma: allowlist secret
	"http://127.0.0.1:3000", // pragma: allowlist secret
	"http://localhost:3100", // pragma: allowlist secret
	"http://127.0.0.1:3100", // pragma: allowlist secret
]);

const PAGES_PREVIEW_HOST_PATTERN = /\.pages\.dev$/i;

/** Backwards-compatible helper for modules that check preview hostnames directly. */
export function isTrustedHostedPreviewHostname(hostname: string): boolean {
	return PAGES_PREVIEW_HOST_PATTERN.test(hostname);
}

export function isTrustedMarketingBrowserOrigin(
	origin: string | null,
): boolean {
	if (!origin) return false;
	if (APEX_SUBDOMAIN_PATTERN.test(origin)) return true;
	if (LOCAL_ORIGINS.has(origin)) return true;
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		return isTrustedHostedPreviewHostname(url.hostname);
	} catch {
		return false;
	}
}

export function buildMarketingLeadApiCorsHeaders(
	origin: string | null,
): Record<string, string> {
	const allowed = isTrustedMarketingBrowserOrigin(origin);
	const allow = allowed && origin ? origin : "https://designedbyanthony.com";
	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		Vary: "Origin",
	};
}
