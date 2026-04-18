# Migration Status Report

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
- `pnpm --filter agency-os lint` passed.
- `pnpm --filter agency-os exec tsc --noEmit` passed.
- `pnpm --filter agency-os build` passed and reports `ƒ Proxy (Middleware)`.
- Root `pnpm build` passed across marketing, lighthouse, and Agency OS. The command exited 0, but Turbo emitted a final low-disk warning: `No space left on device (os error 28)`.
- Brand asset mirrors were present for all three apps and `packages/dba-theme`: `/brand/logo.png` and `/brand/mark.webp`.

## Vercel/Turborepo project audit (2026-04-17)

The Vercel team is now reset to the intended three-project Turborepo layout:

- `dbastudio-315` (`prj_v9IdDn8DT9xEbmyZZ0dSHzBLIGJH`) remains the apex marketing/gateway project for `designedbyanthony.com` and `www.designedbyanthony.com`.
- `dba-agency-os` (`prj_wQTfns0ZSz5WKsEiLFot80r7eqp9`) was created for `apps/web-viewer` with `framework=nextjs`, `rootDirectory=apps/web-viewer`, and `turbo run build --filter=agency-os`.
- `dba-lighthouse-audit` (`prj_DE2b3J5IYsgJMyiRFRiIe7EW6EcL`) was created for `apps/lighthouse` with `framework=nextjs`, `rootDirectory=apps/lighthouse`, and `turbo run build --filter=lighthouse-audit`.

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
