# AGENTS.md — Designed by Anthony monorepo

## Architectural Guardrails
- **Root-Only Execution:** All builds and installs must run from the root `./`.
- **Absolute Monorepo Paths:** Never use relative imports like `../../packages`. Always use workspace protocols: `@dba/database`, `@dba/theme`, `@dba/ui`.
- **Zero-Trust Multi-Tenancy:** Every database query MUST be scoped with `agencyId`. If a function lacks a tenant filter, it is a critical security bug.
- **SQL-First:** Firestore is deprecated. Any new feature must use Drizzle + Postgres 18.

## VERBATIM SYSTEM MAPPING
- **Sales Term:** "Agency" or "Agency OS"
- **Database Table:** `tenants`
- **Security Key (SQL):** `tenant_id` (UUID) or `clerk_org_id` (Text)
- **UI Logic:** Use `tenant.vertical` to drive the "Chameleon" skinning.

**Note to Agent:** While the user may refer to "Agency ID," all Drizzle queries MUST use the schema-defined `tenant_id` or `clerk_org_id` to maintain Postgres 18 integrity.

## Infrastructure Context
- **Database:** Postgres 18 live at `34.172.29.180`.
- **Auth:** Clerk-managed. `orgId` maps to `tenants.clerkOrgId`.
- **Routing:** Handled by root `middleware.ts`.
- **Apps:**
  - `admin.designedbyanthony.com` -> `apps/web-viewer`
  - `accounts.designedbyanthony.com` -> `apps/web-viewer/accounts`
  - `designedbyanthony.com` -> `apps/marketing`

## Compliance bar — DoD / HIPAA-oriented engineering

Treat **regulated-data expectations** as the default for this monorepo (even when a given deploy is not under a formal BAA yet). Agents should align with **NIST 800-53 / HIPAA Security Rule** themes: confidentiality, integrity, availability, and **minimum necessary** disclosure.

- **No secrets in source:** Never commit real API keys, DSNs, connection strings, webhook signing secrets, or tokens. Use env vars and `.env.example` placeholders only; client bundles must not embed operator-only credentials.
- **PHI / PII handling:** Assume CRM, portal, and lead payloads may include **protected health information** or sensitive PII. Do not log full bodies, tokens, or session identifiers at info level; redact or omit in client-visible errors. Prefer **generic** API error messages; log details server-side only.
- **Observability:** Error reporting (e.g. Sentry) must use **env-provided DSNs** only; keep `sendDefaultPii` off unless Legal/Security explicitly approves a BAA and scrubbing. Session Replay / full DOM capture is **opt-in** (it can capture PHI in the page).
- **Encryption in transit:** Postgres and external APIs use TLS in production; do not weaken SSL verification to “make it work.”
- **Tenant isolation:** Every data path remains **tenant-scoped** (`tenant_id` / `clerk_org_id`); no cross-tenant reads or “debug” shortcuts in production.
- **Audit mindset:** Favor explicit authz checks, rate limits, and structured server logging for security-relevant events.

When in doubt, choose the option that **discloses less** to clients and third parties.

## Code Quality & Purge Rules
- **Search Before Write:** Before adding a feature, check if a legacy Firebase version exists. If it does, delete it first.
- **Cleanup Duty:** After every feature completion, search for and remove unused imports, `console.log` statements, and any string containing "firebase".
- **Strict Typing:** No `any`. Use Zod for schema validation on all API inputs and JSONB columns.

## Communication Preferences
- **Conciseness:** Keep responses under 1000 characters.
- **Progress Tracking:** Always update `STATUS.md` after a major task.
- **Error Handling:** If a build fails, do not ask for permission to fix it. Analyze the log, fix the code, and retry.

## Definition of Done
A task is only **Done** when all three are true:
1. It passes `pnpm turbo build` (a.k.a. `pnpm build`) from the repo root with zero errors.
2. It has been audited by BugBot (self-review pass: tenant scoping, Zod on inputs, no `any`, no orphaned Firebase strings, no stray `console.log`, no unused imports).
3. The logo / branding renders **unbroken** on every affected surface — `/brand/logo.png` and `/brand/mark.webp` resolve, `@dba/theme` tokens are intact, and no subdomain is serving a fallback mark.

---

## Repo orientation

This file orients coding agents to the repo as a whole. Per-app specifics live in each app's own `AGENTS.md` (linked below). Always defer to those for app-local rules (build commands, test layouts, framework caveats).

### Repo layout

Turborepo + pnpm workspaces. Node `>=22.12.0`, pnpm `10.12.1` (pinned via `packageManager`).

```
/                    # apex Vercel project (Astro marketing) + root middleware
├── middleware.ts    # Vercel Routing Middleware "Chameleon" host-based router (see README.md)
├── turbo.json       # pipeline + globalEnv/globalDependencies
├── apps/
│   ├── marketing/   # Astro v6 — designedbyanthony.com (apex + www)
│   ├── web-viewer/  # Next.js 16 — admin.* + accounts.* (Agency OS / CRM)
│   └── lighthouse/  # Next.js 16 — lighthouse.* (audit tool)
└── packages/
    ├── dba-theme/           # @dba/theme — global CSS tokens + brand assets
    ├── lead-form-contract/  # @dba/lead-form-contract — shared lead payload schema
    └── database/            # @dba/database — Drizzle schema + Cloud SQL client
```

Per-app agent rules (read these before editing inside an app):

- `apps/marketing/AGENTS.md` — Astro site, Playwright projects, IndexNow, Firebase Hosting emulator, Spotlight gotcha.
- `apps/web-viewer/AGENTS.md` — Next.js 16 (read `node_modules/next/dist/docs/` before coding; APIs differ from training data).
- `apps/lighthouse/AGENTS.md` — Same Next.js 16 caveat.

Operator playbook with deployment + env notes: `ANTHONYS_INSTRUCTIONS.txt` and `README.md`. Migration state: `STATUS.md`.

### Common commands (run from repo root — see **Root-Only Execution** guardrail)

```bash
corepack enable && pnpm install   # first-time setup

pnpm build                         # turbo run build (all apps + packages)
pnpm lint                          # turbo run lint
pnpm dev:marketing                 # Astro on :4321
pnpm dev:web                       # Agency OS (Next) on :3000
pnpm dev:lighthouse                # Lighthouse (Next) on :3100

pnpm db:push                       # drizzle-kit push (needs DATABASE_URL)
pnpm db:seed:master                # seeds agency_master tenant

pnpm test:e2e                      # marketing + lighthouse + web-viewer Playwright
pnpm test:e2e:marketing            # individually
pnpm test:e2e:lighthouse
pnpm test:e2e:web
```

Use `pnpm --filter <pkg-name>` to scope a command to a single workspace (e.g. `pnpm --filter agency-os run lint`). Workspace names live in each `package.json` (`agency-os`, `lighthouse-audit`, `designed-by-anthony`, `@dba/theme`, `@dba/database`, `@dba/lead-form-contract`).

### Host-based routing — Vercel Routing Middleware

Root `middleware.ts` is Vercel Routing Middleware that runs on the apex (marketing) Vercel project and rewrites by `Host`. Do not rename this root file to `proxy.ts`; `proxy.ts` is the Next.js 16 convention used inside Next apps, while this root file belongs to the non-Next apex gateway.

- `admin.designedbyanthony.com/*` → `$ADMIN_UPSTREAM_URL/*` (web-viewer)
- `accounts.designedbyanthony.com/*` → `$ACCOUNTS_UPSTREAM_URL/portal/*` (web-viewer)
- `lighthouse.designedbyanthony.com/*` → `$LIGHTHOUSE_UPSTREAM_URL/*` (lighthouse)
- everything else → Astro marketing (fallthrough via `next()`)

Notes:

- The matcher only excludes `_vercel`; app subdomain assets like `/_next/static/*`, `/manifest.webmanifest`, `/serwist/*`, and `/brand/*` must pass through the gateway so they resolve from the correct upstream project.
- If an upstream env var is unset in production, the middleware returns a visible `502`; preview/local builds fall through for easier development.
- `vercel.json` intentionally only holds framework/build/output config; do **not** add `rewrites` there (they run before middleware and conflict with the Chameleon rules).
- `turbo.json` → `globalDependencies` includes `middleware.ts`, so changes invalidate every app's build cache.

### Theme + brand (single source of truth)

- Canonical CSS tokens: `apps/marketing/src/styles/theme.css` (`:root { ... }`).
- Mirrored for Next.js + Tailwind in `packages/dba-theme/tokens.css`.
- Re-exported via `@dba/theme` (`packages/dba-theme/dba-global.css`).
- Brand assets (logo/mark) live in `packages/dba-theme/brand/` and each app keeps a mirror at `public/brand/*` so `/brand/logo.png` and `/brand/mark.webp` resolve from any subdomain.

When changing tokens: edit `apps/marketing/src/styles/theme.css` **and** update `packages/dba-theme/tokens.css` to match (same variable names + values). Brand verification is part of **Definition of Done**.

### Data layer — `@dba/database`

- Drizzle ORM against Cloud SQL (Postgres 18 — see **Infrastructure Context**). Schema in `packages/database/schema.ts`.
- Tenant-scoped tables include `tenants`, `sites`, `leads`, `automations`, `tickets`, plus portal token/session tables.
- Tenant key in SQL is `clerk_org_id` (column) / `tenantId` (Drizzle field) / `agencyId` (guardrail wording). Every query **must** filter on it — see **Zero-Trust Multi-Tenancy**.
- Agency OS reads `DATABASE_URL` (and optional `DATABASE_SSL=true`) from `apps/web-viewer/.env.local`.
- Validate all API inputs and JSONB payloads with Zod — see **Strict Typing** in the purge rules.

### Lead intake (CRM is source of truth)

- Marketing audit/contact forms POST JSON to Agency OS `POST /api/lead` (not Lighthouse `/api/contact`).
- Marketing build env: `PUBLIC_CRM_LEAD_URL` (full URL) and `PUBLIC_API_URL` (Lighthouse base for `/api/audit` + report viewer).
- Shared payload contract: `packages/lead-form-contract/src/index.ts`.
- Org product tier: `org_settings.planSuite` = `starter` | `full` (default `full`); `starter` hides Automations, Sequences, Billing, Price Book in the admin sidebar.

### Vercel deploy model

Three Vercel projects pointing at this repo, each with a different Root Directory:

- `apps/marketing` — apex project; also serves the root `middleware.ts`.
- `apps/web-viewer` — admin + accounts.
- `apps/lighthouse` — lighthouse.

Apex project requires `ADMIN_UPSTREAM_URL`, `ACCOUNTS_UPSTREAM_URL`, `LIGHTHOUSE_UPSTREAM_URL` (also declared in `turbo.json` → `globalEnv`). All other secrets are per-app; the full allow-list is in `turbo.json` → `tasks.build.env`.

### Migration / cleanup notes

`STATUS.md` tracks the in-progress Firebase → Cloud SQL migration. When touching `apps/web-viewer/src` you may still see transitional `@/lib/firebase` imports and Firestore-shaped modules — per **Search Before Write** + **Cleanup Duty**, delete the Firebase version when you replace it, and grep for stray `firebase` strings before closing the task. Do not reintroduce Firebase deps to `apps/lighthouse` or `packages/database` (both are clean).

### Cursor Cloud specific instructions

- The cloud agent VM ships with pnpm + Node 22; run `pnpm install` at the repo root before any build/test if `node_modules` is missing.
- Per-app `AGENTS.md` files contain additional Cursor-Cloud-specific testing notes (especially `apps/marketing/AGENTS.md` for Playwright projects and the Firebase Hosting emulator on `127.0.0.1:5500`).
- Branch + PR conventions for cloud agents: create branches as `cursor/<descriptive-name>-<suffix>`, commit small logical changes, and open a PR per branch.
