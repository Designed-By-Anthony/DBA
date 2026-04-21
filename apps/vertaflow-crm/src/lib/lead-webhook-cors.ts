import type { NextRequest } from "next/server";

/**
 * CORS helper for lead endpoints (`/api/lead`, `/api/webhooks/lead`).
 *
 * Now that admin. and accounts. are separate subdomains of
 * vertaflow.io (see `middleware.ts` Chameleon rules), the
 * browser fetch from admin. → accounts. (or marketing → admin.) is a
 * cross-origin request — it must be allow-listed here or the CRM will
 * reject requests from its own family.
 *
 * Rules:
 *   1. If the Origin matches the `LEAD_WEBHOOK_CORS_ORIGINS` explicit
 *      allow-list, echo it back.
 *   2. Otherwise, accept any `https://*.vertaflow.io` origin
 *      (cross-subdomain requests within our own family).
 *   3. For server-to-server POSTs (no Origin header) fall through to the
 *      first allow-listed origin — the CORS header is irrelevant there
 *      since the request isn't subject to same-origin policy.
 */
const DEFAULT_ORIGINS = [
	"https://vertaflow.io",
	"https://www.vertaflow.io",
	"https://admin.vertaflow.io",
	"https://accounts.vertaflow.io",
	"https://login.vertaflow.io",
	"https://lighthouse.vertaflow.io",
	"https://designedbyanthony.com",
	"https://www.designedbyanthony.com",
	"http://localhost:4321",
	"http://127.0.0.1:4321",
	`http://localhost:${3000}`,
	"http://127.0.0.1:3000",
];

const VERTAFLOW_SUBDOMAIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)*vertaflow\.io$/i;
const DBA_SUBDOMAIN_PATTERN =
	/^https:\/\/([a-z0-9-]+\.)*designedbyanthony\.com$/i;

export function isLeadWebhookOriginAllowed(
	origin: string | null | undefined,
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	if (!origin) return false;
	const configured = (env.LEAD_WEBHOOK_CORS_ORIGINS ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const allowed = configured.length > 0 ? configured : DEFAULT_ORIGINS;
	if (allowed.includes(origin)) return true;
	// Cross-subdomain CRM/marketing families (studio site + VertaFlow).
	return (
		VERTAFLOW_SUBDOMAIN_PATTERN.test(origin) ||
		DBA_SUBDOMAIN_PATTERN.test(origin)
	);
}

/** Origins allowed to POST lead endpoints from a browser (marketing site, local dev, sibling subdomains). */
export function leadWebhookCorsHeaders(
	request: NextRequest,
): Record<string, string> {
	const origin = request.headers.get("origin");
	const configured = (process.env.LEAD_WEBHOOK_CORS_ORIGINS ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const allowed = configured.length > 0 ? configured : DEFAULT_ORIGINS;

	const allow = isLeadWebhookOriginAllowed(origin)
		? origin!
		: (allowed[0] ?? "https://vertaflow.io");

	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type, x-webhook-secret, x-lead-secret, x-dba-secret, x-tenant-id, x-agency-id, Authorization",
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Max-Age": "86400",
		Vary: "Origin",
	};
}
