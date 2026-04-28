/**
 * Injects CSP strings from ./csp.mjs into `static-headers.json` — header
 * rules consumed by `scripts/static-parity-server.mjs` (Playwright E2E
 * harness on :5500).
 *
 * Production CSP, baseline security headers, and per-path `X-Robots-Tag` are
 * applied by Next.js `headers()` in `next.config.ts` (same `build/csp.mjs`
 * source of truth).
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

const reportUrl = buildSentryCspReportUrl();
if (!reportUrl) {
	console.warn(
		"sync-static-headers: PUBLIC_SENTRY_DSN unset — CSP will omit report-uri/report-to (for violation reporting).",
	);
}

const cspEnforcing = buildContentSecurityPolicyEnforcingMaybe(reportUrl);
const cspReportOnly = buildContentSecurityPolicyReportOnlyMaybe(reportUrl);
const reportTo = reportUrl ? buildReportToHeader(reportUrl) : null;

/** hstspreload.org requires this exact policy on responses (not only on static assets). */
const HSTS_PRELOAD = "max-age=63072000; includeSubDomains; preload";

/** HTML-document headers (CSP + cache-busting + reporting). */
const htmlHeaders = [
	{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
	{ key: "Strict-Transport-Security", value: HSTS_PRELOAD },
	{ key: "Content-Security-Policy", value: cspEnforcing },
	{ key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
	...(reportTo ? [{ key: "Report-To", value: reportTo }] : []),
];

// ---------------------------------------------------------------------------
// 1. static-headers.json — static parity for Playwright
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

console.log(
	"sync-static-headers: wrote static-headers.json (HTML CSP blocks for Playwright parity; live headers + CSP come from next.config.ts)",
);
