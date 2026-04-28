/**
 * Origins allowed to call same-site marketing lead APIs from the browser
 * (`/api/contact`, `/api/lead-email`). Includes production apex + Firebase App
 * Hosting / Netlify preview hosts.
 */

const APEX_SUBDOMAIN_PATTERN =
	/^https:\/\/([a-z0-9-]+\.)*designedbyanthony\.com$/i;

const LOCAL_ORIGINS = new Set<string>([
	"http://localhost:4321",
	"http://127.0.0.1:4321",
	"http://localhost:3000", // pragma: allowlist secret
	"http://127.0.0.1:3000", // pragma: allowlist secret
	"http://localhost:3100", // pragma: allowlist secret
	"http://127.0.0.1:3100", // pragma: allowlist secret
]);

const TRUSTED_HOST_SUFFIXES = [
	".hosted.app",
	".web.app",
	".firebaseapp.com",
	".netlify.app",
] as const;

/** Firebase App Hosting, Firebase Hosting, Netlify previews, etc. */
export function isTrustedHostedPreviewHostname(hostname: string): boolean {
	const h = hostname.toLowerCase();
	return TRUSTED_HOST_SUFFIXES.some((suffix) => h.endsWith(suffix));
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
