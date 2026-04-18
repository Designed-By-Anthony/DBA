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
