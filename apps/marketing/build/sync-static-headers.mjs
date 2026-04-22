/**
 * Injects CSP strings from ./csp.mjs into two targets:
 *
 * 1. `static-headers.json` — Firebase-style header rules consumed by
 *    `scripts/static-parity-server.mjs` (Playwright E2E harness on :5500).
 * 2. `vercel.json` — **production** header rules applied by Vercel on the
 *    apex (`designedbyanthony.com`) deployment. Prior to this, the CSP +
 *    baseline security headers lived only in (1), which Vercel never read,
 *    so the live site shipped without CSP / COOP / Referrer-Policy / etc.
 *
 * Both targets are generated from the same `csp.mjs` source of truth so
 * the test harness and live site can never drift.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildContentSecurityPolicyEnforcingMaybe,
	buildContentSecurityPolicyReportOnlyMaybe,
	buildReportToHeader,
	buildSentryCspReportUrl,
} from "./csp.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const staticHeadersPath = join(root, "static-headers.json");
const vercelConfigPath = join(root, "vercel.json");

const reportUrl = buildSentryCspReportUrl();
if (!reportUrl) {
	console.warn(
		"sync-static-headers: PUBLIC_SENTRY_DSN unset — CSP will omit report-uri/report-to (set env for violation reporting).",
	);
}

const cspEnforcing = buildContentSecurityPolicyEnforcingMaybe(reportUrl);
const cspReportOnly = buildContentSecurityPolicyReportOnlyMaybe(reportUrl);
const reportTo = reportUrl ? buildReportToHeader(reportUrl) : null;

/** hstspreload.org requires this exact policy on responses (not only on static assets). */
const HSTS_PRELOAD = "max-age=63072000; includeSubDomains; preload";

/** Baseline security headers (apply to every response, document or asset). */
const BASELINE_SECURITY_HEADERS = [
	{ key: "Strict-Transport-Security", value: HSTS_PRELOAD },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), xr-spatial-tracking=()",
	},
];

/** HTML-document headers (CSP + cache-busting + reporting). */
const htmlHeaders = [
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{ key: "Strict-Transport-Security", value: HSTS_PRELOAD },
	{ key: "Content-Security-Policy", value: cspEnforcing },
	{ key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
	...(reportTo ? [{ key: "Report-To", value: reportTo }] : []),
];

/** Paths that must never be indexed by Google (marketing funnels / utility pages). */
const NOINDEX_PATHS = {
	individual: ["/thank-you", "/facebook-offer", "/404"],
	reportPrefix: "/report",
};

// ---------------------------------------------------------------------------
// 1. static-headers.json — Firebase-style static parity for Playwright
// ---------------------------------------------------------------------------

const staticRaw = readFileSync(staticHeadersPath, "utf8");
const staticConfig = JSON.parse(staticRaw);

const hostingHeaders = staticConfig.hosting?.headers;
if (!Array.isArray(hostingHeaders)) {
	console.error("sync-static-headers: hosting.headers missing");
	process.exit(1);
}

let updated = 0;
for (const block of hostingHeaders) {
	if (block.regex !== "^/$" && block.regex !== "^/[^/.]+(?:/[^/.]+)*$")
		continue;
	block.headers = htmlHeaders;
	updated += 1;
}

if (updated !== 2) {
	console.error(
		`sync-static-headers: expected 2 HTML CSP blocks, found ${updated}`,
	);
	process.exit(1);
}

const catchAll = hostingHeaders.find((h) => h.source === "**");
if (!catchAll?.headers) {
	console.error("sync-static-headers: catch-all ** headers block not found");
	process.exit(1);
}

for (const h of catchAll.headers) {
	if (h.key === "Strict-Transport-Security") {
		h.value = HSTS_PRELOAD;
	}
}

writeFileSync(
	staticHeadersPath,
	`${JSON.stringify(staticConfig, null, 2)}\n`,
	"utf8",
);

// ---------------------------------------------------------------------------
// 2. vercel.json — production header rules for the live apex deployment
// ---------------------------------------------------------------------------
//
// Vercel applies every matching `headers` rule (not first-match), so we
// layer: baseline security → HTML-only CSP → path-scoped noindex. Source
// patterns use path-to-regexp; `.*` is a safe catch-all for asset paths
// because assets ignore CSP anyway and browsers only enforce CSP on
// documents.

const vercelRaw = readFileSync(vercelConfigPath, "utf8");
const vercelConfig = JSON.parse(vercelRaw);

/** Assets already get long-cache Cache-Control from @astrojs/vercel; we only need security layers here. */
const vercelHeaders = [
	{
		source: "/(.*)",
		headers: [
			...BASELINE_SECURITY_HEADERS,
			{ key: "Content-Security-Policy", value: cspEnforcing },
			{ key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
			...(reportTo ? [{ key: "Report-To", value: reportTo }] : []),
		],
	},
	{
		source: `/(${NOINDEX_PATHS.individual.map((p) => p.slice(1)).join("|")})`,
		headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
	},
	{
		source: NOINDEX_PATHS.reportPrefix,
		headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
	},
	{
		source: `${NOINDEX_PATHS.reportPrefix}/:path*`,
		headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
	},
];

vercelConfig.headers = vercelHeaders;

writeFileSync(
	vercelConfigPath,
	`${JSON.stringify(vercelConfig, null, 2)}\n`,
	"utf8",
);

console.log(
	"sync-static-headers: wrote static-headers.json + vercel.json (CSP, HSTS preload, X-Content-Type-Options, Referrer-Policy, COOP, Permissions-Policy, per-path X-Robots-Tag)",
);
