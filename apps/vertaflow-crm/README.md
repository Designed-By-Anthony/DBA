# Agency OS (Web Viewer)

Next.js app for **Designed by Anthony**: admin CRM, client portal, lead intake, billing, and automations.

## Commands

```bash
npm run dev          # local dev
npm run build        # production build
npm run lint         # ESLint
npm run verify:webhook   # smoke-test POST /api/webhooks/lead (needs LEAD_WEBHOOK_SECRET)
npm test             # Playwright (starts Next on :3001 against Postgres via DATABASE_URL)
npm run test:no-emu-server   # alias for `npm test` (legacy script name)
npm run test:pw -- tests/foo.spec.ts   # same as test:no-emu-server
npm run dev:test     # Next on :3001 with NODE_ENV=test (loads .env.test)
SKIP_WEBSERVER=1 npm test   # use when dev server is already up on :3001
npm run test:report  # open last HTML report (traces/videos on failure — see playwright.config.ts)
```

### Playwright debugging

- Failures save **trace + video** under `playwright-report/` (`trace: 'retain-on-failure'`).
- Open the report: `npx playwright show-report playwright-report`.
- **`net::ERR_CONNECTION_REFUSED` at `localhost:3001`:** nothing is serving the app. Run tests from the project root with `npm test` so Playwright can start Next. If you use `SKIP_WEBSERVER=1`, run the dev server on **:3001** (e.g. **`npm run dev:test`** or **`npm run dev -- -p 3001`**). Playwright’s `baseURL` is `http://localhost:3001`.
- **`net::ERR_ABORTED` / timeouts on `page.goto`:** Next dev + Turbopack can take a long time on first compile; tests use **`domcontentloaded`** (not **`networkidle`**, which never settles with HMR). Default test timeout is **90s**.

## Configuration

Copy `.env.example` to `.env.local` and fill in Clerk, Resend, Stripe, and **`LEAD_WEBHOOK_DEFAULT_AGENCY_ID`** (Clerk organization id) so leads appear in the CRM.

**Lead intake**

- **Marketing (primary):** `POST /api/v1/ingest` — Turnstile or shared secret; set `X-Tenant-Id` from `PUBLIC_TENANT_ID` on the Astro build.
- **Legacy browser JSON:** `POST /api/lead` — tenant from `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` (body `agencyId` ignored).
- **Server-side / webhook with secret:** `POST /api/webhooks/lead`

See **`docs/CRM_LEAD_ROUTING.md`** for the full matrix and `src/lib/execute-lead-intake.ts` for the shared pipeline.
