<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Clerk (App Router) — parity with official quickstart

Verification checklist ([Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)):

1. **`src/middleware.ts`** exports a default `clerkMiddleware()` handler (Next.js 16 App Router convention). Matcher matches Clerk’s recommended pattern. **`auth.protect()` must not run on `/sign-in` or `/sign-up`** — it breaks Clerk’s interactive sign-in flow on admin.* hosts.
2. **`app/layout.tsx`** wraps the app with **`<ClerkProvider>`** inside `<body>`.
3. Imports use **`@clerk/nextjs`** / **`@clerk/nextjs/server`** only (no `authMiddleware`, pages router, or `SignedIn` / `SignedOut`).
4. **Keyless mode** works locally when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` are unset; production Vercel still requires real keys per `@dba/env` validation.

Use **`<Show when="signed-in">`** / **`<Show when="signed-out">`** for new UI instead of legacy signed-in/out wrappers.

## Vercel — Production build requires Production env vars

`next.config.ts` runs `validateWebViewerEnv()`. When **`VERCEL_ENV=production`**, the build fails unless the **Agency OS** project has these under **Environment → Production** (not only Preview):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (exact string — not `NEXT_PUBLIC_admin_CLERK_*` or other prefixes)
- `CLERK_SECRET_KEY` (exact string — not `admin_CLERK_SECRET_KEY`)
- `DATABASE_URL` or `DATABASE_URL_UNPOOLED`

**Ignored Build Step:** If you use a custom command that **`exit 1`** when `VERCEL_ENV=production`, Vercel **skips** Production builds. Remove it or use `exit 0` so `main` can deploy.

Preview builds use `VERCEL_ENV=preview` and skip that check — a green Preview does **not** guarantee Production will build.

**If you see:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production` → add the key to **Production** in Vercel and redeploy.

**Deploy workflow:** Merge to `main` / Production when ready; disabling or ignoring Preview deployments is a Vercel project setting (Git → ignored branches or deployment protection), not something this repo enforces.

## Data layer (Neon Postgres)

- **`DATABASE_URL`** — Neon connection string (pooled URL for the app; use the direct / unpooled host for `pnpm db:push` / `drizzle-kit` when Neon requires it).
- **`@dba/database`** — Drizzle + `pg`; `withTenantContext` sets `app.current_tenant_id` for RLS. No Firebase or Google Cloud SQL.

## Identity: who has a Clerk user id?

- **Agency staff (you / team)** — Sign into **admin** with Clerk (`userId`, `orgId`). RLS and tenant scoping use the active **Clerk organization id** as `tenant_id` / `tenants.clerk_org_id`.
- **Prospects / leads** — Stored only in Postgres **`leads`** (name, email, pipeline, notes, etc.). They **do not** need and **should not** be modeled as Clerk users for outreach and tracking. Optional **client portal** access uses **magic links** tied to `leads.email_normalized` + org (`/api/portal/magic-link`), not Clerk.
- **"My Clients" orgs** — Clerk **organizations** you create for customers who get their **own** CRM tenant; still distinct from individual prospects used for cold outreach.

Do not assume every CRM row maps to a Clerk `user_id`; only enforce Clerk auth on **admin** and **portal** routes that require it.

## Compliance (DoD / HIPAA-oriented)

See root `AGENTS.md` → **Compliance bar**. For Agency OS specifically:

- **Sentry:** Initialize only from **`NEXT_PUBLIC_SENTRY_DSN`** / **`SENTRY_DSN`** (never hardcode DSN strings in `sentry.*.config.ts`). Keep **`sendDefaultPii: false`** unless Security approves a BAA and scrubbing. Session Replay is gated by **`NEXT_PUBLIC_SENTRY_REPLAY=1`** (default off) because replay captures DOM that may contain PHI.
- **Public APIs:** Return **generic** 5xx/503 messages; never echo raw `Error.message` from DB/drivers to JSON clients on unauthenticated routes (e.g. lead ingest).
