# Agency OS (Web Viewer)

Next.js app for **Designed by Anthony**: admin CRM, client portal, lead intake, billing, and automations.

## Commands

```bash
npm run dev          # local dev
npm run build        # production build
npm run lint         # ESLint
npm run verify:webhook   # smoke-test POST /api/webhooks/lead (needs LEAD_WEBHOOK_SECRET)
npm test             # Playwright (starts Firestore emulator + dev server on :3001 — Firestore emulator uses :9350, see firebase.json)
npm run test:no-emu-server   # Playwright starts **Next only** on :3001 — use when `firebase emulators:exec` fails; run `firebase emulators:start --only firestore` in another terminal first (same port as firebase.json / .env.test)
npm run test:pw -- tests/foo.spec.ts   # same as test:no-emu-server; **plain `npx playwright test` uses the Firebase wrapper** and fails with `webServer exit code 1` if the emulator cannot start
npm run dev:test     # Next on :3001 with NODE_ENV=test (loads .env.test) — pair with Firestore emulator when using SKIP_WEBSERVER
SKIP_WEBSERVER=1 npm test   # use when emulator + dev are already up (see dev:test)
npm run test:report  # open last HTML report (traces/videos on failure — see playwright.config.ts)
```

### Playwright debugging

- Failures save **trace + video** under `playwright-report/` (`trace: 'retain-on-failure'`).
- Open the report: `npx playwright show-report playwright-report`.
- **`net::ERR_CONNECTION_REFUSED` at `localhost:3001`:** nothing is serving the app. Run tests from the project root with `npm test` so Playwright can start Firestore + Next. If you use `SKIP_WEBSERVER=1`, run the Firestore emulator and a dev server on **:3001** (e.g. **`npm run dev:test`** or **`npm run dev -- -p 3001`**). Playwright’s `baseURL` is `http://localhost:3001`.
- If Playwright reports **`webServer` exit code 1** or **`Could not start Firestore Emulator, port taken`**, something is already using the emulator port. This repo uses **port 9350** in `firebase.json` with matching **`FIRESTORE_EMULATOR_HOST` in `.env.test`**. On macOS: `lsof -i :9350` to find the process, or change **both** files to another free port. Alternatively run **`npm run test:no-emu-server`** with **`firebase emulators:start --only firestore`** in a second terminal.
- **`net::ERR_ABORTED` / timeouts on `page.goto`:** Next dev + Turbopack can take a long time on first compile; tests use **`domcontentloaded`** (not **`networkidle`**, which never settles with HMR). Default test timeout is **90s**.

## Configuration

Copy `.env.example` to `.env.local` and fill in Clerk, Firebase, Resend, Stripe, and **`LEAD_WEBHOOK_DEFAULT_AGENCY_ID`** (Clerk organization id) so leads appear in the CRM.

**Lead intake**

- **Marketing (primary):** `POST /api/v1/ingest` — Turnstile or shared secret; set `X-Tenant-Id` from `PUBLIC_TENANT_ID` on the Astro build.
- **Legacy browser JSON:** `POST /api/lead` — tenant from `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` (body `agencyId` ignored).
- **Server-side / webhook with secret:** `POST /api/webhooks/lead`

See **`docs/CRM_LEAD_ROUTING.md`** for the full matrix and `src/lib/execute-lead-intake.ts` for the shared pipeline.
