# Testing the Lighthouse Scanner UI

## Overview
The Lighthouse Scanner lives at `/lighthouse` in the Next.js app (`apps/web`). It's a public page — no auth required for visual testing.

## Environments

- **Local dev**: `bun run dev:web` from repo root starts Next.js on `:3000`. Note: the homepage may return 500 locally if env vars for other features are missing, but `/lighthouse` typically works.
- **Cloudflare Pages preview**: Every PR gets a preview deploy. Check the PR comments from `cloudflare-workers-and-pages[bot]` for the preview URL (format: `https://<hash>.dba-92r.pages.dev`).
- **Production**: `https://designedbyanthony.com/lighthouse`

## Important: Pages vs Worker Deployment

This repo has **two separate deploy targets**:
- **Cloudflare Pages** (`apps/web`) — deploys automatically via PR/merge CI
- **Cloudflare Worker** (`apps/api`) — deploys separately via `wrangler deploy` from `apps/api/`

Cloudflare Pages preview URLs only include frontend changes. **API Worker changes (routes in `apps/api/src/routes/`) are NOT included in Pages previews.** To test API changes, use local `wrangler dev` (see below) or wait for a separate Worker deployment.

## Testing API Routes Locally

To test API Worker routes (e.g., `/api/report/:id/pdf`, `/api/audit`, `/api/audit/email-summary`):

1. **Start the API locally:**
   ```bash
   cd apps/api && npx wrangler dev --local
   ```
   This starts the Worker on `http://localhost:8788` with local KV.

2. **Seed test data into local KV** (needed for endpoints that read from the report store):
   ```bash
   cd apps/api && npx wrangler kv key put "DBA-TEST1234" \
     --binding AUDIT_REPORTS_KV --local \
     "$(cat /path/to/test-report.json)"
   ```
   The test report JSON must match the full stored payload structure from `audit.ts` — including nested `sitewide.robotsTxt.exists`, `sitewide.sitemap.exists`, `backlinks.found`, `places.found`, `indexCoverage.found` fields. Empty objects (`{}`) for these fields will cause `buildAuditPdf` to crash with "Cannot read properties of undefined".

3. **Verify with curl:**
   ```bash
   # Health check
   curl -s http://localhost:8788/health

   # Test PDF headers
   curl -sD - http://localhost:8788/api/report/DBA-TEST1234/pdf -o /tmp/test.pdf

   # Test CORS preflight
   curl -sD - -X OPTIONS http://localhost:8788/api/audit/email-summary \
     -H "Origin: https://designedbyanthony.com" -o /dev/null
   ```

## Elysia Response Pattern

When testing Elysia routes that return raw `Response` objects: in Elysia, `set.headers` is ignored when returning a raw `Response`. Headers must be passed via the `Response` constructor. If you see missing headers on a raw Response return, check for this pattern mismatch. Routes that return plain objects (JSON) can use `set.headers` normally.

## Key Visual Elements to Verify

When testing Lighthouse UI changes, compare against the main site homepage (`/`) for consistency:

1. **Page background**: Should match main site — dark ink (`#06080d`) with subtle blue atmospheric glow at top, 72×72 grid texture, grain overlay. No bronze/warm tint on the page background.
2. **Card/panel borders**: Should be neutral slate (`rgba(148,163,184,0.12)`), not bronze/golden.
3. **Focus rings on form inputs**: Should be sky-blue (`rgba(96,165,250,...)`), not bronze. Click into URL and email fields to verify.
4. **Form spacing**: The audit form panel should have generous padding (uses `--card-pad-lg`). Should not feel cramped.
5. **Header/footer**: Uses `BrandHeader`/`BrandFooter` components — should be identical to main site.
6. **Process strip**: Numbered badges (01-05) should have blue-tinted borders.
7. **Submit button**: The "Run free audit" CTA retains bronze/gold intentionally (matches `btn-primary-book` on main site).

## CSS Architecture

- **Single CSS file**: `apps/web/src/app/lighthouse/lighthouse-globals.css` (~2000 lines, organized with numbered section TOC)
- **Theme tokens**: All spacing/color values reference canonical tokens from `apps/web/src/styles/theme.css`
- **Key spacing tokens**: `--space-section`, `--space-block`, `--space-element`, `--card-pad`, `--card-pad-lg`
- **Key color tokens**: `--bg-ink`, `--bg-dark`, `--bg-deeper`, `--text-white`, `--accent-blue`, `--accent-bronze`

## Common Pitfalls

- **CSS class name mismatches**: When refactoring CSS class names, always check that components still reference the correct names. Use `grep -oP 'className="[^"]*lh-[^"]*"' <component>.tsx | grep -oP 'lh-[a-z0-9_-]+'` to extract class names from components and verify they exist in the CSS file.
- **Local dev 500 errors**: The homepage might 500 locally due to missing env vars, but `/lighthouse` usually works. Use the Cloudflare Pages preview URL as a reliable alternative.
- **Bronze is intentional in some places**: The submit button CTA and decorative accent rules intentionally keep bronze — don't flag these as bugs.
- **Empty nested objects in test data**: When seeding test reports for PDF generation, ensure all nested objects (`sitewide`, `backlinks`, `places`, `indexCoverage`) have their full expected structure. `buildAuditPdf` accesses nested properties like `sitewide.robotsTxt.exists` and will crash on empty objects.

## Devin Secrets Needed

None — the Lighthouse page is fully public. No API keys or auth tokens needed for visual testing.

For running an actual audit (testing the scan progress flow), the backend API at `api.designedbyanthony.com` needs to be available, which requires Cloudflare Workers to be deployed. This works on preview/production but may not work locally without `bun run dev:api`.
