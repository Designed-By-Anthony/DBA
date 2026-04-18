/**
 * Injects CSP strings from ./csp.mjs into firebase.json (no manual duplicate edits).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildContentSecurityPolicyEnforcing,
  buildContentSecurityPolicyReportOnly,
  buildReportToHeader,
  buildSentryCspReportUrl,
} from './csp.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const firebasePath = join(root, 'firebase.json');

const reportUrl = buildSentryCspReportUrl();
if (!reportUrl) {
  console.warn(
    'sync-firebase-csp: PUBLIC_SENTRY_DSN unset — CSP will omit Sentry report-uri/report-to (set env for violation reporting).',
  );
}

const cspEnforcing = buildContentSecurityPolicyEnforcing(reportUrl);
const cspReportOnly = buildContentSecurityPolicyReportOnly(reportUrl);
const reportTo = reportUrl ? buildReportToHeader(reportUrl) : null;

/** hstspreload.org requires this exact policy on responses (not only on static assets). */
const HSTS_PRELOAD =
  'max-age=63072000; includeSubDomains; preload';

const htmlHeaders = [
  {
    key: 'Cache-Control',
    value: 'no-cache, no-store, must-revalidate',
  },
  {
    key: 'Strict-Transport-Security',
    value: HSTS_PRELOAD,
  },
  {
    key: 'Content-Security-Policy',
    value: cspEnforcing,
  },
  {
    key: 'Content-Security-Policy-Report-Only',
    value: cspReportOnly,
  },
  ...(reportTo ? [{ key: 'Report-To', value: reportTo }] : []),
];

const raw = readFileSync(firebasePath, 'utf8');
const config = JSON.parse(raw);

const hostingHeaders = config.hosting?.headers;
if (!Array.isArray(hostingHeaders)) {
  console.error('sync-firebase-csp: hosting.headers missing');
  process.exit(1);
}

let updated = 0;
for (const block of hostingHeaders) {
  if (block.regex !== '^/$' && block.regex !== '^/[^/.]+(?:/[^/.]+)*$') continue;
  block.headers = htmlHeaders;
  updated += 1;
}

if (updated !== 2) {
  console.error(`sync-firebase-csp: expected 2 HTML CSP blocks, found ${updated}`);
  process.exit(1);
}

const catchAll = hostingHeaders.find((h) => h.source === '**');
if (!catchAll?.headers) {
  console.error('sync-firebase-csp: catch-all ** headers block not found');
  process.exit(1);
}

for (const h of catchAll.headers) {
  if (h.key === 'Strict-Transport-Security') {
    h.value = HSTS_PRELOAD;
  }
}

writeFileSync(firebasePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log('sync-firebase-csp: updated firebase.json (CSP + Report-To + HSTS preload on HTML + ** )');
