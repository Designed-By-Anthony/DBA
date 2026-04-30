# Testing the Lighthouse Scanner UI

## Overview
The Lighthouse Scanner lives at `/lighthouse` in the Next.js app (`apps/web`). It's a public page — no auth required for visual testing.

## Environments

- **Local dev**: `bun run dev:web` from repo root starts Next.js on `:3000`. Note: the homepage may return 500 locally if env vars for other features are missing, but `/lighthouse` typically works.
- **Cloudflare Pages preview**: Every PR gets a preview deploy. Check the PR comments from `cloudflare-workers-and-pages[bot]` for the preview URL (format: `https://<hash>.dba-92r.pages.dev`).
- **Production**: `https://designedbyanthony.com/lighthouse`

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

## Devin Secrets Needed

None — the Lighthouse page is fully public. No API keys or auth tokens needed for visual testing.

For running an actual audit (testing the scan progress flow), the backend API at `api.designedbyanthony.com` needs to be available, which requires Cloudflare Workers to be deployed. This works on preview/production but may not work locally without `bun run dev:api`.
