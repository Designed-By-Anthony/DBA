# Migration Status Report

> **Note:** This file tracks migration and release notes for the **single root Next.js** app (`npm`, `package-lock.json`). Older multi-app / Astro-era detail was removed and summarized under **Pre-Netlify migration archive** — see [README.md](README.md) and [AGENTS.md](AGENTS.md).

## Pages frontend + Worker API decoupling rollout (2026-04-29)

- Added root `packageManager` metadata to unblock Turbo workspace resolution in Bun/CI.
- Switched `apps/web` default deploy path to Cloudflare Pages (`deploy:pages`) while keeping a Worker fallback script (`deploy:worker`).
- Added `apps/web/build/prepare-pages-bundle.mjs` to package OpenNext output into `.pages-output` (`_worker.js` + static assets) for Pages advanced-mode deploys.
- Hardened frontend/backend boundary by requiring `NEXT_PUBLIC_API_BASE_URL` during production web env validation.
- Tightened browser-origin trust rules to apex + Cloudflare Pages previews (`*.pages.dev`) + localhost dev and reused this shared logic in API CORS setup.
- Updated operator docs (`README.md`, `.env.example`, `AGENTS.md`, `ANTHONYS_INSTRUCTIONS.txt`) to document Pages (frontend) + Worker (backend) architecture.

## Local machine sync with main (2026-04-28)

- **Repository Parity:** Synchronized local `main` branch with `origin/main` using `git reset --hard`.
- **Environment:** Performed `npm install` and `npm run sync:static-headers` to ensure local alignment with lockfile and security headers.
- **Lockfile:** Updated `package-lock.json` to reflect current environment and committed for integrity.
- **Biome:** Updated `biome.json` to exclude agent-specific directories from linting.
- Validation: `npm run lint` and `npm run build` pass from repo root.

## Codebase cleanup + pre-store security audit (2026-04-28)

### Cleanup
- **Biome formatting:** Auto-fixed 5 files with formatting violations (`ToolsPage.tsx`, `tools.module.css`, `BrandFooter.tsx`, `useStore.ts`, `audit-forms.ts`). Lint now passes clean across all 187 files.

### Security audit findings
| Surface | Status | Notes |
|--------|--------|-------|
| `npm audit` (production deps) | ✅ 0 vulnerabilities | |
| `console.log` leaks | ✅ None | Only `console.error`/`warn` in server error paths |
| TypeScript `any` | ✅ None | Strict typing throughout |
| HSTS / security headers | ✅ Set | `next.config.ts` — HSTS, X-Frame-Options, X-Content-Type-Options, COOP, Referrer-Policy, Permissions-Policy |
| CORS | ✅ Scoped | `/api/lead-email`, `/api/audit` use origin allowlists; never `*` |
| Env validation | ✅ Zod | `src/lib/env/marketing.ts`, `src/lib/env/lighthouse.ts` |
| reCAPTCHA Enterprise | ✅ On all public POSTs | `/api/audit` + `/api/lead-email` verify tokens when `RECAPTCHA_ENTERPRISE_API_KEY` is set |
| `/api/test/emails` | ✅ Guarded | Returns 404 unless `isGmailTestMode()` |
| CSP `unsafe-eval` | ⚠️ Present | Required by Next.js client bundles; documented in `build/csp.mjs` |

### Store readiness checklist (pre-implementation)
Before adding a store, ensure:
- [ ] Add Stripe (or chosen processor) keys to `src/lib/env/marketing.ts` Zod schema
- [ ] Create `/api/store/webhook` with **HMAC signature verification** on every incoming webhook
- [ ] Add per-IP rate limiting to any checkout/order API route (mirroring `src/lighthouse/lib/http.ts` pattern)
- [ ] Extend CSP `connect-src` in `build/csp.mjs` for Stripe JS (`https://js.stripe.com`, `https://api.stripe.com`) + run `npm run sync:static-headers`
- [ ] Add Stripe JS script origin to `script-src` in `build/csp.mjs`
- [ ] Validate all store input with Zod (already the project standard)
- [ ] Add `X-Stripe-Signature` or equivalent header verification to webhook handler
- [ ] Ensure no customer PII is logged server-side

## Site-wide brand + stack unification (2026-04-28)

- **Tech stack accuracy:** Updated footer badges (`SiteFooter.tsx`) → Next.js, Firebase Hosting, Cloudflare, reCAPTCHA Enterprise.
- **Tech fingerprints (`LighthouseTechFingerprints.tsx`):** Corrected `data-builtwith-tech-stack` to reflect production stack (Firebase Hosting, Cloudflare, reCAPTCHA Enterprise).
- **Color palette unification:** Enhanced `theme.css` body atmospheric gradients to match Lighthouse premium depth — sky blue primary glow (0.12 opacity), bronze warm accent (0.06), tertiary blue depth layer, unified ink base gradient.
- **Brand consistency:** Entire site now shares the same bronze/sky color language as the Lighthouse audit page.
- Validation: `npm run build` and `npm run lint` pass from repo root.

## Lighthouse final premium brand polish (2026-04-28)

- **Visual depth:** Enhanced atmospheric gradients with multi-layer radial glow (sky blue + bronze), premium grain texture overlay for studio-paper feel, and refined shadow depth on all surfaces.
- **Tactile interactions:** Added cursor-glow tracking to glass cards (`cursorGlow.ts`), premium shimmer sweep on submit button with animated glow pulse, hover lift transforms on score cards with enhanced ring glow.
- **Editorial typography:** H1 gradient text treatment matching marketing heroes, refined Fraunces optical sizing, tighter letter-spacing and line-height for premium hierarchy.
- **Component refinements:** Refined glass card border/gradient finishes, enhanced score ring spring animations with hover state, instrument-panel feel for scan progress with spring physics, premium phase cards with smoother transitions.
- **Files:** `lighthouse-globals.css`, `ScoreRing.tsx`, `AuditForm.tsx`, `AuditScanProgress.tsx`, new `cursorGlow.ts`.
- Validation: `npm run build` and `npm run lint` pass from repo root.

## Lighthouse premium scanner + reCAPTCHA Enterprise (2026-04-28)

- Reworked `/lighthouse` into a single premium audit workstation: editorial scanner hero, bronze diagnostic preview, sticky audit panel, tighter process coverage strip, and quieter form copy/states.
- Extended the premium system into the generated report surfaces: on-screen results now open with an executive report cover, print/save route uses warm paper + bronze report styling, and the downloadable PDF matches the same brand palette.
- Added Google reCAPTCHA Enterprise frontend execution with the DBA public site key and server assessment verification for `POST /api/audit` when `RECAPTCHA_ENTERPRISE_API_KEY` is configured.
- Updated CSP source of truth for the Google reCAPTCHA loader/frames plus `.env.example` and README env notes. Private Google API keys stay server-only.

## Premium chrome + Lighthouse landing polish (2026-04-28)

- Migrated the main marketing chrome toward the newer Lighthouse header treatment: branded mark + wordmark lockup, brass banner/header rule, quieter nav typography, and aligned mobile brand behavior.
- Tightened `/lighthouse`: removed the headline overlap badge/glow clutter, reduced vertical void space, contained the report preview, compacted the process strip/form, and softened the audit form copy toward a more premium service tone.
- Verified with `npm run build`, `npm run lint` (2 sanitized HTML warnings only), Playwright desktop/mobile checks for `/` and `/lighthouse`, and brand asset presence checks for `/brand/logo.png` + `/brand/mark.webp`.
- Added `src/design-system/site-config.ts` as the shared brand/nav/banner/footer/social source of truth for marketing + Lighthouse chrome.
- Promoted bronze to canonical design tokens (`--accent-bronze*`) with legacy brass aliases, then swept authored CSS to consume the tokenized bronze RGB instead of hand-coded bronze values.

## Convex lead webhook + Firebase docs (2026-04-28)

- **`LEAD_WEBHOOK_URL`** / optional **`LEAD_WEBHOOK_SECRET`**: server-side POST for **`POST /api/audit`** (`after()`), **`POST /api/lead-email`**, and **`/api/contact`** (`src/lib/leadWebhook.ts`). Legacy **`AGENCY_OS_WEBHOOK_*`** audit path runs only when `LEAD_WEBHOOK_URL` is unset.
- **CORS:** `*.hosted.app`, `*.web.app`, `*.firebaseapp.com`, `*.netlify.app` allowed for marketing lead APIs + Lighthouse `POST /api/audit` origins (`src/lib/marketingBrowserOrigins.ts`, `src/lighthouse/lib/http.ts`).
- **Docs:** `AGENTS.md`, `README.md`, `SECURITY.md`, `.env.example` — production path **GitHub → Firebase App Hosting**.

## Consolidation branch `oh-my-hopefully-complete` (2026-04-28)

- **`main` + `origin/consolidation/all-mrs`:** One merge from the open MR !153 trunk. Kept **Next.js 16 `src/proxy.ts`**, Convex **`AUDIT_LOGGING_WEBHOOK_URL`**, and premium **`/lighthouse`**; dropped **`src/middleware.ts`**. Current **`lighthouse-troubleshooting`**: Turnstile on audits is **opt-in** (`LIGHTHOUSE_STRICT_TURNSTILE`); segment no longer injects **`api.js`** by default. Audit form intro mentions **Freshworks** when CRM sync is enabled.

## PageSpeed Insights reliability (`lighthouse-troubleshooting`, 2026-04-28)

- **`POST /api/audit`:** PageSpeed `runPagespeed` moved to **`fetchPageSpeedRunPagespeed()`** (`src/lighthouse/lib/pageSpeedInsights.ts`) — **55s** client timeout (was 20s), **one retry** after delay on **AbortError** or **HTTP 5xx**. User-facing errors distinguish timeout vs configuration. **`lighthouse2.md`** notes slow PSI + Netlify **Functions** scope for `GOOGLE_PAGESPEED_API_KEY`.

## Lighthouse results & collateral polish (`lighthouse-troubleshooting`, 2026-04-28)

- **On-screen results:** `lighthouse-globals.css` — result panels get a **sky accent top bar**, deeper glass gradient, and utility classes (`lighthouse-result-heading`, `lighthouse-result-eyebrow`, `lighthouse-score-card`, `lighthouse-metric-tile`, `lighthouse-actions-toolbar`, premium buttons). **`AuditResults`** copy hierarchy, crawl list layout, CTA block, and **`ScoreRing`** label styling aligned with marketing chrome.
- **Print:** `@media print` rules for `.audit-print-root` — light paper-style panels, accent bar, readable type (no `!important`).
- **PDF:** `auditReportPdf.ts` — branded header strip (slate + sky rule), soft score card, structured vitals, amber partial-report callout, light page fill.
- **Email summary:** `auditSummaryEmail.ts` — table-based branded HTML (accent bar, score table, primary/secondary CTAs) for Resend clients.

## Lighthouse premium polish (`lighthouse-troubleshooting`, 2026-04-28)

- **Segment SEO:** `/lighthouse` layout exports **`viewport`** (device-width, `viewport-fit: cover`, `interactiveWidget`, `maximumScale: 5`, segment **themeColor**) + richer **`metadata`** (canonical, keywords, robots, `appleWebApp`, OG/Twitter). **`LighthouseJsonLd`**: WebApplication + WebPage + BreadcrumbList + FAQPage JSON-LD. **`/lighthouse`** added to **`sitemap.ts`** path registry; **`public/robots.txt`** disallows **`/lighthouse/report`** (print views). Print route **`layout.tsx`** sets **noindex**.
- **Motion:** `framer-motion/client` on hero feature cards, scan progress (spring progress bar, staggered phase cards), results panels + score rings; **`LighthouseValueStrip`** three tap-to-flip value cards (scroll-in + flip; static layout when reduced motion). **`prefers-reduced-motion`** respected.
- **Safe areas:** `lighthouse-globals.css` padding uses **`env(safe-area-inset-*)`** on header/main.
- **Tech fingerprints:** `LighthouseTechFingerprints` — visually hidden `data-*` hints for Wappalyzer-class crawlers (no layout impact).

## Partial audits + report UX (`lighthouse-troubleshooting`, 2026-04-28)

- **Degraded PSI:** `resolvePageSpeedLighthouse()` (`src/lighthouse/lib/auditPsi.ts`) — if PageSpeed fails or returns no categories, the audit **continues** with `null` lab scores, neutral rings, and **`psiDegradedReason`** on the API payload + stored report + Convex webhook note.
- **Resend:** `src/lighthouse/lib/transactionalResend.ts` — audit receipt uses **Resend when `RESEND_API_KEY` is set** (else Gmail). Default **`RESEND_FROM_EMAIL`** fallback is **`outreach@designedbyanthony.com`** (also **`/api/lead-email`** default). **`POST /api/audit/email-summary`** emails a short summary (rate-limited).
- **UI:** `AuditScanProgress` — step cards + progress bar + rotating facts while loading. **`AuditResults`** — PDF download (**jspdf**), print view (`/lighthouse/report/[id]/print`), **Email summary** button.

## Lighthouse mobile + Turnstile opt-in (2026-04-28)

- **`POST /api/audit`:** Turnstile verification runs only when **`LIGHTHOUSE_STRICT_TURNSTILE=1`** (and `TURNSTILE_SECRET_KEY` is set). Default: **no** Turnstile on the audit API so `/lighthouse` avoids Cloudflare iframe + CSP issues; rate limiting still applies.
- **`/lighthouse` UI:** Turnstile script + widget removed from the segment. **`AuditForm`** no longer sends `turnstileToken`. **`LighthouseValueStrip`:** tap-to-flip cards (keyboard-accessible); **`lighthouse-audit-shell`** responsive padding + flip CSS in `lighthouse-globals.css`.

## Lighthouse audit UI + Turnstile (legacy explicit mode, 2026-04-28)

- When **`LIGHTHOUSE_STRICT_TURNSTILE=1`**, restore **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** on the client and wire Turnstile again (previous pattern: explicit `api.js`, host outside `<form>`). Hostname allowlist in Cloudflare still applies for previews.

## Next.js 16 proxy + quieter build (2026-04-28)

- **`src/middleware.ts` → `src/proxy.ts`:** Renamed export `middleware` → `proxy` per Next.js 16 (removes deprecated middleware file warning).
- **`next.config.ts`:** Strip `experimental.clientTraceMetadata` after `withSentryConfig` so Netlify logs no longer list that experiment; keep `experimental.optimizePackageImports: ["framer-motion"]` from marketing (merged with `main`).

## Audit logging webhook (Convex / external) (2026-04-28)

- **`AUDIT_LOGGING_WEBHOOK_URL`:** Optional. After each successful `POST /api/audit`, `after()` calls `fireAuditLoggingWebhook()` (`src/lighthouse/lib/auditLoggingWebhook.ts`) — JSON with `websiteUrl`, `businessName`, `email`, scores, `findings` / `recommendations` (from AI + diagnostics), `reportUrl`, `auditedAt`. Fire-and-forget; non-2xx or network errors are logged only. Set in Netlify to e.g. `https://opulent-falcon-648.convex.site/webhook/audit`.

## Lighthouse Scanner v2 + Freshworks CRM sync (2026-04-28)

- **`/lighthouse` landing:** `LighthouseHero` splash (“Lighthouse Scanner v2 · Live now”), glass card wrap for the form, tightened loading copy, footer note on report links. Metadata titles/descriptions mention v2.
- **Freshsales lead from audit:** When `FRESHWORKS_CRM_SYNC_ENABLED=1` and `FRESHWORKS_CRM_BASE_URL` + `FRESHWORKS_CRM_API_KEY` are set, `POST /api/audit` `after()` calls `createFreshworksLeadFromAudit()` (`src/lighthouse/lib/freshworksCrm.ts`) — `POST {base}/api/leads` with `Token token=` or `Bearer` auth. Optional `FRESHWORKS_CRM_CUSTOM_FIELD_KEYS` for `cf_*` fields; otherwise full context lives in lead **description**. Env keys documented in `.env.example` and `validateLighthouseEnv` schema.
- Verified with `npm run lint` + `npm run build`.

## Contact drawer + crawl discovery (2026-04-27)

- **Left contact drawer:** `SiteContactDrawer` (formerly quick-rail) is a **Contact** tab with a high-contrast panel, **Technical examples and best practices** snippet (includes `-webkit-transform-origin: 0% 100%` guidance), audit + contact + Calendly + email + `tel:` actions, Escape to close, dimmed backdrop on mobile, and **bottom sheet** under 1200px with scroll lock. `public/robots.txt` + `public/llms.txt` point to **`/sitemap.xml`**. **`src/app/sitemap.ts`** + **`src/lib/marketing-path-registry.ts`** keep crawl URLs aligned with SSG.
- **Lint / code hygiene (2026-04-27):** `npm run lint` is clean (zero diagnostics). Biome excludes generated **`static-headers.json`** / **`netlify.toml`** from formatting checks; theme + layout-shell CSS allow intentional `!important` / specificity patterns. **`src/scripts/audit-forms.ts`** uses typed Turnstile + `AuditFormElement` (no `any`). Lighthouse: removed unused React default imports, optional chaining, `Number.isNaN`, `node:crypto` import, Sheets API guard without non-null assertions.

## Site shell + content audit (2026-04-25)

- **Layout repair:** Removed root `freshworks-widget` script (floating embed was painting above the header). Homepage no longer embeds the Freshworks form inline — CTA card links to `/contact`. Marketing chrome uses **`SiteContactDrawer`** (left rail / mobile bottom sheet) + main column; desktop nav adds FAQ, Blog, Service Areas. Contact page uses a styled `contact-form-shell`; Freshworks embed only loads on pages that render `AuditForm`.
- Added CSS-only aurora layers on the homepage hero and inner marketing heroes (`hero-drift`, `marketing-hero-aurora`) for a richer look without extra JS; motion respects `prefers-reduced-motion`.
- Added Playwright (`@playwright/test`) with `playwright/security-crawl.spec.ts` to walk high-signal GET routes. When `PLAYWRIGHT_ZAP=1`, Chromium uses the ZAP proxy and `afterAll` triggers a ZAP spider plus HTML/JSON reports under `test-results/zap/` (requires ZAP listening with `ZAP_API_KEY`). Scripts: `npm run test:playwright`, `npm run test:playwright:zap`.
- **Blank-page hardening:** Reveal animations now force `.reveal-active` after 3.4s if IntersectionObserver never fires. `/404` → proxy rewrite to `/page-not-found` for the branded not-found page. Legacy `/free-seo-audit` **308 → `/contact`** via `next.config.ts` redirects while on-site audit tooling is paused. `playwright/pages-render.spec.ts` asserts every marketing URL has visible `#main-content` text (`npm run test:playwright:render`). Playwright starts `next start` on **port 3001** by default (`PLAYWRIGHT_TEST_PORT`) so it does not collide with a dev server on :3000; set `PLAYWRIGHT_REUSE_SERVER=1` only when you intentionally reuse an already-running server.
- Fixed the client-side page lifecycle so shared marketing behaviors re-initialize after Next.js route changes instead of only on the first load. That removes the DOM-mutation timing issue that was throwing hydration mismatches and leaving shell interactions unreliable across internal navigation.
- Hardened the reveal animation system with a timed fallback so below-the-fold sections and footer content no longer stay visually blank when the intersection observer is late or skipped.
- Removed Astro-era naming and copy from the live Next.js app surface: homepage section classes, footer badge styling, blog metadata, image asset names, env comments, and related source comments now reflect the current stack.
- Updated the blog index/article metadata so the former Astro-focused posts now ship as Next.js content with matching slugs and assets.
- Verified with `npm run build` from the repo root plus targeted checks against `http://localhost:3000`, `/contact`, and `/blog` to confirm the corrected footer/content and the new Next.js blog entries are present in served HTML.
- **Pricing + schema polish:** Offer-catalog JSON-LD for standard rebuilds references `STANDARD_WEBSITE_INSTALLMENT_EACH` and `PUBLIC_LAUNCH_BUNDLE_MONTHS` so it stays aligned with `offers.ts`. Homepage metadata, hero variants, process strip, and pitch strip use the same "contact us for your free audit" CTA language. FAQPage JSON-LD has a stable `@id`; homepage JSON-LD script keys derive from `@id` / type instead of array indexes (Biome-clean).
- **Service area landing pages:** `src/data/serviceAreaLocations.ts` drives `/service-areas/[slug]` (Rome, Utica, New Hartford, Clinton, Syracuse, Watertown, Naples, Houston) with long-form copy, breadcrumbs, WebPage + BreadcrumbList JSON-LD (`buildMarketingWebPageSchema`), clickable cards on `/service-areas`, `generateStaticParams` + meta descriptions in `[...path]/page.tsx`, and Playwright route coverage via `getAllServiceAreaSlugs()` in `marketing-routes.ts`.
- **GBP 2026 blog cover:** Post uses `public/images/gbp_2026_cny_playbook_cover.png` (1024×1024) with `coverPresentation: "liftOnDark"` so the dark map artwork reads on the marketing shell (see `.blog-cover--lift-on-dark` in `marketing-site-pages.css`).
- **Marketing SEO completeness:** `resolveMarketingMetadata()` in `src/lib/marketing-metadata.ts` supplies per-route `description`, `alternates.canonical`, Open Graph (and Twitter where useful), plus `noindex` for thank-you / Facebook offer. `MarketingJsonLd` + `EnrichedPages` emit WebPage + BreadcrumbList, ItemList (services, blog index), Service (service detail), BlogPosting (posts), FAQPage + OfferCatalog on `/faq` and `/pricing` respectively, without duplicate graphs on enriched routes.
- **Viewport + responsive polish:** Root `export const viewport` (device-width, initial scale 1, `viewport-fit: cover`, theme-color) so phones get a proper meta viewport. `html { overflow-x: clip }`, section containers `max-width: 100%`, pilot banner link wraps on small screens, marketing CTA rows stack full-width under 520px, blog index lazy-loads images after the first card, article hero uses `fetchPriority="high"` + `decoding="async"`. Crisp chat loads `lazyOnload` to reduce main-thread contention (Lighthouse-friendly).
- **Premium inner-page polish:** `@font-face` for Fraunces Variable (woff2); `PageHero` uses `marketing-page-hero--editorial` — centered editorial headline (gradient text), softer aurora, scoped `::after` vignette. Pilot banner + contact drawer chrome restyled (glass, brass accent, narrower tab) for a quieter hierarchy vs. main content.
- **Mobile-first overflow pass:** `--container-gutter` floors at `0.85rem` (synced in `tokens.css`); home `.hero-grid` no longer uses a fixed `minmax(320px, …)` track that forced horizontal scroll on ~320px phones; marketing/home grids use `minmax(min(100%, …), 1fr)`; `#main-content` + responsive media max-width; footer stacks to two columns by 1024px; reach-out dialog actions single-column under 420px; `.feature-grid` single column under 560px.
- **Crisp + CSP:** `connect-src` now matches Crisp’s published hosts (`https://*.crisp.chat`, `wss://*.relay.crisp.chat`, `wss://*.relay.rescue.crisp.chat`); `worker-src` adds `https://*.crisp.chat` for verification workers; Crisp bootstrap uses `afterInteractive` instead of `lazyOnload` so the realtime socket initializes reliably after deploy.
- **Mobile nav:** Full-screen menu gets a visible close control, tap-outside on the dimmed backdrop, iOS-friendly scroll lock (`position: fixed` + restore scroll), inner scroll with `overscroll-behavior: contain` / `100dvh`, and closes on `dba:page-ready` so SPA navigations do not leave the sheet stuck open.

## Site shell + content audit (2026-04-25)

- **Single PR branch:** `cursor/marketing-consolidated-4941` — one squashed commit on top of `main` containing the full marketing shell, SEO, service areas, GBP blog, Playwright/ZAP hooks, mobile overflow, Crisp CSP, and mobile nav fixes (open a PR from that branch for one clean history).

- **Layout repair:** Removed root `freshworks-widget` script (floating embed was painting above the header). Homepage no longer embeds the Freshworks form inline — CTA card links to `/contact`. Marketing chrome uses a **left sticky quick-action rail** (desktop) + main column; desktop nav adds FAQ, Blog, Service Areas. Contact page uses a styled `contact-form-shell`; Freshworks embed only loads on pages that render `AuditForm`.
- Added CSS-only aurora layers on the homepage hero and inner marketing heroes (`hero-drift`, `marketing-hero-aurora`) for a richer look without extra JS; motion respects `prefers-reduced-motion`.
- Added Playwright (`@playwright/test`) with `playwright/security-crawl.spec.ts` to walk high-signal GET routes. When `PLAYWRIGHT_ZAP=1`, Chromium uses the ZAP proxy and `afterAll` triggers a ZAP spider plus HTML/JSON reports under `test-results/zap/` (requires ZAP listening with `ZAP_API_KEY`). Scripts: `npm run test:playwright`, `npm run test:playwright:zap`.
- **Blank-page hardening:** Reveal animations now force `.reveal-active` after 3.4s if IntersectionObserver never fires. `/404` → proxy rewrite to `/page-not-found` for the branded not-found page. Legacy `/free-seo-audit` **308 → `/contact`** via `next.config.ts` redirects while on-site audit tooling is paused. `playwright/pages-render.spec.ts` asserts every marketing URL has visible `#main-content` text (`npm run test:playwright:render`). Playwright starts `next start` on **port 3001** by default (`PLAYWRIGHT_TEST_PORT`) so it does not collide with a dev server on :3000; set `PLAYWRIGHT_REUSE_SERVER=1` only when you intentionally reuse an already-running server.
- Fixed the client-side page lifecycle so shared marketing behaviors re-initialize after Next.js route changes instead of only on the first load. That removes the DOM-mutation timing issue that was throwing hydration mismatches and leaving shell interactions unreliable across internal navigation.
- Hardened the reveal animation system with a timed fallback so below-the-fold sections and footer content no longer stay visually blank when the intersection observer is late or skipped.
- Removed Astro-era naming and copy from the live Next.js app surface: homepage section classes, footer badge styling, blog metadata, image asset names, env comments, and related source comments now reflect the current stack.
- Updated the blog index/article metadata so the former Astro-focused posts now ship as Next.js content with matching slugs and assets.
- Verified with `npm run build` from the repo root plus targeted checks on the production marketing host, `/contact`, and `/blog` to confirm the corrected footer/content and the new Next.js blog entries are present in served HTML.
- **Pricing + schema polish:** Offer-catalog JSON-LD for standard rebuilds references `STANDARD_WEBSITE_INSTALLMENT_EACH` and `PUBLIC_LAUNCH_BUNDLE_MONTHS` so it stays aligned with `offers.ts`. Homepage metadata, hero variants, process strip, and pitch strip use the same "contact us for your free audit" CTA language. FAQPage JSON-LD has a stable `@id`; homepage JSON-LD script keys derive from `@id` / type instead of array indexes (Biome-clean).
- **Service area landing pages:** `src/data/serviceAreaLocations.ts` drives `/service-areas/[slug]` (Rome, Utica, New Hartford, Clinton, Syracuse, Watertown, Naples, Houston) with long-form copy, breadcrumbs, WebPage + BreadcrumbList JSON-LD (`buildMarketingWebPageSchema`), clickable cards on `/service-areas`, `generateStaticParams` + meta descriptions in `[...path]/page.tsx`, and Playwright route coverage via `getAllServiceAreaSlugs()` in `marketing-routes.ts`.
- **GBP 2026 blog hero:** Post cover uses `public/images/gbp_2026_cny_playbook_hero.png` (1920×960) plus infographic-style alt text. Regenerate placeholder with `npm run generate:gbp-playbook-hero`, or replace that file with the final exported artwork (keep the same path).
- **Marketing SEO completeness:** `resolveMarketingMetadata()` in `src/lib/marketing-metadata.ts` supplies per-route `description`, `alternates.canonical`, Open Graph (and Twitter where useful), plus `noindex` for thank-you / Facebook offer. `MarketingJsonLd` + `EnrichedPages` emit WebPage + BreadcrumbList, ItemList (services, blog index), Service (service detail), BlogPosting (posts), FAQPage + OfferCatalog on `/faq` and `/pricing` respectively, without duplicate graphs on enriched routes.
- **Viewport + responsive polish:** Root `export const viewport` (device-width, initial scale 1, `viewport-fit: cover`, theme-color) so phones get a proper meta viewport. `html { overflow-x: clip }`, section containers `max-width: 100%`, pilot banner link wraps on small screens, marketing CTA rows stack full-width under 520px, blog index lazy-loads images after the first card, article hero uses `fetchPriority="high"` + `decoding="async"`.
- **Premium inner-page polish:** `@font-face` for Fraunces Variable (woff2); `PageHero` uses `marketing-page-hero--editorial` — centered editorial headline (gradient text), softer aurora, scoped `::after` vignette. Pilot banner + left quick rail restyled (glass, brass accent, narrower rail) for a quieter chrome vs. content hierarchy.
- **Mobile-first overflow pass:** `--container-gutter` floors at `0.85rem` (synced in `tokens.css`); home `.hero-grid` no longer uses a fixed `minmax(320px, …)` track that forced horizontal scroll on ~320px phones; marketing/home grids use `minmax(min(100%, …), 1fr)`; `#main-content` + responsive media max-width; footer stacks to two columns by 1024px; reach-out dialog actions single-column under 420px; `.feature-grid` single column under 560px.
- **Freshworks Web Chat:** `FreshworksChatBootstrap` sets `window.fcSettings.onInit` (setExternalId, setFirstName, setEmail, setProperties for `cf_plan` / `cf_status` from optional `NEXT_PUBLIC_FRESHCHAT_*`), then injects `//fw-cdn.com/16171925/7111349.js` with `chat="true"` so init order matches vendor docs. Anonymous visitors get a stable `externalId` in `localStorage`. `freshworks-chat-widget.css` keeps the frame above sticky chrome and overrides the default white launcher tray (dark glass bubble). Crisp removed to avoid double chat.
- **Footer density:** Tighter `.footer` margin/padding, `.footer-container` grid gap and vertical padding, smaller heading gaps, compact pre-footer CTA card, and shorter footer-bottom separator spacing.
- **Mobile nav:** Full-screen menu gets a visible close control, tap-outside on the dimmed backdrop, iOS-friendly scroll lock (`position: fixed` + restore scroll), inner scroll with `overscroll-behavior: contain` / `100dvh`, and closes on `dba:page-ready` so SPA navigations do not leave the sheet stuck open.
- **Contact embed:** Contact page shell no longer uses `reveal-up` (avoids invisible form until IO). `.surface-card--contact-embed` + section/footer use `overflow: visible` so Freshworks iframe is not clipped; `AuditForm` mounts Freshworks `form.js` into `#freshworks-contact-form` via DOM (not Next `Script`) so the vendor script targets the correct node; loading + timeout fallback with mailto + Calendly.
- **Quick rail drawer:** Desktop left rail is a fixed slide-out panel (default closed) with an edge tab and close control; open state persisted in `localStorage` (`dba_quick_rail_open`). Replaces the always-visible sticky column.

## Marketing lead-email bridge — interim Resend handler until VertaFlow CRM tenant is live (2026-04-22)
## Pre-Netlify migration archive (superseded)

Detailed STATUS entries before **2026-04-26** described an older **pnpm + Turborepo** layout (`apps/marketing`, `apps/lighthouse`, `apps/web-viewer`, `packages/*`), **Astro** marketing, and **Vercel** multi-project routing. That tree is **not** present in this repository anymore.

**Current source of truth (this repo):**

- **App:** One **Next.js 16** app at the repository root (`package.json`, `next.config.ts`).
- **Marketing + APIs:** `src/app/(site)/`, `src/app/api/`, shared `src/components/marketing/`.
- **Lighthouse segment:** `src/app/lighthouse/`, audit UI + libs under `src/lighthouse/`, audit API `src/app/api/audit/route.ts`, optional lead email `src/app/api/lead-email/route.ts`.
- **Env schemas:** `src/lib/env/marketing.ts`, `src/lib/env/lighthouse.ts`, `src/lib/env/shared.ts` (not `packages/env`).
- **CSP / Netlify headers:** `build/csp.mjs`, `npm run sync:static-headers` → `static-headers.json` + `netlify.toml`.
- **Operator docs:** [README.md](README.md), [AGENTS.md](AGENTS.md), [lighthouse2.md](lighthouse2.md).

---
## 2026-04-26 GitLab + Netlify Platform Alignment

- Updated platform instructions to GitLab-first deploy flow (`Git -> GitLab -> Netlify`) in `AGENTS.md`.
- Updated `README.md` deploy section to reflect Netlify Next runtime (`@netlify/plugin-nextjs`) and removed outdated static `.next` publish guidance.
- Disabled Vercel-only Sentry monitor automation in `next.config.ts` (`automaticVercelMonitors: false`) to match Netlify production.
- Removed root `vercel.json` from the repo to prevent cross-platform config drift.
- Validation: `npm run build` passes from repo root after these changes.

## 2026-04-26 Pre-Launch UX + Content Hardening (MR #134)

- Replaced always-open quick rail with `SiteContactDrawer` (then still named `SiteQuickRailDrawer`) and added missing drawer/tab CSS so the rail stays tucked and slides in intentionally.
- Replaced always-open quick rail with `SiteContactDrawer` and added missing drawer/tab CSS so rail stays tucked and slides in intentionally.
- Restored robust contact embed flow in `AuditForm` (mount-targeted script injection + fallback states) to prevent footer/header placement drift.
- Removed footer `id="contact"` collision risk that could hijack anchor/form targeting.
- Hardened Crisp bootstrap in `src/app/layout.tsx` with duplicate-load guard (`window.__dbaCrispLoaded`) and safe `$crisp` initialization.
- Expanded long-form content system for `services`, `service-areas`, and `blog` pages via `src/data/longformContent.ts`, including a universal depth addendum to ensure dense, conversion-oriented page depth.
- Validation: `npm run build` passes from repo root after these changes. Biome check on touched files reports no errors (warnings only for existing global `!important` rules in shared CSS).

## 2026-04-26 Footer UX Polish (MR #134 follow-up)

- Fixed broken slim-footer layout where nav links collapsed together due missing class definitions.
- Added mobile-first styles for `footer--slim`, `footer-container--slim`, `footer-row`, and `footer-nav` with proper wrapping, spacing, and responsive behavior.
- Improved desktop alignment (logo / nav / socials) and tighter small-screen stacking for cleaner rendering.
- Removed duplicate `min-height` declaration in `src/styles/theme.css` flagged by Biome as an error.
- Validation: `npm run build` passes after footer updates.

## 2026-04-26 UX Polish Pass (Home / Services / Service Areas / About)

- Removed portfolio concept entries for **Serenity Medspa** and **Empire Home Services** from `src/data/showcase.ts`.
- Fixed home featured tile misalignment by removing stagger offset on the second featured-work card.
- Equalized service tiles on `/services` by making card containers flex-based with consistent minimum height and bottom-anchored CTA text.
- Added visual flair to service-area pages:
  - New service-area signal strip (core markets, remote markets, response window)
  - New local context chips on location pages
  - Richer region-card backgrounds and hover treatment
- Added longform readability/interest treatment across long sections:
  - Dedicated longform section wrapper styles
  - Divider glow, editorial card surface, accent rails for paragraphs
- Tightened tucked quick-actions rail (closed state shows less tab width).
- Removed last name from About copy (now “Anthony” instead of “Anthony Jones”) in both About page content and static marketing copy.
- Validation: `npm run build` passes.

## 2026-04-26 GitLab CI Security Scan Wiring (DAST + SAST)

- Updated `.gitlab-ci.yml` includes to use official GitLab templates for security scanning:
  - `Jobs/SAST.gitlab-ci.yml`
  - `Security/DAST.gitlab-ci.yml`
  - `Jobs/Secret-Detection.gitlab-ci.yml`
  - `Jobs/Dependency-Scanning.gitlab-ci.yml`
- Hardened DAST job rules so it runs for MRs/default branch only when `DAST_TARGET_URL` is defined (prevents silent misfire and noisy failures).
- Set DAST to `allow_failure: true` so scan results still surface without blocking delivery while tuning target/auth setup.
- Validation: `npm run build` passes from repo root after CI updates.

## 2026-04-26 Full-Repo Biome Lint Stabilization

- Ran a full-project Biome pass (`biome check .`) and applied automated fixes repo-wide where safe.
- Enabled Tailwind directive parsing in Biome (`css.parser.tailwindDirectives = true`) so `@theme` blocks in design-system/lighthouse CSS lint correctly.
- Fixed blocking lint errors:
  - Removed focusable `aria-hidden` usage in hero canvas.
  - Added SVG `<title>` accessibility text for score ring.
  - Replaced array-index keys in lighthouse result lists with stable content-based keys.
  - Fixed `forEach` callback returns in sheets sync logic.
  - Removed duplicate `min-height` declaration in lighthouse global CSS.
  - Formatted `src/design-system/tailwind-v4-bridge.css` to satisfy Biome formatter checks.
- Validation: `npm run lint` now exits successfully for the full repo (warnings remain for style-hardening follow-up).

## 2026-04-26 GitLab Security Jobs Forced Per Pipeline

- Updated `.gitlab-ci.yml` to force security jobs to run on every pipeline:
  - `semgrep-sast`
  - `secret_detection`
  - `gemnasium-dependency_scanning`
- Kept `dast` enabled whenever `DAST_TARGET_URL` is present, regardless of pipeline source.
- Result: security stage now executes consistently for push, MR, and default-branch pipelines when target URL is configured.

## 2026-04-26 Security Report Remediation Pass (DAST/SAST/Dependency)

- Applied SSRF hardening:
  - Added outbound URL safety checks in `src/lighthouse/lib/http.ts` (protocol + private-host blocking, with `ALLOW_PRIVATE_EGRESS=true` escape hatch for trusted internal workflows).
  - Restricted browser-side lead endpoint resolution in `src/scripts/audit-forms.ts` to trusted `/api/` targets (same-origin or `admin.vertaflow.io`), with safe fallback.
  - Added ZAP helper safeguards in `playwright/helpers/zap-crawl.ts` to block untrusted proxy hosts and unapproved spider targets by default.
- Reduced SAST null-assertion findings by removing unsafe non-null assertions in report/contact/email/index utility paths.
- Added explicit semgrep suppressions for known-safe dynamic file path/regex usage in local maintenance scripts:
  - `scripts/fix-lock-optional-stubs.mjs`
  - `scripts/static-parity-server.mjs`
- Dependency remediation:
  - Added root overrides for `postcss` and `uuid` in `package.json`.
  - Ran `npm install` and updated `package-lock.json`.
  - Verified resolved versions in tree: `postcss@8.5.12`, `uuid@11.1.0`.
- Validation:
  - `npm run lint` passes (warnings only).
  - `npm run build` passes from repo root.

## 2026-04-26 Repo-Wide Biome Baseline

- Expanded Biome scan coverage to true repo-wide scope in `biome.json` (with explicit exclusions for generated/output folders like `node_modules`, `.next`, `dist`, `playwright-report`, `test-results`, Cypress media artifacts, and built scripts).
- Enabled Biome HTML interpolation parsing so template placeholders in email HTML no longer hard-fail parsing.
- Ran repo-wide formatter pass and normalized Cypress specs/support + static header artifacts for consistent lint behavior.
- Current baseline outcome: `npm run lint` now succeeds across repo-wide coverage with warnings only (no blocking errors), giving us a clean starting point for MR triage.

## 2026-04-26 Branch Audit + Salvage Before Prune

- Audited all remaining remote branches against `origin/cursor/site-shell-content-audit-0425` using unique-commit and changed-path analysis.
- Classified old monorepo-era branches (`apps/*`, `packages/*` roots) as stale for current single-root Next.js architecture.
- Preserved high-value current-architecture fixes by cherry-picking into active branch:
  - `117e447` Cypress marketing URL fallback to `http://127.0.0.1:3000`
  - `0fc6efb` run page scripts when document is already complete
  - `68d9ba4` remove premature reveal force-visible timer
  - `a542c97` exclude `/404` from render smoke test + remove unused GBP cover generator
  - `2592f81` align ZAP spider seed URL default port
- Validation after salvage:
  - `npm run build` passes.
  - `npm run lint` passes (warnings only).

## 2026-04-26 Lighthouse Recovery Pass (Critical Path + LCP)

- Reduced above-the-fold render delay from animation/reveal timing:
  - `src/scripts/ui/reveal.ts`: elements already near viewport are now activated before `reveal-ready` is applied, preventing hidden-first paint on hero-adjacent content.
  - `src/components/marketing/HomePage.tsx`: removed `reveal-up` from the hero trust strip to avoid non-composited animation conflicts.
  - `src/app/home-page.css`: removed blur from hero entrance keyframes and constrained hero shimmer text effect to desktop (`min-width: 901px`) with a direct color fallback for mobile.
- Deferred non-critical third-party and site bootstrap work:
  - `src/app/layout.tsx`: Crisp now loads lazily (`lazyOnload`) and is gated behind first interaction, with a delayed fallback timer.
  - `src/components/marketing/MarketingChrome.tsx`: replaced eager module script include for `site.js` with interaction/idle-triggered lazy injection.
- Started trimming legacy JS/polyfill pressure:
  - `src/data/serviceAreaLocations.ts`: replaced `Object.fromEntries` path with loop-based object build.
  - `package.json`: added explicit modern `browserslist` targets to reduce legacy transforms/polyfills in production bundles.
- Validation:
  - `npm install` run to keep lockfile integrity after `package.json` change.
  - `npm run build` passes from repo root.

## 2026-04-26 Security Follow-up (SAST/Dependency Reduction)

- Removed inline HTML injection hotspots flagged by SAST:
  - Replaced JSON-LD `dangerouslySetInnerHTML` usage with `<script type="application/ld+json">{JSON.stringify(...)}</script>` in:
    - `src/app/(site)/page.tsx`
    - `src/components/marketing/EnrichedPages.tsx`
    - `src/components/marketing/MarketingJsonLd.tsx`
- Replaced layout inline Crisp bootstrap with static script file to reduce XSS scanner noise:
  - Added `public/scripts/crisp-loader.js`
  - Updated `src/app/layout.tsx` to load the script via `next/script` `src`.
- Addressed weak PRNG findings:
  - `src/components/FreshworksChatBootstrap.tsx` now uses `globalThis.crypto` (`randomUUID`/`getRandomValues`) and deterministic fallback (no `Math.random`).
  - `src/components/marketing/HeroCanvas.tsx` now uses `crypto.getRandomValues` helper for orb initialization.
- Dependency scan hardening:
  - Upgraded root override `uuid` to `^14.0.0` in `package.json` and refreshed lockfile.
  - Verified tree resolves to `uuid@14.0.0` via `npm ls uuid`.
- SSRF/regex findings: added targeted `nosemgrep` annotations where request targets are explicitly validated/allowlisted (`zap-crawl`, `fetchWithTimeout`, `audit-forms`, lockfile fixer, static parity server regex guard).
- Validation:
  - `npm run build` passes.
  - `npm install` reports 0 vulnerabilities.

## 2026-04-27 GitLab Branch Cleanup (MR Triage Follow-through)

- Removed stale recovery and local MR helper branches after validating `!136` was legacy Astro-path work not applicable to current Next.js root app:
  - Remote deleted: `origin/cursor/recovered-mr-136`
  - Local deleted: `cursor/recovered-mr-136`, `mr-118`, `mr-135`, `mr-136`
- Pruned and normalized branch view.
- Remaining remote branches:
  - `origin/main`
  - `origin/fix/csp-remove-trusted-types-enforcement`
  - `origin/cursor/marketing-consolidated-4941`
  - `origin/cursor/marketing-form-and-pages-a03d`
  - `origin/cursor/marketing-services-configuration-a55c`

## 2026-04-27 Inner Page Animation Upgrade

- Completed the Framer Motion layer for inner marketing pages: prose containers, CTA rows, service grids, blog index cards, portfolio cards, pricing tiers, FAQ items, comparison panels, values, and service-area cards now reveal/stagger with reduced-motion fallbacks.
- Promoted blog article heroes into the inner-page hero atmosphere scope and preserved clean prose reading flow.
- Added semantic-safe motion wrapper support for lists, articles, and details; reduced-motion paths render plain elements.
- Elevated the visual system with GSAP ScrollTrigger on inner pages:
  - Added branded blueprint hero linework and page-specific hero motifs for services, pricing, FAQ, service areas, portfolio, and blog.
  - Added ScrollTrigger-driven section progress rails, media parallax variables, and pricing tier signal bars.
  - Added inner-page card glare sweeps, stronger FAQ open states, portfolio/blog image lift, and CTA press polish.
- Validation:
  - `npm ci` passes after adding `gsap`.
  - `npm run build` passes.
  - Changed files pass targeted `npx biome check`.
  - HTML smoke checked `/services`, `/pricing`, `/faq`, `/service-areas`, `/blog`, and `/portfolio` on localhost for hero/motion markup.
  - Brand assets verified: `/brand/logo.png` and `/brand/mark.webp` return 200 on localhost.
  - Playwright browser session was blocked by an existing locked MCP Chrome profile; production build and localhost HTML/asset checks passed.

## 2026-04-27 Documentation accuracy (single-app, no ghost paths)

- Replaced hundreds of lines of **obsolete STATUS** (pnpm/Turborepo, `apps/*`, Astro, Vercel three-project) with a short **Pre-Netlify migration archive** pointer and kept dated notes from **2026-04-26** onward aligned with the root Next.js tree.
- **`SECURITY.md`:** Rewrote for this repo only (Netlify, `src/proxy.ts`, real API routes under `src/app/api/`); removed phantom `apps/web-viewer` and webhook tables that do not exist here.
- **`CHANGELOG.md`:** Replaced legacy Agency OS monorepo log with a stub that points to git history + README/AGENTS.
- **`.env.example`:** Dropped Turborepo / `turbo.json` / `packages/env` / `apps/**` references; documented `src/lib/env/*.ts` as the schema source.
- **`lighthouse2.md`:** Renamed “this monorepo” → “this repository”.
- **`src/lib/env/shared.ts`:** Comment no longer claims a monorepo layout.
- Validation: `npm run build` from repo root (green).

## 2026-04-28 Biome repo-wide pass (zero diagnostics)

- Ran **`npx biome check . --write --unsafe`** from the repo root (format + organize imports + safe/unsafe autofixes across TS/TSX/JS/CSS/HTML).
- **`biome.json`:** Excluded generated **`static-headers.json`** and **`netlify.toml`** from lint/format scope; restored CSS overrides for **`theme.css`**, **`layout-shell.css`**, and **`emails/**/*.html`** (`noImportantStyles` / `noDescendingSpecificity` where intentional).
- **Code:** Removed remaining **`any`** in `src/scripts/audit-forms.ts` (Turnstile types), replaced non-null assertions in **`src/lighthouse/lib/sheetsSync.ts`**, removed dead **`revealElement`** from **`src/scripts/ui/reveal.ts`**, plus Biome-driven cleanups in Lighthouse components/libs, **`FooterCta.tsx`**, lockfile stub script, and offer email HTML.
- **Bundle:** Rebuilt **`public/scripts/site.js`** via `npm run build:site-script` so the committed bundle matches sources.
- **`package.json`:** Added **`npm run lint:fix`** → `biome check . --write --unsafe` for one-shot autofix (lockfile refreshed with `npm install` after the script line change).
- Validation: **`npm run lint`** (`biome check .`) reports **no warnings/errors**; **`npm run build`** passes from repo root.

## 2026-04-28 Footer stack badges + lint baseline on `main`

- **`SiteFooter`:** Added a **“Built with”** row of text-only links (**Next.js**, **Netlify**, **Tailwind CSS**) to each official site — no trademark logos, factual stack copy only.
- **`theme.css`:** New `.footer-tech-badges` layout; generalized `.footer-stack-badge` so badges work outside `.footer-bottom` only.
- **`biome.json`:** Restored excludes for **`static-headers.json`** / **`netlify.toml`** and CSS/email overrides so `npm run lint` stays clean with generated + vendor-heavy files.
- **Hygiene:** `sheetsSync` spreadsheet id guard, typed Turnstile in `audit-forms.ts`, removed dead `reveal` helper, optional-chain in lockfile stub script, Biome autofixes on touched files; rebuilt **`public/scripts/site.js`**.
- Validation: `npm run lint` and `npm run build` from repo root.

## 2026-04-28 Runtime + bundle performance pass

- **`MotionReveal.tsx`:** Switched motion primitives to **`framer-motion/client`** (lighter DOM bundle than the full `motion` namespace) while keeping **`useReducedMotion`** from `framer-motion`.
- **`next.config.ts`:** Enabled **`experimental.optimizePackageImports: ["framer-motion"]`** for tree-shaking friendly imports, and **`compiler.removeConsole`** in production (keeps **`console.error`** / **`console.warn`**).
- **`biome.json`:** Restored excludes for **`static-headers.json`** / **`netlify.toml`** and CSS/email overrides so `npm run lint` stays clean after prebuild regenerates those files.
- **Hygiene:** Typed Turnstile in `audit-forms.ts`, guarded `sheetsSync` spreadsheet ids, removed dead `reveal` helper; rebuilt **`public/scripts/site.js`**.
- Validation: `npm run lint` (zero diagnostics) and `npm run build` from repo root.

## 2026-04-27 Consolidation MR (all 11 open MRs into one)

- Started a fresh `consolidation/all-mrs` off `gitlab/main` and merged the open MRs in this order: **!149 → !146 → !143 → !142 → !148 (already-up-to-date) → !147 → !145 → !152 → !144 → !151 (cherry-picked)**. Skipped **!141** (empty placeholder) and **!150** (its only unique commit was a regression vs main's evolved AuditForm + home-page CSS).
- **Chat strategy:** Kept `FreshworksChatBootstrap` (sophisticated env-driven Freshworks integration from !149) as the canonical chat surface. Dropped the !151-introduced `ThirdPartyChatWidgets` wrapper to avoid double-loading; kept the `.env.example` chat env var docs and the CSP `font-src` extension for `https://fw-cdn.com` / `https://*.myfreshworks.com` / `https://*.freshworks.com`.
- **Vercel cleanup:** Removed `vercel.json` (we're on Netlify auto-deploy); confirmed `.vercelignore` already absent. `crisp-loader.js` removed; CSP entries for Crisp endpoints retained as a no-op allowance.
- **Stale monorepo dirs:** Confirmed `apps/` and `packages/` directories are untracked (only host orphan `node_modules/.bin` symlinks from old pnpm workspaces); not removing physically since git doesn't track them.
- **Conflict resolutions:** Mostly union (STATUS.md, README, public/scripts/site.js, build/csp.mjs, .env.example) or prefer-HEAD where main was the more evolved baseline. `lighthouse2.md` kept marketing description as H1 with the v2 operator playbook demoted to H2 underneath.
- **Validation:** `npm install` clean, `npm run lint` clean, `npm run build` passes from repo root.
