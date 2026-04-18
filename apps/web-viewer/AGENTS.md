<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Clerk (App Router) — parity with official quickstart

Verification checklist ([Clerk Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)):

1. **`src/proxy.ts`** exports **`proxy`** from `clerkMiddleware()` (Next.js 16 naming; the docs’ `export default` is the older middleware style). Matcher matches Clerk’s recommended pattern.
2. **`app/layout.tsx`** wraps the app with **`<ClerkProvider>`** inside `<body>`.
3. Imports use **`@clerk/nextjs`** / **`@clerk/nextjs/server`** only (no `authMiddleware`, pages router, or `SignedIn` / `SignedOut`).
4. **Keyless mode** works locally when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` are unset; production Vercel still requires real keys per `@dba/env` validation.

Use **`<Show when="signed-in">`** / **`<Show when="signed-out">`** for new UI instead of legacy signed-in/out wrappers.

## Compliance (DoD / HIPAA-oriented)

See root `AGENTS.md` → **Compliance bar**. For Agency OS specifically:

- **Sentry:** Initialize only from **`NEXT_PUBLIC_SENTRY_DSN`** / **`SENTRY_DSN`** (never hardcode DSN strings in `sentry.*.config.ts`). Keep **`sendDefaultPii: false`** unless Security approves a BAA and scrubbing. Session Replay is gated by **`NEXT_PUBLIC_SENTRY_REPLAY=1`** (default off) because replay captures DOM that may contain PHI.
- **Public APIs:** Return **generic** 5xx/503 messages; never echo raw `Error.message` from DB/drivers to JSON clients on unauthenticated routes (e.g. lead ingest).
