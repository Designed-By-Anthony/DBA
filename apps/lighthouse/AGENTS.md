<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Environment variables and secrets placement

- **Primary file:** `apps/lighthouse/.env.local` (git-ignored). Copy from `apps/lighthouse/.env.example`.
- **Schema:** `packages/env/src/lighthouse.ts` — validated in `next.config.ts` via `validateLighthouseEnv()`.
- **Belongs on the Lighthouse Vercel project:** `GOOGLE_PAGESPEED_API_KEY`, `GEMINI_API_KEY` / `GEMINI_MODEL`, `TURNSTILE_SECRET_KEY` (must match marketing’s `PUBLIC_TURNSTILE_SITE_KEY`), `MOZ_API_CREDENTIALS`, `GOOGLE_PLACES_API_KEY`, optional `GMAIL_SERVICE_ACCOUNT_KEY`, `SHEETS_ID`, `DRIVE_PROJECTS_FOLDER_ID` (audit/report automation), `AGENCY_OS_WEBHOOK_URL` + `AGENCY_OS_WEBHOOK_SECRET` (forwarding leads to CRM), `REPORT_PUBLIC_BASE_URL`, `ALLOWED_ORIGINS`, Sentry (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, optional `SENTRY_AUTH_TOKEN`).

**Remove from Lighthouse (Agency OS only):** when the three-project split is used (`ADMIN_UPSTREAM_URL` set on the apex), **do not** set `CLERK_SECRET_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` on Lighthouse — env validation fails.

**Google Workspace vs Google Cloud APIs:** Leaving Google Cloud hosting does **not** remove Google APIs from Lighthouse. **PageSpeed Insights**, **Places**, and optional **Gemini** use API keys in this app. **Gmail / Sheets / Drive** folder IDs for the audit pipeline use `GMAIL_SERVICE_ACCOUNT_KEY`, `SHEETS_ID`, `DRIVE_PROJECTS_FOLDER_ID` here. **Client contracts, OAuth browser flow, and primary Drive/Docs** for CRM workflows live on **Agency OS** (`apps/web-viewer/.env.local` — `GOOGLE_CLIENT_*`, `GOOGLE_SERVICE_ACCOUNT_*`, `GOOGLE_DRIVE_*`, etc.), not on marketing.
