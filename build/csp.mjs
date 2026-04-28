/**
 * Single source of truth for marketing CSP (used by `next.config.ts` and synced into `static-headers.json`).
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
 * Legacy Lighthouse subdomain origin — kept in CSP so any historical inbound
 * links continue to resolve via redirect; the audit now lives on the apex at
 * `/lighthouse`. Safe to drop once analytics confirms zero traffic.
 */
const LIGHTHOUSE_SUBDOMAIN_ORIGIN = "https://lighthouse.designedbyanthony.com";

/** GA4 + Turnstile loader; no data:/unsafe-eval (report-only probe). */
const REPORT_ONLY_SCRIPT_SRC = [
	"'self'",
	"'unsafe-inline'",
	"https://www.googletagmanager.com",
	"https://*.google-analytics.com",
	"https://*.googletagmanager.com",
	"https://www.google.com",
	"https://www.gstatic.com",
	"https://challenges.cloudflare.com",
].join(" ");

/**
 * Enforcing script-src: same tag surface + data:/unsafe-eval for Next client bundles.
 */
const SCRIPT_SRC_ENFORCING = [
	"'self'",
	"data:",
	"'unsafe-inline'",
	"'unsafe-eval'",
	"https://www.googletagmanager.com",
	"https://*.google-analytics.com",
	"https://*.googletagmanager.com",
	"https://www.google.com",
	"https://www.gstatic.com",
	"https://challenges.cloudflare.com",
	"https://client.crisp.chat",
	"https://settings.crisp.chat",
	/** Freshworks CRM web forms (form embed only; chat is Crisp). */
	"https://*.myfreshworks.com",
	"https://*.freshworks.com",
].join(" ");

const DIRECTIVES = {
	"default-src": "'self'",
	"script-src": SCRIPT_SRC_ENFORCING,
	"style-src":
		"'self' 'unsafe-inline' https://fonts.googleapis.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com https://client.crisp.chat https://*.myfreshworks.com https://*.freshworks.com",
	"font-src":
		"'self' data: https://fonts.gstatic.com https://client.crisp.chat https://*.myfreshworks.com https://*.freshworks.com",
	"img-src":
		"'self' data: https: blob: https://s3.amazonaws.com https://image.crisp.chat https://client.crisp.chat https://storage.crisp.chat",
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
		/** Crisp Chat — wildcards match current + fallback relay hosts (Crisp CSP guide, Dec 2024). */
		"https://*.crisp.chat",
		"wss://*.relay.crisp.chat",
		"wss://*.relay.rescue.crisp.chat",
		/** Freshworks CRM web form (no chat). */
		"https://*.myfreshworks.com",
		"https://*.freshworks.com",
	].join(" "),
	"frame-src":
		"'self' https://www.google.com https://challenges.cloudflare.com https://calendly.com https://www.youtube-nocookie.com https://www.youtube.com https://game.crisp.chat https://plugins.crisp.chat https://*.myfreshworks.com",
	"media-src": "'self'",
	/** Crisp loads short-lived workers from *.crisp.chat (see Crisp CSP docs). */
	"worker-src": "'self' blob: https://*.crisp.chat",
	"object-src": "'none'",
	"base-uri": "'self'",
	"frame-ancestors": "'self'",
	/** Lead forms POST CRM `/api/lead`; Lighthouse tool uses `/api/audit` + report fetch. */
	"form-action": `'self' ${LIGHTHOUSE_AUDIT_API_ORIGIN} ${LIGHTHOUSE_SUBDOMAIN_ORIGIN} ${VERTAFLOW_CRM_ORIGIN} https://*.myfreshworks.com`,
	/**
	 * Intentionally no `require-trusted-types-for` here: Next.js + React hydration and
	 * Turbopack chunks assign plain strings to DOM sinks (e.g. innerHTML) in ways that
	 * still break under enforced Trusted Types even with a permissive `default` policy
	 * registered from `MarketingChrome`. Re-enable only after framework support is proven.
	 */
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
