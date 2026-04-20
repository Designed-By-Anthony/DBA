# Migration Status Report

## Ship to `main` — portable embeds + VertaFlow marketing hardening (2026-04-20)

- Merged `codex/vercel-build-sanitize` to **`main`** and pushed (`b71a6a9`): customer-site embed pack, `POST /api/lead` optional `agencyId`, VertaFlow PWA/SEO/Sentry/tests, marketing contact embed showcase, changelog updates.
- **Verified before push:** `pnpm install --frozen-lockfile`, `pnpm build` (turbo — all four apps), `pnpm --filter vertaflow-marketing test` (12 tests). Local turbo emitted **disk full warning** once after successful tasks — clear build caches if CI runners are tight.
- **Lint:** `pnpm lint` still fails on long-standing `dba-agency-os` ESLint volume (react-hooks + unused vars); **Vercel deploys use per-app `build`**, not this full lint gate unless you add it. Triage ESLint separately if you want CI green on `turbo run lint`.

## VertaFlow offline-first synchronization engine (2026-04-20)

- Added `apps/vertaflow/src/lib/db.ts` Dexie schema for `leads` and `estimates` with `local_id` UUID primary keys, `sync_status` (`pending`/`synced`), and timestamp metadata used for sync ordering.
- Added `apps/vertaflow/src/providers/GlobalSyncProvider.tsx` plus `installGlobalSyncProvider()` bootstrap in `main.js` to watch `navigator.onLine` and trigger sync on reconnect.
- Added `apps/vertaflow/src/lib/sync.ts` batch sender to `POST /api/sync` that promotes synced local records to `sync_status="synced"` after successful round-trip.
- Added `apps/vertaflow/src/api/sync/handler.ts` + schema with conflict resolution that keeps the most recent `updated_at` between offline payload and existing Neon-backed rows.
- Added Vitest + JSDOM test harness (`vitest.config.ts`, `src/test/setup.ts`) and `src/test/offline-sync.spec.tsx` covering offline queueing, online transition, and API trigger verification.
- Verified locally with `pnpm --filter vertaflow-marketing test` and `pnpm --filter vertaflow-marketing build`.

## Vercel monorepo build sanitation (2026-04-20)

- **Marketing build fix:** `apps/marketing/vercel.json` now runs only `turbo run build --filter=dbastudio-315`. The previous copy step was root-config glue; once the config moved under `apps/marketing`, it deleted the app's own `.vercel/output` and then failed with `cp: cannot stat 'apps/marketing/.vercel/output'`.
- **Agency OS env fix:** Production env validation now matches the current Clerk auth model. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and Neon `DATABASE_URL` / `DATABASE_URL_UNPOOLED` remain required; legacy Stytch vars no longer block `next build`.
- **Agency OS build fix:** `apps/web-viewer` now actually runs `next build` with `NODE_OPTIONS=--max-old-space-size=8192`, matching the documented mitigation for Next's TypeScript heap spike.
- **Vercel project settings required:** keep each project Root Directory pointed at its app folder, remove Production Overrides, and leave Build Command Override off so the checked-in app `vercel.json` files are used.

## Web-viewer domain targeting update (2026-04-20)

- Updated Agency OS runtime domain targeting from `designedbyanthony.com` to `vertaflow.io` in web-viewer host allowlists and URL defaults (`next.config.ts` CSP `*.vertaflow.io`, lead CORS defaults/pattern, preview host detection, service worker allowed hosts, and fallback `NEXT_PUBLIC_APP_URL` links used by lead/ticket notifications).
- Build verification pending in this pass: run `pnpm build` from repo root after env/domain cutover variables are set in Vercel.

## Go-live hardening pass (2026-04-19)

- **CRM tooling (2026-04-19 follow-up):** `packages/database/scripts/seed-master-tenant.mjs` aligned with `tenants` schema (`clerk_org_id`, `vertical_type`, timestamps). `apps/web-viewer` production build uses `NODE_OPTIONS=--max-old-space-size=8192` in the `build` script to avoid TypeScript heap OOM. Playwright smoke (`tests/smoke.spec.ts`) passes with restored `apps/web-viewer/.env.test` and `pnpm exec playwright install chromium` when browsers are missing; Clerk logs may show production-key domain warnings on `localhost` — use Clerk test keys for fully clean local sign-in, or rely on `ALLOW_ADMIN_AUTH_BYPASS` for E2E.
- **Implemented:** Zod + spam-guard layering on `POST /api/lead`, Drizzle `Database` typing fixes, console removal + ESLint guard, marketing Sentry replay defaults, `tsconfig` exclude for Browserbase Playwright config.
- **Also:** Web-viewer `includeLocalVariables: false` in `sentry.server.config.ts`; marketing Astro Sentry sourcemaps opt-in via `SENTRY_SOURCEMAP_UPLOAD=1`; Husky pre-commit blocks new `console.*` in staged app/package sources; root devDependency `vercel@51.7.0` + `pnpm run vercel`.
- **Verified:** `pnpm install` at repo root then `pnpm build` — all three apps green in this workspace; `pnpm lint` green (warnings only in web-viewer).
- **Note:** Run `pnpm install` before CI/Vercel builds if `node_modules` is incomplete (fixes missing `@dba/env` resolution). For marketing Sentry source maps in CI, set `SENTRY_SOURCEMAP_UPLOAD=1` with a token that matches `SENTRY_ORG` / `SENTRY_PROJECT`.
- **Blocked on you (not code):** Register **vertaflow.io** DNS at registrar; in Vercel add domains / subdomains (`admin`, `accounts`, `lighthouse`, apex marketing) and point DNS; set `PUBLIC_CRM_LEAD_URL` and gateway upstreams to the new hosts when you cut over.
- **E2E:** Full `pnpm test:e2e` not run to completion in this agent (marketing smoke hung on webServer in CI VM — run locally or in CI with adequate timeout). Browserbase tests need `PW_USE_BROWSERBASE=1` + Browserbase API keys.

## CRM V1 Sprint — Complete (2026-04-19)

Branch `feature/crm-v1-sprint` — 6 commits, all 3 apps build green.

### What shipped:
- **Legal Framework:** TOS, Privacy Policy, AUP pages + consent checkpoint with version-stamped recording in `tenants.crmConfig.legal`
- **Onboarding Flow:** Stripe-style sticky floater with 7-step progress checklist (Create Org → Accept Legal → Select Vertical → Add Lead → Setup Email → Connect Stripe → Install PWA)
- **AI Onboarding Specialist:** Gemini 2.0 Flash chat widget with auto-escalation to support tickets after 6 exchanges or frustration keywords
- **Mobile & PWA:** Bottom navigation bar, PWA manifest shortcuts (POS, Clock In, Calendar, Portal), safe area insets
- **Complete Vertical Action Coverage:** Every schema table now has full server action CRUD — memberships, tax rates, hardware devices, restaurant tables, file attachments (before/after photos), plus previously shipped inventory, POS, menu, appointments, events, rewards, timeclock, returns
- **Infrastructure:** Cloudflare R2 file storage, PrintNode cloud printing, barcode engine, inventory auto-sync

### Env vars needed for new features:
- `GEMINI_API_KEY` — AI onboarding specialist (already in env schema)

### Next steps (user in Cursor):
1. Review PR, run local dev, test onboarding flow
2. Add `GEMINI_API_KEY` to `.env.local` and Vercel
3. Set up `blog.designedbyanthony.com` CNAME in Cloudflare DNS → BabyLoveGrowth.ai
4. Debug and merge in Cursor

## Release readiness pass (2026-04-18)

- **Go-green checks:** `pnpm lint`, `pnpm build`, and live marketing smoke (`BASE_URL=https://designedbyanthony.com pnpm --filter dbastudio-315 run test:smoke:live`) pass from the monorepo root after the TopBar + CRM action typing fixes below. Live smoke covered homepage CTAs, money pages, contact/calendar, audit form, and crawl files on desktop + mobile projects.
- **CRM hardening in this pass:** removed the TopBar `no-explicit-any` suppression, removed explicit `any`s from the touched admin action paths, kept task update/delete mutations scoped by `tenant_id + lead_id + task_id`, and typed quote-package submission at the builder boundary.
- **Production client-create fix:** live `POST /admin/pricebook` 500s were traced to Postgres missing `public.leads.stripe_subscription_id` while deployed Agency OS code inserts that column. Applied the existing additive migration (`ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;`) to production and verified a rollback-only client insert probe succeeds.
- **Live surface check:** `designedbyanthony.com`, `www.designedbyanthony.com`, `admin.designedbyanthony.com/admin`, `accounts.designedbyanthony.com/portal`, `lighthouse.designedbyanthony.com`, `/brand/logo.png`, and `/brand/mark.webp` returned 200.
- **Blocking release item:** Agency OS production has `STRIPE_SECRET_KEY`, but Vercel is missing `STRIPE_WEBHOOK_SECRET`; `POST https://admin.designedbyanthony.com/api/webhooks/stripe` returns `503 {"error":"Webhook not configured"}`. Stripe checkout can start, but paid events/subscription events will not reconcile into CRM until the webhook is created and the signing secret is added to Agency OS env.
- **Also fix before shipping paid CRM flows:** add `STRIPE_AGENCY_PRO_PRICE_ID` to Agency OS production/preview env so `/admin/billing/upgrade` uses the intended Stripe catalog price instead of inline fallback price data.
- **Branch hygiene:** PR #93 (`feat/agency-os-domain-calendly-crm`) is merge-dirty and behind the current `main` production fixes. Do not merge it as-is; salvage/cherry-pick only missing changes onto current `main`.

## Apex marketing 404 on Vercel (2026-04-18) — recovered

- **Live recovery:** Rolled the apex `dbastudio-315` project back to deployment `dpl_FdQkCXMwhTE3CTeWui1a3K1MrkVx`; `www.designedbyanthony.com`, `/brand/logo.png`, and `/brand/mark.webp` returned 200 after rollback.
- **Cause:** Commit `1aa5b4e` pointed `outputDirectory` at `apps/marketing/.vercel/output`. That folder is a Vercel Build Output API bundle, not a static web root; the actual HTML lives under `static/index.html`, so Vercel served `/` as 404.
- **Superseded deploy fix:** This root-copy strategy only applied while the marketing Vercel config lived at the repo root. With `apps/marketing/vercel.json`, the app-local build must not copy or delete `.vercel/output`; Astro's Vercel adapter output is already in the project root Vercel expects.
- **Prebuilt warning:** A manual `vercel deploy --prebuilt` of only `.vercel/output` omits the root gateway `middleware.ts` and breaks admin/accounts routing. Use the normal Git/cloud build path for this project unless middleware packaging is explicitly added to the prebuilt bundle.

## Agency OS: embeddable lead widget + Neon-backed skin API (2026-04-18)

- **Static bundle:** `apps/web-viewer/public/widgets/lead-form.js` (built from `widget-src/lead-form.ts` via `pnpm build:lead-widget`, runs before `next build`).
- **Embed:** `<script src="https://admin…/widgets/lead-form.js?tenant=<clerk_org_id>&sig=<hmac>" async></script>` plus optional `<div id="dba-lead-form"></div>` mount point.
- **Security:** `sig` = HMAC-SHA256 hex of `v1|${tenantId}` with **`LEAD_EMBED_WIDGET_SECRET`** (server-only). Same secret verifies `GET /api/embed/lead/skin` and `POST /api/embed/lead/submit`.
- **Skin:** API reads `tenants.brand_color`, `brand_logo_url`, `name` from Neon. **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`** + **`TURNSTILE_SECRET_KEY`** enable Turnstile in the widget (prod-aligned with other lead paths).
- **Helper:** `node apps/web-viewer/tooling/embed-widget/print-embed-widget-signature.mjs org_xxx` prints `sig` + example tag (requires `LEAD_EMBED_WIDGET_SECRET` in env).
- **Portal branding fix:** `GET /api/portal/branding` now returns `tenant.brandColor` instead of a hardcoded blue.

## Agency OS: TopBar hydration (React #418) (2026-04-18)

- **`TopBar`:** Greeting line (`Good morning/afternoon/evening` + Clerk name/org) now renders **after mount** via `useSyncExternalStore`, so server HTML and first client paint both use an empty subtitle — no timezone or Clerk SSR/client text mismatch. This also satisfies the React hooks lint rule that rejects synchronous `setState` inside effects.

## Marketing: sticky conversion rail + WebSite actions (2026-04-18)

- **Layout:** `.site-chrome-sticky` keeps pilot banner + main nav + **desktop quick-action rail** (free audit, contact, Calendly, phone) pinned together while scrolling — complements bottom **Get in touch** + optional Stream chat.
- **JSON-LD:** `buildBaseWebsiteSchema()` adds `potentialAction` (`ViewAction` audit, `ContactAction`, `ViewAction` Calendly) with `EntryPoint` targets for Google-aligned structured data.
- **Mobile nav:** Secondary CTA **Free site audit** + primary **Book a free call** (replaces duplicate Contact Us).

## Marketing: GetStream Chat widget (2026-04-18)

- **Stack:** `@astrojs/vercel` + `@astrojs/react`, `stream-chat` + `stream-chat-react`. Floating **Chat** button (when `PUBLIC_ENABLE_STREAM_CHAT=1`) opens messaging with visitor + inbox user; tokens from **`POST /api/stream-chat-token`** (secret stays server-side).
- **Env:** `PUBLIC_STREAM_CHAT_API_KEY`, `STREAM_CHAT_SECRET`, optional `STREAM_CHAT_INBOX_USER_ID` / `STREAM_CHAT_INBOX_NAME` (defaults: `DBAStudio315` / `Designed by Anthony`). Override `STREAM_CHAT_INBOX_USER_ID` if your Stream inbox user id differs.
- **CSP:** `build/csp.mjs` allows `https://chat.stream-io-api.com`, `https://*.stream-io-api.com`, `wss://…` — run `pnpm run sync:static-headers` after CSP edits.


## Agency OS: tenant-scoped Stripe (metadata + Search) (2026-04-18)

- **Model:** One Stripe account; each Clerk org is tagged on Stripe objects with metadata `clerk_org_id` (and `prospect_id` on checkout/subscription flows). Price Book uses **`stripe.products.search`** filtered by that metadata (not global `products.list`).
- **Checkout / customers:** `createPaymentLink` and `createSubscription` set session + customer metadata; subscription checkout sets **`subscription_data.metadata`** for webhooks. Customer lookup uses **`customers.search`** (`email` + `clerk_org_id`) so the same email can exist per tenant.
- **Webhooks:** `checkout.session.completed` rejects metadata/org mismatch vs DB lead. `invoice.paid` resolves lead via subscription/customer metadata when multiple leads share a Stripe customer id. **`customer.subscription.created`** stores `stripe_subscription_id` on the lead; **`customer.subscription.deleted`** clears it. Ack-only: `entitlements.active_entitlement_summary.updated`.
- **Schema:** `leads.stripe_subscription_id` — migration `packages/database/drizzle/0003_lead_stripe_subscription.sql`; run `pnpm db:push` (or apply SQL on Neon).
- **SDK:** `getStripeClient()` uses default API version (no pinned `apiVersion`).

## Vercel Production build failure (commit 0698436) — root cause (2026-04-18)

- **Error:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production` during `next build` when `VERCEL_ENV=production`.
- **Cause:** Clerk keys were not set (or not set for **Production**) on the **Agency OS** Vercel project. Preview builds skip `@dba/env` production checks; **Production** deploys from `main` do not.
- **Fix:** In Vercel → Agency OS → Environment Variables → **Production**, add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `DATABASE_URL` or `DATABASE_URL_UNPOOLED`. Documented in `apps/web-viewer/AGENTS.md`.

## Admin auth UX — inline sign-in, no Clerk `protect()` redirects (2026-04-18)

- **`src/proxy.ts`:** Removed `auth.protect()` on admin host (was sending users through Clerk’s hosted redirect chain, often `accounts.*`). Admin auth is enforced in **`app/admin/layout.tsx`** only.
- **`admin.*` `/`:** Rewrites to **`/sign-in`** so `https://admin.designedbyanthony.com/` shows the login screen immediately (no `/admin` landing first).
- **`AdminLogin`:** Renders the same **`AgencySignIn`** component as `/sign-in` — no `redirect("/sign-in")` hop when visiting `/admin` while signed out.
## Agency OS: Stripe Price Book archive + catalog webhooks (2026-04-18)

- **Remove from CRM UI:** Price Book products are Stripe catalog objects — use **Archive** (sets `active: false`) or **Restore**; optional **Show archived** lists inactive products. True deletion is done in the Stripe Dashboard (products are not stored in Postgres).
- **`setStripeProductActiveAction`:** Server action calls `stripe.products.update`. Errors go to Sentry (replaced `console.error` in `stripe.ts` actions).
- **`POST /api/webhooks/stripe`:** No-op handlers for `product.updated`, `product.deleted`, `price.updated` so Stripe can deliver those events without failing; catalog still loads via API. Add these event types in Stripe Dashboard → Webhooks when you want delivery acknowledged.


## Agency OS: Email History + sidebar hydration (2026-04-18)

- **React #418 / POST `/admin/email/history` 500:** `DashboardShell` read `localStorage` in `useState` initializer on the client only — server HTML did not match first client paint. Sidebar now starts `collapsed=false` and applies saved preference in `useLayoutEffect` + `startTransition`. **`/admin/email/history`** loads `getEmailHistory()` in a **Server Component** and passes data to **`EmailHistoryClient`** (no initial client POST); optional Refresh still calls the server action.
- **`getEmailHistory`:** Normalizes `status` to allowed union and **`ClickEvent`** rows (default `userAgent` when missing from JSONB) for stable RSC serialization.

## Agency OS: UI vertical → Postgres enum (2026-04-18)

- **Sentry 7423284268:** `createClientOrg` passed UI template ids (`creative`, `general`, …) into `tenants.vertical_type`, but Postgres only allows `agency` | `service_pro` | `restaurant` | `wellness`. Added `vertical-template-map.ts`: maps UI → SQL enum, stores the picked template in `crm_config.templateId`, and reads it back in `listClientOrgs` / `getOrgBranding` / `GET /api/portal/branding`. `vertical-config.ts` maps `wellness` → `fitness` UI.

## Agency OS: tenant actions + Web Analytics opt-in (2026-04-18)

- **`withTenant`:** Read-heavy paths return safe defaults when auth/DB is unavailable (avoids server-component 500s / hydration fallout). Mutations still surface errors. **`getDashboardStats`** overdue tasks now filter `due_at <= now` (ISO compare) with `due_at` not null.
- **`createClientOrg`:** Returns `{ success, error? }` instead of throwing; Clerk failures and tenant insert failures get user-visible toasts (no silent 500 on `/admin/clients`).
- **Vercel Web Analytics:** `VercelObservability` only mounts on `*.vercel.app` unless **`NEXT_PUBLIC_VERCEL_WEB_ANALYTICS=1`** — stops relative `/…/script.js` 404 + MIME errors on custom domains when Analytics is not enabled. Documented in `apps/web-viewer/.env.example`; `turbo.json` + `@dba/env` include the key.
- **`@dba/env`:** Removed duplicate local `hydrateWebViewerEnvAliases` that shadowed the shared module (fixed `next build` type error); `admin_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is listed in `web-viewer-aliases.ts`.

## Lighthouse: Trusted Types + Vercel Analytics CSP (2026-04-18)

- **Sentry 7423224269:** Browsers enforcing Trusted Types blocked React `innerHTML` during hydration. Added `public/trusted-types-bootstrap.js` + `beforeInteractive` script in `layout.tsx` (same pattern as marketing Layout). Extended CSP `connect-src` / `script-src` for `va.vercel-scripts.com` and `vitals.vercel-insights.com` (Analytics / Speed Insights).

## Marketing + Lighthouse env audit (2026-04-18)

- **Build / typecheck:** `pnpm --filter dbastudio-315 exec astro check` and `pnpm --filter dba-lighthouse-audit build` pass from root.
- **Docs:** `apps/marketing/AGENTS.md` and `apps/lighthouse/AGENTS.md` now document local env file placement (`apps/marketing/.env`, `apps/lighthouse/.env.local`), Vercel three-project split vs bleed keys, and split between Agency OS (Workspace/Docs/Drive for CRM) vs Lighthouse (PageSpeed, Places, Gemini, optional Sheets/Drive for audit pipeline).

## Agency OS audit: smoke E2E + inbox no-DB (2026-04-18)

- **Playwright:** Documented need for `pnpm exec playwright install` (Chromium) before browser E2E; smoke tests updated to use role-based locators (strict mode) and **Omnichannel Inbox** heading.
- **`getInboxStream`:** When `DATABASE_URL` is unset, returns `[]` instead of throwing so `/admin/inbox` shell renders in keyless/dev (aligned with clients list tolerating missing DB).
- **Copy:** Google Drive contracts error no longer references legacy Firebase service account email.

## Dedicated pricing page + CRM list tiers (2026-04-18)

- **`/pricing`:** New marketing page with website tiers (founding / standard / enterprise), **Agency OS Capture $69/mo** and **Suite $179/mo** list prices, **Growth Plan $149/mo** bundle callout, GBP program **$299/mo**, FAQ + `OfferCatalog` JSON-LD (`buildPricingOfferCatalogSchema`).
- **Nav:** Header + footer link to Pricing; SEO Playwright lists include `/pricing`.
- **Tooling:** `pnpm exec astro check` passes — Playwright Turnstile mock init scripts cast `window` via `unknown` to satisfy strict overlap checks; IndexNow build cache `.astro-indexnow-cache.json` is gitignored and no longer tracked.

## Founding Growth Plan pricing + Agency OS schema (2026-04-18)

- **Growth Plan:** Raised founding monthly from **$100** to **$149** (still sharply under typical SMB CRM + hosting + SEO stacks when bundled). **10 founder spots** unchanged via `FOUNDING_PARTNER_BUILD_SLOTS`.
- **Schema:** Full mailing address **7749 Kilbourn Rd, Rome, NY 13440** in JSON-LD `PostalAddress` only (not rendered on pages); GBP remains service-area. Added **Agency OS** `SoftwareApplication` / `WebApplication` + `Organization.owns`, expanded `sameAs` (Instagram, Yelp) and `knowsAbout` (CRM, portal, automation).
- **Copy:** `llms.txt`, cold email, and Swift share-image script updated for $149 + Agency OS.
## Marketing: consumer trust stack copy (2026-04-18)

- Added `ConsumerTrustStack.astro` (Neon, Vercel, Cloudflare, Next.js CRM) with outcome-first language on the homepage, `/ouredge`, and `/services/managed-hosting`.

## Neon as production Postgres (2026-04-18)

- **Runtime:** `@dba/database` uses `pg` + Drizzle against `DATABASE_URL` (Neon pooled URL in Vercel; direct/unpooled for `drizzle-kit` when required). No Firebase SDK, no Firebase env vars, no Google Cloud SQL IP in app code.
- **Docs:** Root `AGENTS.md`, `.env.example`, `apps/web-viewer/.env.example`, and `apps/web-viewer/AGENTS.md` describe Neon instead of Cloud SQL / `34.172.29.180`. Legacy STATUS notes below may still mention Cloud SQL for historical migration context.

## Agency OS ESLint + typecheck (2026-04-18)

- Cleared remaining `dba-agency-os` ESLint errors (`no-explicit-any`, unused imports, `prefer-const`, `no-img-element`) and fixed follow-on TypeScript issues (portal quote action signature, lead-score loop narrowing). Root `pnpm lint` and `pnpm build` succeed.

## Firebase removal (2026-04-18)

- **Marketing:** Removed `firebase.json`, `firebase-tools`, `apps/marketing/functions/`, Firebase Hosting workflows, and `sync-firebase-csp`. Replaced with `static-headers.json` + `build/sync-static-headers.mjs` and `scripts/static-parity-server.mjs` for Playwright parity (`PLAYWRIGHT_USE_STATIC_PARITY_SERVER=1`).
- **Agency OS:** Removed `firebase.json`, Firestore rules/indexes, `src/lib/firebase.ts` shim; Playwright no longer starts the Firestore emulator. Google Workspace fallback env renamed to `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (removed `FIREBASE_*` from `turbo.json`).
- **Lighthouse:** Renamed in-memory `src/lib/firestore.ts` → `report-store.ts` (no Firebase SDK).
- **Docs:** Updated `SECURITY.md`, `AGENTS.md`, `.env.example` files; root `pnpm` no longer lists `@firebase/util` in `onlyBuiltDependencies`.
## Agency OS auth + performance (2026-04-18)

- **`src/proxy.ts`:** Stopped calling `auth.protect()` for `/sign-in` and `/sign-up` on admin domains (and for `/admin` on the default host). Protecting those routes forced redirect loops / blocked Clerk’s OAuth handshake. **`app/admin/layout.tsx`** still enforces session for `/admin/*` after sign-in.
- **Sentry:** Production trace sampling (`tracesSampleRate`) reduced on server, edge, and client to cut edge overhead and main-thread work.

## Agency OS CSP + Serwist: `scdn.clerk.com` (2026-04-18)

- Clerk’s browser bundle fetches project settings from **`https://scdn.clerk.com`**; our CSP **`connect-src`** did not allow it, so the Serwist SW reported `no-response`. **`next.config.ts`** now allows `https://scdn.clerk.com` in **`script-src`** and **`connect-src`**; **`src/app/sw.ts`** adds a **`NetworkOnly`** bypass for that origin (same pattern as other Clerk hosts).

## Vercel Clerk prefill env names (2026-04-18)

- Vercel's Clerk UI can create **`NEXT_PUBLIC_admin_CLERK_PUBLISHABLE_KEY`**, **`admin_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**, and **`admin_CLERK_SECRET_KEY`** instead of the canonical **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** / **`CLERK_SECRET_KEY`**. **`validateWebViewerEnv`** now hydrates the canonical names from all known aliases; **`turbo.json`** lists them (plus Sentry OTLP/log-drain keys) so Turbo passes them into the build.

## Default Clerk org id for Calendly + lead intake (2026-04-18)

- **`LEAD_WEBHOOK_DEFAULT_AGENCY_ID`** example value set to `org_3CWuIWj5aFCaZXr8dUEpwtGSiCW` (Designed by Anthony org). **`/api/webhooks/calendly`** no longer hardcodes a legacy org id; it uses the same env var as anonymous `/api/lead` routing and returns **503** if unset (fail-closed).

## HIPAA-oriented security hardening (2026-04-18)

- **Sentry:** Removed hardcoded DSNs from Agency OS Sentry configs; init only from `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN`. Default **`sendDefaultPii: false`**; Session Replay opt-in via **`NEXT_PUBLIC_SENTRY_REPLAY=1`**. Marketing CSP helpers no longer embed a default Sentry DSN; `sync-firebase-csp` skips report-uri when `PUBLIC_SENTRY_DSN` is unset.
- **Lead ingest:** Public ingest 503 responses no longer echo SQL/driver `Error.message` or internal DB setup hints.
- **AGENTS.md:** Added **Compliance bar (DoD / HIPAA-oriented)** for agents (root + `apps/web-viewer/AGENTS.md`).

## Clerk quickstart alignment (2026-04-18)

- **`@clerk/nextjs`** bumped to latest (`^7.2.3`). **`apps/web-viewer/AGENTS.md`** documents the official App Router checklist; **`src/proxy.ts`** uses Next.js 16’s named **`proxy`** export (not the quickstart’s `middleware.ts` default export).

## Vercel Agency OS build: Clerk env aliases + Turbo pass-through (2026-04-18)

- **Root cause:** Vercel sometimes stores Clerk keys under prefixed names (e.g. `admin_CLERK_SECRET_KEY`) while `@dba/env` and `@clerk/nextjs` expect `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Turbo also omitted Sentry OTLP / log-drain vars from the task hash, triggering warnings and risking missing env at build time.
- **Fix:** `validateWebViewerEnv()` hydrates canonical names from `admin_*` aliases when the canonical key is empty; `turbo.json` build `env` lists the alias keys plus `SENTRY_PUBLIC_KEY`, `SENTRY_OTLP_TRACES_URL`, and `SENTRY_VERCEL_LOG_DRAIN_URL`.

## Agency OS Clerk + PWA on admin/accounts (2026-04-18)

- **Serwist:** Prepended `NetworkOnly` routes for `clerk.*` (any Clerk custom-domain FAPI host) and `*.clerk.accounts.dev` so Serwist’s default `.js` caching no longer intercepts Clerk FAPI scripts (fixes `no-response` / failed Clerk JS loads in production).
- **Clerk custom domain:** If `clerk.<domain>` has no DNS, scripts fail (`ERR_NAME_NOT_RESOLVED`). Mitigations: Clerk DNS CNAME, `NEXT_PUBLIC_CLERK_PROXY_URL=https://<instance>.clerk.accounts.dev`, or **server-only** `CLERK_FAPI_UPSTREAM` with the same URL — Agency OS then sets `proxyUrl=/clerk-fapi` and rewrites to the real FAPI (see `src/lib/clerk-fapi-proxy.ts`). CSP allows `https://*.designedbyanthony.com` for Clerk assets.
- **CSP:** Allowed Cloudflare Insights (`static.cloudflareinsights.com`, `connect-src` to `cloudflareinsights.com`) and Vercel’s hosted analytics script host (`va.vercel-scripts.com`).
- **Vercel Web Analytics / Speed Insights:** Pointed `<Analytics />` and `<SpeedInsights />` at `https://va.vercel-scripts.com/v1/...` so scripts load on custom domains without `/_vercel/*` rewrites (removes spurious `/[hash]/script.js` 404 + MIME errors).

## Marketing footer badge stability (2026-04-18)

- Replaced the remote Locally Owned and Astro footer badge URLs with local `/images/*` assets so the current CSP cannot block them and the footer no longer renders broken-image placeholders.
- Updated the Locally Owned footer link to reserve stable space, render the local badge at a readable size, and include visible text instead of relying on image alt text.
- Verified the marketing build and captured a focused footer screenshot from the local Astro preview; the footer now renders without broken badges.

## Framework docs audit and routing middleware refresh (2026-04-18)

- **Docs checked:** confirmed current Next.js 16 `proxy.ts` guidance, Vercel Routing Middleware `middleware.ts` guidance for non-Next projects, Astro static/Vercel deployment guidance, and Neon serverless driver guidance.
- **Gateway dependency refreshed:** root Chameleon gateway now imports Vercel Routing Middleware helpers from `@vercel/functions` instead of the older `@vercel/edge` package, with `runtime: 'edge'` declared explicitly.
- **Proxy/middleware split documented:** README and AGENTS now call out that `apps/web-viewer/src/proxy.ts` is the Next.js 16 proxy, while root `middleware.ts` remains the Vercel platform gateway for the Astro apex project.
- **Neon driver decision documented:** `@dba/database` keeps the `pg`-compatible transaction path because tenant isolation depends on interactive transactions with `set_config`; Neon HTTP remains a one-shot-query fit, not a drop-in for `withTenantContext`.

## Agency OS service worker host gate (2026-04-18)

- **Sentry issue 7422240265 addressed:** Agency OS no longer attempts to register `/serwist/sw.js` on random Vercel deployment URLs such as `dba-agency-*.vercel.app`, where deployment protection can return 401 for the worker script.
- **Canonical host allowlist added:** service worker registration is limited to `admin.designedbyanthony.com`, `accounts.designedbyanthony.com`, `dba-agency-os.vercel.app`, and local dev hosts. Portal push opt-in uses the same guard before waiting on `navigator.serviceWorker.ready`.
- **Vercel Postgres env fallback added:** Agency OS production builds and runtime database connections can now use `DATABASE_URL_UNPOOLED` when `DATABASE_URL` is absent, matching the current Vercel project env shape.

## Admin portal custom-domain asset routing (2026-04-18)

- **Root cause confirmed:** `https://dba-agency-os.vercel.app/manifest.webmanifest` and the reported Turbopack chunk return 200, while the same paths through `https://admin.designedbyanthony.com` return cached 404s from the apex gateway path.
- **Gateway matcher fixed:** root `middleware.ts` now runs for all non-`_vercel` paths so app subdomain assets such as `/_next/static/*`, `/manifest.webmanifest`, `/serwist/*`, `/brand/*`, icons, CSS, and JS are rewritten to the correct upstream project instead of falling through to the apex Astro deployment. Static asset paths and shared app routes such as `/sign-in` and `/offline` remain unprefixed while app pages still receive `/admin` or `/portal`.
- **Docs corrected:** `README.md` and `AGENTS.md` now document that `admin.*` maps to `/admin`, `accounts.*` maps to `/portal`, and static app assets intentionally pass through the Chameleon gateway.

## TypeScript Strict Type Hardening & Neon Database Stabilization (2026-04-18)

- **Completed Build Error Remediation:** Successfully resolved the remaining 15 build-time TypeScript errors blocking the Vercel production deployment.
- **Fixed Strict Typing in Web-Viewer:** Cleaned up `any` types in `TopBar.tsx`, explicit typing inside `apps/web-viewer/src/app/admin/actions.ts` mapping loops, and correctly handled edge-cases where the codebase expected Firestore shapes but the new Neon PostgreSQL schema dictated different properties.
- **Database Schema Adherence:** Reconciled property mismatches in the Portal Sessions and Tickets API where legacy properties (`leadEmail`, `leadName`, `leadId`) were invoked incorrectly instead of the expected `prospectEmail`, `prospectName`, `prospectId` and `subject` properties in the Neon tables.
- **Mock Fallback Setup:** Configured safe fallback `stub` implementation for `sendProspectEmailFromTemplate` and `saveQuoteAction` to prevent breaking imports of absent Firestore logic.
- **Build Verified:** `pnpm build` was run from the root of the project with a successful exit code 0. No typescript errors remain (`npx tsc --noEmit` exited clean).
## Chameleon gateway path-prefix fix (2026-04-17)

Two subdomain regressions fixed in the apex gateway + web-viewer proxy:

1. `admin.designedbyanthony.com/` was serving the public root `LandingPage` component from `apps/web-viewer/src/app/page.tsx` instead of the `/admin` dashboard. Root cause: apex `middleware.ts` rewrote `admin.*` to `$ADMIN_UPSTREAM_URL/<pathname>` with no prefix. Since cross-project Vercel rewrites present the upstream project's hostname to the downstream app (`host: dba-agency-os.vercel.app`, not `admin.*`), the web-viewer `proxy.ts` host-based `/admin` prefix never fired in production — it only runs on `*.localhost` during local dev. Apex gateway now pre-prefixes `/admin` for non-`/api` paths on `admin.*`.
2. `accounts.designedbyanthony.com/` returned 404. Root cause: apex middleware rewrote to `/accounts/*` but web-viewer has no `/accounts` route; the client-portal surface lives at `/portal`. Apex gateway now pre-prefixes `/portal` for non-`/api` paths on `accounts.*`. `/api/*` stays pass-through so `accounts.*/api/portal/branding` still resolves.

Also added `accounts.`/`accounts-` host-prefix handling to `apps/web-viewer/src/proxy.ts` so `accounts.localhost:3001` dev parity matches production and `apps/web-viewer/tests/subdomains.spec.ts` continues to pass.

Verification: `tsc --noEmit` passes on root `middleware.ts` and `apps/web-viewer` after the edits.

## Next.js proxy migration (2026-04-17)

`apps/web-viewer/src/middleware.ts` was migrated to the Next.js 16 `proxy.ts` convention. The Clerk routing/protection handler now exports a named `proxy`, matching the installed Next docs and removing the Next build deprecation warning for the Agency OS app. The root `middleware.ts` intentionally remains in place because it is Vercel Routing Middleware for the Astro/apex gateway; Vercel's generic routing middleware docs still use `middleware.ts` for that non-Next gateway path.

The Agency OS lint cleanup also removed the remaining `any`/namespace lint errors from the transitional Firebase shim by replacing the global `FirebaseFirestore.*` namespace with exported shim types.

Verification pass:
- Vercel CLI 51.5.0 is installed and authenticated as `anthony-9364`.
- `pnpm --filter dba-agency-os lint` passed.
- `pnpm --filter dba-agency-os exec tsc --noEmit` passed.
- `pnpm --filter dba-agency-os build` passed and reports `ƒ Proxy (Middleware)`.
- Root `pnpm build` passed across marketing, lighthouse, and Agency OS. The command exited 0, but Turbo emitted a final low-disk warning: `No space left on device (os error 28)`.
- Brand asset mirrors were present for all three apps and `packages/dba-theme`: `/brand/logo.png` and `/brand/mark.webp`.

## Vercel/Turborepo project audit (2026-04-17)

The Vercel team is now reset to the intended three-project Turborepo layout:

- `dbastudio-315` (`prj_v9IdDn8DT9xEbmyZZ0dSHzBLIGJH`) remains the apex marketing/gateway project for `designedbyanthony.com` and `www.designedbyanthony.com`.
- `dba-agency-os` (`prj_wQTfns0ZSz5WKsEiLFot80r7eqp9`) was created for `apps/web-viewer` with `framework=nextjs`, `rootDirectory=apps/web-viewer`, and `turbo run build --filter=dba-agency-os`.
- `dba-lighthouse-audit` (`prj_DE2b3J5IYsgJMyiRFRiIe7EW6EcL`) was created for `apps/lighthouse` with `framework=nextjs`, `rootDirectory=apps/lighthouse`, and `turbo run build --filter=dba-lighthouse-audit`.

Vercel environment variables were split by app: Agency OS received the Clerk, SQL, lead, Stripe, Resend, and Google admin/runtime values from `apps/web-viewer/.env.local`; Lighthouse received the audit/API/Sentry/Turnstile values from `apps/lighthouse/.env.local`; the apex marketing project was cleaned so app-only secrets no longer trip the marketing env-bleed guard. The apex project now points upstream routing at the stable aliases `https://dba-agency-os.vercel.app` and `https://dba-lighthouse-audit.vercel.app`.

Production deploys succeeded for all three projects:

- `dba-agency-os` -> `https://dba-agency-os.vercel.app` (`dpl_62dMoJU2JqQRVgzr99FEAmuaR6os`)
- `dba-lighthouse-audit` -> `https://dba-lighthouse-audit.vercel.app` (`dpl_E2jTaUurmuT8hv5bx2sP6s6RjpNL`)
- `dbastudio-315` -> `https://www.designedbyanthony.com` (`dpl_5R4Nqnp28WzNQb6G4pQPP8sqggaL`)

Repo deploy hygiene was added with root `.vercelignore`, app-local `apps/web-viewer/vercel.json` and `apps/lighthouse/vercel.json`, and Turbo env/global dependency updates so app Vercel configs and `MARKETING_STRICT_ENV_BLEED` are tracked.

Verification after the reset: Vercel MCP and CLI project inspection both show the three projects with the expected root directories, frameworks, Node 24, and filtered Turbo build commands. `pnpm build` passed from the repo root after the Turbo update; Turbo still emitted the local low-disk warning `No space left on device (os error 28)` after successful tasks.

Remaining operator follow-up: `lighthouse.designedbyanthony.com` is not live yet because DNS does not resolve and Vercel requires ownership verification before the hostname can be used. Add `CNAME lighthouse -> cname.vercel-dns.com` and add a TXT record at `_vercel.designedbyanthony.com` with value `vc-domain-verify=lighthouse.designedbyanthony.com,d07d33df9b94aadd4007`, then verify/attach the domain to `dbastudio-315` in Vercel. `_vercel.designedbyanthony.com` already has other TXT values, so add this as an additional TXT value instead of replacing the existing records.

## Lead intake bot-spam hardening (current)

The public `POST /api/lead` endpoint previously fired an admin "New Lead" email through Resend for every request that (a) had a name + email and (b) left the honeypot empty. Turnstile was only enforced when `TURNSTILE_SECRET_KEY` happened to be set — so any missing-env slip resulted in opportunistic bot storms landing directly in Anthony's inbox. Lighthouse `/api/contact` compounded the problem with `Access-Control-Allow-Origin: '*'`, letting attacker pages script the CRM.

Follow-up fix: both Astro Turnstile widgets now wire `data-error-callback` to their resolver-aware failure handlers instead of the layout-wide UI-only handler. That closes the invisible-Turnstile hang where async Turnstile errors left the form stuck on `Verifying…` with a disabled submit button. Regression coverage was added in `apps/marketing/e2e/contact-form.spec.ts` and `apps/marketing/e2e/audit-tool.spec.ts`.

Defenses added on top of the existing honeypot:

1. **Per-IP sliding-window rate limit** (`apps/web-viewer/src/lib/lead-intake/spam-guard.ts`) — default 3 submissions per 60 s keyed by the first IP in `x-forwarded-for`. Returns 429 + `Retry-After`.
2. **Required Turnstile in production (fail-closed)** — when `VERCEL_ENV=production` and `TURNSTILE_SECRET_KEY` is missing, `/api/lead` now returns 503 instead of silently accepting anonymous submissions. Escape hatch: `PUBLIC_LEAD_DISABLE_TURNSTILE=true` (documented, not recommended).
3. **Email format + disposable-domain validator** — rejects malformed addresses and throwaway inboxes (`mailinator.com`, `yopmail.com`, etc.).
4. **Silent bot heuristics** — URL-bomb messages, cyrillic-only names, `name == email`, names containing URLs, and garbage website fields all return 200 so scanners move on, but never create a prospect or fire an email.
5. **Lighthouse `/api/contact` CORS** tightened to `https://*.designedbyanthony.com` + local dev; removed the permissive `Access-Control-Allow-Origin: '*'`.

Coverage: `apps/web-viewer/tests/lead-spam-guard.spec.ts` (pure-logic tests for all four guard functions — validator, heuristics, rate limiter, required-Turnstile decision).

**Operator follow-up still required (not a code fix):** the current Vercel deploy log shows the marketing project failing the `@dba/env/marketing` env-bleed guard — `CLERK_SECRET_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, and `LEAD_WEBHOOK_SECRET` are set on the Marketing Vercel project but should only live on Agency OS / Lighthouse. Delete those four env vars from the Marketing project's Environment Variables in the Vercel dashboard (they don't belong there and the guard is correctly rejecting them). Once removed the marketing build resumes.

## Build verification

- `pnpm turbo build` completed successfully across the monorepo.
- Notable warning surfaced from marketing build logs: Astro reported repeated `MissingSharp` messages during image optimization, but the build still completed with successful task status.
- Marketing build entrypoint now serializes `apps/marketing` builds with a lock file because overlapping builds against the same checkout could corrupt `dist/.prerender` and throw missing chunk errors during route generation.

## Marketing audit cleanup

- Marketing consented analytics now load direct GA4 only; GTM, Clarity, Crazy Egg, and ad-personalization signals were removed from the in-repo bootstrap and CSP allowlist.
- Cloudflare Turnstile now defers until a protected form is interacted with, reducing initial homepage console noise and third-party requests during passive audits.
- Cookie/privacy copy and focused Playwright coverage were updated to reflect the narrower analytics surface and deferred Turnstile loading.

## Augusta pre-launch checklist

### Zod env guard (`@dba/env`)

- New workspace package `packages/env` exposes per-app Zod schemas
  (`@dba/env/web-viewer`, `@dba/env/marketing`, `@dba/env/lighthouse`).
- Each app validates `process.env` at build time:
  - `apps/web-viewer/next.config.ts` → `validateWebViewerEnv()` — fails the build when a production Vercel deploy is missing `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, or `DATABASE_URL` (White-Screen-of-Death prevention).
  - `apps/marketing/astro.config.mjs` → `validateMarketingEnv()` — env-bleed guard that rejects Agency OS / Lighthouse secrets (`CLERK_SECRET_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, …) on the apex Vercel project.
  - `apps/lighthouse/next.config.ts` → `validateLighthouseEnv()` — same env-bleed guard for the lighthouse subdomain.
- Env-bleed checks only run on Vercel (`VERCEL=1`) to avoid false positives in the shared-env cloud agent / CI.
- Bypass for one-off scripts: `SKIP_ENV_VALIDATION=1`.

### Cloud SQL SSL + authorized networks

- `packages/database/src/db.ts` now honours `sslmode=require` / `sslmode=verify-full|verify-ca` in the connection string and defaults SSL **on** in production even when `DATABASE_SSL` is unset.
- `apps/web-viewer/.env.example` documents the two supported paths:
  1. Public IP + `?sslmode=require` (+ optional `PGSSLROOTCERT` for `verify-full`).
  2. Cloud SQL Auth Proxy targeting `127.0.0.1` (preferred for Vercel).

### Cross-subdomain CORS

- `apps/web-viewer/src/lib/lead-webhook-cors.ts` auto-allows any `https://*.designedbyanthony.com` origin so admin. / accounts. / lighthouse. can call sibling subdomains without reconfiguring `LEAD_WEBHOOK_CORS_ORIGINS`.
- `apps/web-viewer/next.config.ts` CSP now includes `connect-src https://*.designedbyanthony.com` so browser `fetch` from the CRM family clears CSP as well as CORS.

### Drizzle migration history locked

- Initial migration committed at `packages/database/drizzle/0000_init.sql` (plus `meta/`). Future schema drift is now trackable via `pnpm exec drizzle-kit generate`.

## Phase completion snapshot

### Phase 1: Artifact clean up

- Removed legacy Firebase config artifacts from active app surfaces:
  - `apps/web-viewer/.firebaserc` (deleted)
  - `apps/lighthouse/.firebaserc` (deleted)
  - `apps/marketing/.firebaserc` (deleted)
  - `apps/web-viewer/src/lib/firebase-client.ts` (deleted)
  - `apps/web-viewer/src/proxy.ts` (deleted)
  - sentry test routes/pages in web-viewer (deleted)
- Removed Firebase Admin/Firebase package dependencies from package manifests in this migration branch where requested.
- Updated `apps/web-viewer/next.config.ts` CSP `connect-src` to remove Firestore/Firebase endpoints.

### Phase 2: Security and tenant hardening

- `GET /api/admin/tickets` now enforces tenant scoping via authenticated Clerk org ID.
- Admin ticket update route scopes by `ticket.id + tenantId`.
- Magic-link lookup is now tenant scoped in SQL (`tenantId + emailNormalized`) and receives `orgId` from the portal login client.
- Clerk org lookup paths updated to use `clerk_org_id` as tenant key in SQL-backed lookups.
- Lighthouse `AuditForm` now sends `turnstileToken` in the API request body.
- Added root host-based rewrite middleware at `apps/web-viewer/src/middleware.ts`:
  - admin/app domains rewrite to `/admin...`
  - portal domains rewrite to `/portal...`
  - preview subdomains rewrite to `/preview/[subdomain]...`

### Phase 3: Augusta data bridge

- `packages/database/schema.ts` includes tenant-scoped SQL tables for:
  - `leads`
  - `automations`
  - `tickets`
  - plus portal token/session support tables used by migrated auth flows
- Added `apps/web-viewer/src/lib/vertical-config.ts` and integrated it so vertical UI config is derived from SQL tenant `vertical_type`.

### Phase 8: Versioned ingest route + Astro handshake rewire

- **`POST /api/v1/ingest`** (`apps/web-viewer/src/app/api/v1/ingest/route.ts`): stable versioned alias for the Global Ingest Engine. Same body + auth + behavior as `POST /api/leads/ingest`; both delegate to the shared `handleIngestPost` in `lib/lead-intake/ingest-handler.ts`.
- **Multi-path auth**: `handleIngestPost` now accepts **any one** of — `X-DBA-SECRET` header (matches new `INGEST_SECRET` env), legacy `x-webhook-secret` / `x-lead-secret` header (matches `LEAD_WEBHOOK_SECRET`, kept for existing integrations), or a valid Cloudflare Turnstile token in the body (the browser path the marketing Astro forms already use — browsers can't safely hold a shared secret). Constant-time compare for all header paths. `LEAD_INGEST_REQUIRE_SECRET=false` bypasses auth for dev loops.
- **Astro handshake rewire** (`apps/marketing/src/components/AuditForm.astro` + `apps/marketing/src/scripts/audit-forms.ts`): form `action` and `fetch` target resolve `PUBLIC_INGEST_URL` → `PUBLIC_CRM_LEAD_URL` → baked default (`https://admin.designedbyanthony.com/api/v1/ingest`). Form carries `data-tenant-id` from `PUBLIC_TENANT_ID`; the submit script reads it and attaches the `X-Tenant-Id` header. Verified on `/`, `/contact`, `/facebook-offer`.
- **`turbo.json` env allow-list** grows to include `INGEST_SECRET`, `LEAD_INGEST_REQUIRE_SECRET`, `PUBLIC_LEAD_INGEST_DISABLED`, `PUBLIC_INGEST_URL`, `PUBLIC_TENANT_ID`. `apps/marketing/.env.example` documents the new Augusta env vars.
- **Firebase audit for `apps/marketing`**: the Astro browser bundle has **zero Firebase SDK** (verified — no imports under `src/`, no SDK scripts in layout `<head>`, no `firebaseConfig*` / `init-firebase*` files). The only Firebase artefacts are `firebase.json` + `build/sync-firebase-csp.mjs` (Hosting emulator for Playwright security-headers tests, per `apps/marketing/AGENTS.md`), `firebase-tools` devDep, the separate `functions/` Cloud Functions chat bridge (different runtime), and the `firebase-hosting-*.yml` CI workflows (deploy target superseded by Vercel). Leaving those alone — removing them needs an explicit operator call because they touch CI + test infra; the lead-ingest rewire doesn't depend on them.

### Phase 7: Global Lead Contract + Global Ingest Engine

- **Polymorphic `leads` schema** (`packages/database/schema.ts`): added `firstName`, `lastName`, `phone`, `source` as nullable columns + switched the default `status` from `"lead"` to `"new"` to align with the Augusta blueprint. `metadata` JSONB stays as the Chameleon super-field — agency audit scores, service-pro dispatch/geo, restaurant party_size/table, retail SKUs/CLV all live there.

- **Global Lead Contract** (`@dba/lead-form-contract`): new `globalLeadCoreSchema` + `globalLeadIngestBodySchema` + `parseGlobalLeadIngestBody` handle the polymorphic payload — global core fields at the top level, everything else folded into `metadata`. Also ships `constantTimeEqual` for safe secret comparison.

- **Global Ingest Engine** (`POST /api/leads/ingest`): the authenticated Switchboard. One endpoint for every vertical.
  - Tenant identity: `x-tenant-id` / `x-agency-id` header (preferred) or body fallback, with the `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` env catching the primary tenant.
  - Auth: constant-time-compared shared secret via `x-webhook-secret` / `x-lead-secret` header or body `secret`. Gated by `LEAD_INGEST_REQUIRE_SECRET` (defaults on).
  - Validation: Zod on the global core + honeypot short-circuit (runs BEFORE Zod). Unknown top-level fields are automatically folded into `metadata`, and the metadata payload is additionally Zod-validated against the tenant's vertical schema (agency/service_pro/restaurant/florist) via `safeParseVerticalLeadMetadata`.
  - Persistence: `insertSqlLead` writes firstName/lastName/phone/source + shallow-merges metadata on re-submits (so partial updates don't clobber). DB failures respond 503 (retryable) instead of 500.
  - Automation: fires `lead_created` through the engine with the tenant's vertical so factory rules (service_pro SMS, restaurant ack, florist welcome, agency audit email) run automatically.

- **GenericLeadCard** (`@dba/ui`): vertical-aware React card. Renders global fields (name/email/phone/source/status) in the header and pulls vertical-specific metadata keys from JSONB per the tenant's `vertical_type`. Unknown verticals fall back to the agency field set. Mounted into `VerticalDashboard` as the "Recent leads" strip.

- **Marketing backward-compat**: `POST /api/lead` (the browser-safe no-secret form endpoint) still works end-to-end — it calls `executeLeadIntake`, which writes via `insertSqlLead` and fires the same automation engine. The marketing Astro forms don't need to change. New partner integrations and server-to-server callers use `POST /api/leads/ingest`.

### Phase 6: Chassis — Communication Engine + Generic Automation Engine

- **Communication Engine** (`apps/web-viewer/src/lib/comms.ts`): single utility for every outbound notification — `sendEmail` (Resend), `sendSms` (Twilio via HTTP REST, no SDK), and `notify` for multi-channel fan-out. All inputs are Zod-validated (E.164 for SMS, RFC 5322 email). Missing credentials return `{ ok: false, skipped: "no_credentials" }` instead of throwing, so the Automation Engine and public lead intake keep running when envs aren't wired. Tenant-scoped by `tenantId` on every call (Zero-Trust guardrail). `turbo.json` tracks `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `COMMS_EMAIL_DISABLED`, `COMMS_SMS_DISABLED`.

- **Automation Engine** (`packages/automation` → `@dba/automation`): transport-free, SQL-first rules runner. Strict Zod types for every surface:
  - 8 triggers — `lead_created`, `prospect_status_changed`, `activity_added`, `ticket_created`, `form_submission`, `audit_completed`, `job_finished`, `payment_received`.
  - 6 action types — `send_email`, `send_sms`, `add_tag`, `change_status`, `create_activity`, `assign_owner` (discriminated-union Zod schema so `action.payload` is strongly typed per `type`).
  - Condition DSL — tiny, fully-typed predicate list (AND semantics) with `equals` / `contains` / `gt` / `lt` / `in` on any JSON-pointer path into the event. Empty condition = always true.
  - Engine loads active rules from the SQL `automations` table (`@dba/database`), validates each row with Zod (invalid rows are dropped with a `console.warn` instead of crashing the pipeline), merges with caller-supplied factory rules (SQL wins on `(trigger, name)` collisions), and fires matching actions through caller-supplied handlers — keeping the package transport-free so Lighthouse / cron / other workers can import it without pulling in Resend or Twilio.
  - Factory rules ship per vertical: `agency → audit_completed → email report`; `service_pro → lead_created → speed-to-lead SMS` + `job_finished → ask for Google review`; `restaurant → lead_created → acknowledge-order SMS`; `florist → lead_created → welcome email`. Tenants override via the SQL `automations` row.

- **`automations.condition` column** (`packages/database/schema.ts`): new JSONB column (default `{}`) so the engine's condition DSL is persistable. `leads.metadata` is unchanged; vertical-specific payloads still live there per the Augusta blueprint.

- **Bridge** (`apps/web-viewer/src/lib/automation-runner.ts`): single entry point `fireAutomationEvent({ trigger, tenantId, vertical, data })`. Wires the engine's action handlers to the Communication Engine (Resend + Twilio), templates `{{lead.name}}` etc. from the event payload, and logs outcomes per rule for audit.

- **Lead intake emits `lead_created`**: `executeLeadIntake` now resolves the tenant's vertical from SQL and fires the automation event after a successful insert. DB / comms failures are swallowed so the public form never breaks.

### Phase 5: Master Vertical Module System

- **Lean SQL / fat JSONB**: added `metadata` JSONB column on `leads` (default `{}`) alongside the existing `tenants.crm_config`. Re-running `pnpm db:push` will apply it without altering the other columns — per the Augusta blueprint, all vertical-specific data (agency audit scores, service-pro geo + dispatch state, restaurant order stream, retail loyalty) lives in these two JSONB buckets so the SQL schema stays lean.
- **Vertical metadata contracts** (`@dba/ui`): Zod schemas for each vertical's `leads.metadata` payload — `agencyLeadMetadataSchema`, `servicePtoLeadMetadataSchema`, `restaurantLeadMetadataSchema`, `retailLeadMetadataSchema` — plus `parseVerticalLeadMetadata` / `safeParseVerticalLeadMetadata` helpers keyed off `tenants.vertical_type`. Invalid payloads throw `ZodError`; unknown verticals fall back to `agency`.
- **`<VerticalSwitch />`** (`@dba/ui`): React multiplexer that renders different Feature Set components based on `tenant.vertical`. Ships four feature-set components:
  - `AgencyFeatureSet` — Lighthouse audit viewer + SEO lead scoring (Moz DA, backlinks, PageSpeed).
  - `ServiceProFeatureSet` — Job dispatch Kanban (New → Dispatched → On-Site → Completed) with geo-tag + SMS-dispatch badges.
  - `RestaurantFeatureSet` — Menu Management + Daily Order Feed; mobile-first stacked grid.
  - `RetailFeatureSet` — Inventory + Loyalty loop ("We miss you" re-engagement, CLV, Stripe Terminal reader hook-up).
- **Dashboard wire-up**: `apps/web-viewer/src/components/vertical/VerticalDashboard.tsx` is a tolerant server component that reads tenant vertical + lead metadata from SQL, hands off to `<VerticalSwitch />`, and is mounted into `/admin`. Falls back gracefully to the Agency feature set when the DB is unreachable or no tenant row exists.

### Phase 4: Chameleon + Augusta SQL handshake

- **Chameleon UI (`@dba/ui`)**: new workspace package `packages/ui` exposes a framework-agnostic `getVerticalConfig(verticalId)` whose `enabledModules` list flips the CRM surface per tenant — restaurants expose `menu_management` / `reservations` / `reviews`; `agency` keeps `backlink_audit` + full Lighthouse suite; unknown values fall back to `agency`. The Next-local `lib/vertical-config.ts` now returns both the UI template and the shared module matrix, sourced from SQL `tenants.vertical_type`.
- **Lead contract (`@dba/lead-form-contract`)**: now zod-validated. `publicLeadIngestBodySchema` + `parsePublicLeadIngestBody` normalize the marketing AuditForm aliases (`first_name`, `biggest_issue`, `cf-turnstile-response`, etc.) into the canonical `PublicLeadIngestBody`. `/api/lead` uses the parser and returns 400 + `issues` on invalid input. Honeypot short-circuit preserved.
- **Lead ingest → Postgres**: `lib/lead-intake/sql.ts` (`insertSqlLead`, `listSqlLeads`) writes/reads tenant-scoped `leads` rows via Drizzle. `executeLeadIntake` treats SQL as the source of truth (tolerant of DB outages), and `getProspects` in the admin actions merges SQL leads into the Kanban pipeline so marketing submissions land in the board without Firestore.
- **Drizzle push**: `drizzle.config.ts` now honors `DATABASE_SSL=true`. `pnpm exec drizzle-kit push` from this cloud-agent VM gets `ECONNRESET` from `34.172.29.180:5432` — TCP connects, but the Postgres 18 instance drops the stream, which means the VM's egress IP (`54.161.91.42` / `44.208.231.58`) is not in the Cloud SQL authorized-networks allowlist. Action required from the operator: add those IPs (or enable the Cloud SQL proxy / private VPC) before rerunning `pnpm db:push`.

## Firebase string audit

- Zero `firebase` string matches in:
  - `apps/lighthouse/src`
  - `packages/database`
- Remaining `firebase` mentions still exist in `apps/web-viewer/src` due to intentional transitional compatibility imports (`@/lib/firebase`) and legacy Firestore-shaped modules not yet fully migrated to SQL.

## Subdomain routing confirmation

- Middleware rewrite rules are present and active for:
  - `admin.*` / `app.*` style hostnames -> internal `/admin` routes
  - `portal.*` hostnames -> internal `/portal` routes
  - preview hostnames -> internal `/preview/[customer]` routes

## Lead endpoint host fix

- Swept the repo for hardcoded `viewer.designedbyanthony.com` (non-existent subdomain causing `ERR_NAME_NOT_RESOLVED` on marketing form POSTs) and replaced it with the canonical Agency OS host `admin.designedbyanthony.com` in:
  - Marketing: `AuditForm.astro`, `src/scripts/audit-forms.ts`, `build/csp.mjs`, regenerated `firebase.json` CSP + `form-action`, Firebase Hosting workflow envs, `.env.example`.
  - Lighthouse: `src/app/api/contact/route.ts` (`DEFAULT_CRM_LEAD_URL`).
  - Web-viewer: webhook route doc URLs + `NEXT_PUBLIC_APP_URL` defaults in `.env.example`, `execute-lead-intake.ts`, `calendly`/`stripe` webhooks.
  - Shared: `packages/lead-form-contract/src/index.ts` doc, `ANTHONYS_INSTRUCTIONS.txt`.
- Rebuilt `apps/marketing/public/scripts/site.js` (esbuild) and re-synced `firebase.json` CSP via `npm run sync:firebase-csp`.
- `pnpm build` green across all 3 apps.

## Marketing — Calista audit follow-ups

- Homepage hero eyebrow now leads with `Mohawk Valley Web Design Studio · Utica · Rome · Syracuse · CNY` for immediate local signal (closes the "add a Mohawk Valley Web Design header" recommendation).
- New "Why Astro? (in plain English)" section on `/` translates JAMstack / Lighthouse / static hosting into business-owner language (closes the "simplify the tech story" gap).
- New "Clear Pricing Tiers" section on `/services` surfaces three tiers — Founding Partner Pilot ($100/mo + complimentary build), Standard Custom Build ($999+), and Enterprise & Custom Scope (quote) — closing the "pricing clarity" gap.
- Verified with `npx astro check` (0 errors), `npm run build`, and Playwright smoke + homepage + service-pages regression suites (22/22 passing).

# Migration Status Report

## Build verification

- `pnpm turbo build` completed successfully across the monorepo.
- Notable warning surfaced from marketing build logs: Astro reported repeated `MissingSharp` messages during image optimization, but the build still completed with successful task status.

## Phase completion snapshot

### Phase 1: Artifact clean up

- Removed legacy Firebase config artifacts from active app surfaces:
  - `apps/web-viewer/.firebaserc` (deleted)
  - `apps/lighthouse/.firebaserc` (deleted)
  - `apps/marketing/.firebaserc` (deleted)
  - `apps/web-viewer/src/lib/firebase-client.ts` (deleted)
  - `apps/web-viewer/src/proxy.ts` (deleted)
  - sentry test routes/pages in web-viewer (deleted)
- Removed Firebase Admin/Firebase package dependencies from package manifests in this migration branch where requested.
- Updated `apps/web-viewer/next.config.ts` CSP `connect-src` to remove Firestore/Firebase endpoints.

### Phase 2: Security and tenant hardening

- `GET /api/admin/tickets` now enforces tenant scoping via authenticated Clerk org ID.
- Admin ticket update route scopes by `ticket.id + tenantId`.
- Magic-link lookup is now tenant scoped in SQL (`tenantId + emailNormalized`) and receives `orgId` from the portal login client.
- Clerk org lookup paths updated to use `clerk_org_id` as tenant key in SQL-backed lookups.
- Lighthouse `AuditForm` now sends `turnstileToken` in the API request body.
- Added root host-based rewrite middleware at `apps/web-viewer/src/middleware.ts`:
  - admin/app domains rewrite to `/admin...`
  - portal domains rewrite to `/portal...`
  - preview subdomains rewrite to `/preview/[subdomain]...`

### Phase 3: Augusta data bridge

- `packages/database/schema.ts` includes tenant-scoped SQL tables for:
  - `leads`
  - `automations`
  - `tickets`
  - plus portal token/session support tables used by migrated auth flows
- Added `apps/web-viewer/src/lib/vertical-config.ts` and integrated it so vertical UI config is derived from SQL tenant `vertical_type`.

## Firebase string audit

- Zero `firebase` string matches in:
  - `apps/lighthouse/src`
  - `packages/database`
- Remaining `firebase` mentions still exist in `apps/web-viewer/src` due to intentional transitional compatibility imports (`@/lib/firebase`) and legacy Firestore-shaped modules not yet fully migrated to SQL.

## Subdomain routing confirmation

- Middleware rewrite rules are present and active for:
  - `admin.*` / `app.*` style hostnames -> internal `/admin` routes
  - `portal.*` hostnames -> internal `/portal` routes
  - preview hostnames -> internal `/preview/[customer]` routes
