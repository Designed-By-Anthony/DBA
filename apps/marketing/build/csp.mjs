/**
 * Single source of truth for Firebase Hosting CSP-related headers.
 * Run `npm run sync:firebase-csp` to write values into `firebase.json`.
 *
 * Third-party *tags* (after cookie consent): Google Tag Manager / Analytics, Microsoft Clarity,
 * Crazy Egg. (Configured in GTM; keep the container aligned — CSP matches that surface.)
 * Always-on site needs: Cloudflare Turnstile (forms), Sentry, Lighthouse audit API, Agency OS lead ingest.
 */

const DEFAULT_SENTRY_DSN =
  'https://0d490516ab9f385b16ea4210a1f9622e@o4511201601912832.ingest.us.sentry.io/4511201603158016';

/** Default `PUBLIC_API_URL` (Lighthouse audit/report APIs). Must stay aligned with client fallbacks. */
const LIGHTHOUSE_AUDIT_API_ORIGIN = 'https://lighthouse-audit--lighthouse-492701.us-east4.hosted.app';

/** Agency OS public lead ingest (`POST /api/lead`). Align with `PUBLIC_CRM_LEAD_URL` / marketing defaults. */
const AGENCY_OS_VIEWER_ORIGIN = 'https://admin.designedbyanthony.com';

/** GTM + GA + Clarity + Crazy Egg + Turnstile loader; no data:/unsafe-eval (report-only probe). */
const REPORT_ONLY_SCRIPT_SRC =
  "'self' 'unsafe-inline' https://www.googletagmanager.com https://*.google-analytics.com https://*.googletagmanager.com https://www.gstatic.com https://www.clarity.ms https://*.clarity.ms https://*.crazyegg.com https://challenges.cloudflare.com";

/**
 * Enforcing script-src: same tag surface + data:/unsafe-eval for Astro client bundles and GTM-injected scripts.
 */
const SCRIPT_SRC_ENFORCING = [
  "'self'",
  'data:',
  "'unsafe-inline'",
  "'unsafe-eval'",
  'https://www.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.googletagmanager.com',
  'https://www.gstatic.com',
  'https://www.clarity.ms',
  'https://*.clarity.ms',
  'https://*.crazyegg.com',
  'https://challenges.cloudflare.com',
].join(' ');

const DIRECTIVES = {
  'default-src': "'self'",
  'script-src': SCRIPT_SRC_ENFORCING,
  'style-src':
    "'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://challenges.cloudflare.com",
  'font-src': "'self' data: https://fonts.gstatic.com",
  'img-src': "'self' data: https: blob: https://s3.amazonaws.com",
  'connect-src': [
    "'self'",
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://*.google.com',
    'https://designedbyanthony.com',
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://*.googleapis.com',
    'https://*.clarity.ms',
    'https://*.crazyegg.com',
    LIGHTHOUSE_AUDIT_API_ORIGIN,
    AGENCY_OS_VIEWER_ORIGIN,
    'https://challenges.cloudflare.com',
    'https://pagead2.googlesyndication.com',
    'https://www.googleadservices.com',
    'https://*.ingest.us.sentry.io',
    'https://*.ingest.de.sentry.io',
  ].join(' '),
  'frame-src':
    "'self' https://www.googletagmanager.com https://challenges.cloudflare.com https://calendly.com https://www.youtube-nocookie.com https://www.youtube.com",
  'media-src': "'self'",
  'worker-src': "'self' blob:",
  'object-src': "'none'",
  'base-uri': "'self'",
  'frame-ancestors': "'self'",
  /** Lead forms POST CRM `/api/lead`; Lighthouse tool uses `/api/audit` + report fetch. */
  'form-action': `'self' ${LIGHTHOUSE_AUDIT_API_ORIGIN} ${AGENCY_OS_VIEWER_ORIGIN}`,
  /**
   * Trusted Types: mitigates DOM XSS sinks. Keep `require-trusted-types-for` enabled,
   * but allow third-party scripts (GTM/Clarity/etc.) to register their own policies.
   * `Layout.astro` still creates the permissive `default` policy first.
   */
  'trusted-types': "* 'allow-duplicates'",
  'require-trusted-types-for': "'script'",
};

const REPORT_TO_GROUP = 'csp-endpoint';

/**
 * @param {string} dsn
 * @returns {{ key: string, projectId: string, host: string } | null}
 */
export function parseSentryDsn(dsn) {
  try {
    const u = new URL(dsn);
    const key = u.username;
    const projectId = u.pathname.replace(/^\//, '').replace(/\/$/, '');
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
export function buildSentryCspReportUrl(dsn = process.env.PUBLIC_SENTRY_DSN ?? DEFAULT_SENTRY_DSN) {
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return null;
  const url = new URL(`https://${parsed.host}/api/${parsed.projectId}/security/`);
  url.searchParams.set('sentry_key', parsed.key);
  const env = process.env.SENTRY_CSP_ENVIRONMENT ?? process.env.PUBLIC_SENTRY_ENVIRONMENT;
  if (env) url.searchParams.set('sentry_environment', env);
  return url.toString();
}

function joinDirectives(map) {
  return Object.entries(map)
    .map(([k, v]) => `${k} ${v}`)
    .join('; ');
}

/**
 * Enforcing CSP + reporting (report-uri for broad support, report-to for modern browsers).
 */
export function buildContentSecurityPolicyEnforcing(reportUrl) {
  const withReporting = {
    ...DIRECTIVES,
    'report-uri': reportUrl,
    'report-to': REPORT_TO_GROUP,
  };
  return joinDirectives(withReporting);
}

/**
 * Stricter policy: script-src without data: and without unsafe-eval (report-only → Sentry).
 */
export function buildContentSecurityPolicyReportOnly(reportUrl) {
  const withReporting = {
    ...DIRECTIVES,
    'script-src': REPORT_ONLY_SCRIPT_SRC,
    'report-uri': reportUrl,
    'report-to': REPORT_TO_GROUP,
  };
  return joinDirectives(withReporting);
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
