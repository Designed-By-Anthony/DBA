# Migration Status Report

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
