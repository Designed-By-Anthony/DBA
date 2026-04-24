/**
 * Single source of truth for marketing CSP-related headers (synced into static-headers.json).
 * Run `npm run sync:static-headers` after changing directives.
 *
 * Third-party *tags* (after cookie consent): direct GA4 via gtag.js only.
 * Always-on site needs: Cloudflare Turnstile (forms), Sentry, Lighthouse audit API, Agency OS lead ingest.
 */

/** Default `PUBLIC_API_URL` (Lighthouse audit/report APIs). Must stay aligned with client fallbacks. */
const LIGHTHOUSE_AUDIT_API_ORIGIN =
	"https://lighthouse-audit--lighthouse-492701.us-east4.hosted.app";

/** VertaFlow CRM public lead ingest (`POST /api/lead`, `/api/v1/ingest`). Align with `PUBLIC_CRM_LEAD_URL` / marketing defaults. */
const VERTAFLOW_CRM_ORIGIN = "https://admin.vertaflow.io";

/**
 * Lighthouse subdomain on Vercel — hosts the audit UI, the `/api/contact`
 * legacy lead endpoint, and the interim `/api/lead-email` bridge that ships
 * marketing lead submissions to Anthony's inbox until the VertaFlow CRM
 * tenant is provisioned. Required in `connect-src` + `form-action` because
 * the browser posts cross-origin from `designedbyanthony.com` to this host.
 */
const LIGHTHOUSE_SUBDOMAIN_ORIGIN = "https://lighthouse.designedbyanthony.com";

/** GA4 + Turnstile loader; no data:/unsafe-eval (report-only probe). */
const REPORT_ONLY_SCRIPT_SRC =
	"'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://*.googletagmanager.com https://www.gstatic.com https://challenges.cloudflare.com";

/**
 * Enforcing script-src: same tag surface + data:/unsafe-eval for Astro client bundles.
 */
const SCRIPT_SRC_ENFORCING = [
	"'self'",
	"data:",
	"'unsafe-inline'",
	"'unsafe-eval'",
	"https://www.googletagmanager.com",
	"https://*.google-analytics.com",
	"https://*.googletagmanager.com",
	"https://www.gstatic.com",
	"https://challenges.cloudflare.com",
].join(" ");

const DIRECTIVES = {
	"default-src": "'self'",
	"script-src": SCRIPT_SRC_ENFORCING,
	"style-src":
		"'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://challenges.cloudflare.com",
	"font-src": "'self' data: https://fonts.gstatic.com",
	"img-src": "'self' data: https: blob: https://s3.amazonaws.com",
	"connect-src": [
		"'self'",
		"https://*.google-analytics.com",
		"https://*.analytics.google.com",
		"https://*.googletagmanager.com",
		"https://*.google.com",
		"https://designedbyanthony.com",
		"https://www.google.com",
		"https://www.gstatic.com",
		"https://*.googleapis.com",
		LIGHTHOUSE_AUDIT_API_ORIGIN,
		LIGHTHOUSE_SUBDOMAIN_ORIGIN,
		VERTAFLOW_CRM_ORIGIN,
		"https://challenges.cloudflare.com",
		"https://*.ingest.us.sentry.io",
		"https://*.ingest.de.sentry.io",
		/** GetStream Chat (REST + WebSocket) — marketing live chat widget */
		"https://chat.stream-io-api.com",
		"https://*.stream-io-api.com",
		"wss://chat.stream-io-api.com",
		"wss://*.stream-io-api.com",
	].join(" "),
	"frame-src":
		"'self' https://challenges.cloudflare.com https://calendly.com https://www.youtube-nocookie.com https://www.youtube.com",
	"media-src": "'self'",
	"worker-src": "'self' blob:",
	"object-src": "'none'",
	"base-uri": "'self'",
	"frame-ancestors": "'self'",
	/** Lead forms POST CRM `/api/lead`; Lighthouse tool uses `/api/audit` + report fetch. */
	"form-action": `'self' ${LIGHTHOUSE_AUDIT_API_ORIGIN} ${LIGHTHOUSE_SUBDOMAIN_ORIGIN} ${VERTAFLOW_CRM_ORIGIN}`,
	/**
	 * Trusted Types: mitigates DOM XSS sinks. Keep `require-trusted-types-for` enabled,
	 * but allow third-party scripts (GA4 / Turnstile / Sentry) to register their own policies.
	 * The marketing layout still creates the permissive `default` policy first (inline bootstrap).
	 */
	"trusted-types": "* 'allow-duplicates'",
	"require-trusted-types-for": "'script'",
};

const REPORT_TO_GROUP = "csp-endpoint";

/**
 * @param {string} dsn
 * @returns {{ key: string, projectId: string, host: string } | null}
 */
export function parseSentryDsn(dsn) {
	try {
		const u = new URL(dsn);
		const key = u.username;
		const projectId = u.pathname.replace(/^\//, "").replace(/\/$/, "");
		if (!key || !projectId) return null;
		return { key, projectId, host: u.host };
	} catch {
		return null;
	}
}

/**
 * Sentry ingest security endpoint for CSP violation reports.
 * @see https://docs.sentry.io/platforms/javascript/security-policy-reporting/
 */
export function buildSentryCspReportUrl(dsn = process.env.PUBLIC_SENTRY_DSN) {
	const parsed = parseSentryDsn(dsn ?? "");
	if (!parsed) return null;
	const url = new URL(
		`https://${parsed.host}/api/${parsed.projectId}/security/`,
	);
	url.searchParams.set("sentry_key", parsed.key);
	const env =
		process.env.SENTRY_CSP_ENVIRONMENT ?? process.env.PUBLIC_SENTRY_ENVIRONMENT;
	if (env) url.searchParams.set("sentry_environment", env);
	return url.toString();
}

function joinDirectives(map) {
	return Object.entries(map)
		.map(([k, v]) => `${k} ${v}`)
		.join("; ");
}

/**
 * Enforcing CSP + reporting (report-uri for broad support, report-to for modern browsers).
 */
export function buildContentSecurityPolicyEnforcing(reportUrl) {
	const withReporting = reportUrl
		? {
				...DIRECTIVES,
				"report-uri": reportUrl,
				"report-to": REPORT_TO_GROUP,
			}
		: { ...DIRECTIVES };
	return joinDirectives(withReporting);
}

/**
 * Stricter policy: script-src without data: and without unsafe-eval (report-only → Sentry).
 */
export function buildContentSecurityPolicyReportOnly(reportUrl) {
	const base = {
		...DIRECTIVES,
		"script-src": REPORT_ONLY_SCRIPT_SRC,
	};
	const withReporting = reportUrl
		? {
				...base,
				"report-uri": reportUrl,
				"report-to": REPORT_TO_GROUP,
			}
		: base;
	return joinDirectives(withReporting);
}

/** Enforcing CSP when Sentry reporting may be unavailable (no DSN in env). */
export function buildContentSecurityPolicyEnforcingMaybe(reportUrl) {
	if (!reportUrl) return joinDirectives(DIRECTIVES);
	return buildContentSecurityPolicyEnforcing(reportUrl);
}

/** Report-only CSP when Sentry reporting may be unavailable. */
export function buildContentSecurityPolicyReportOnlyMaybe(reportUrl) {
	if (!reportUrl) {
		return joinDirectives({
			...DIRECTIVES,
			"script-src": REPORT_ONLY_SCRIPT_SRC,
		});
	}
	return buildContentSecurityPolicyReportOnly(reportUrl);
}

/**
 * Separate Report-To header (paired with report-to directive).
 */
export function buildReportToHeader(reportUrl) {
	const body = {
		group: REPORT_TO_GROUP,
		max_age: 10886400,
		endpoints: [{ url: reportUrl }],
		include_subdomains: true,
	};
	return JSON.stringify(body);
}
