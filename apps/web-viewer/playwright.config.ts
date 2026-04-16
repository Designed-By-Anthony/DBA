import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load base local config, then override with test sandbox config
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test', override: true });

/**
 * Agency OS — Playwright E2E Test Configuration
 *
 * Canonical full-suite (CI/local green): `npm test` — Firestore via `firebase emulators:exec` + Next on :3001.
 * If Firestore port (see firebase.json) is already in use, `npm test` fails to start — stop the other emulator or use `npm run test:pw` with Firestore already running on that port.
 * Alternative: `npm run test:pw` (Next only) with Firestore emulator already running (port in firebase.json / .env.test).
 *
 * Or set SKIP_WEBSERVER=1 and run emulator + `npm run dev -- -p 3001` yourself (set ALLOW_ADMIN_AUTH_BYPASS=1 in that shell if you need /admin without Clerk).
 * If the emulator cannot bind its port, use E2E_NO_FIRESTORE_EMULATOR=1 and run `firebase emulators:start --only firestore` separately (same port as firebase.json / .env.test).
 *
 * `reuseExistingServer` (local only): if Playwright attaches to the wrong process on :3001, stop stray emulators or other dev servers so the URL probe targets this app.
 */
const webServerCommand =
  process.env.E2E_NO_FIRESTORE_EMULATOR === '1'
    ? 'npm run dev -- -p 3001'
    : 'npx firebase emulators:exec --only firestore --project dba-website-prod "npm run dev -- -p 3001"';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: false, // Run sequentially to avoid Firestore rate limits
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  /** Must be ≥ gotoPage() default (180s) so navigations are not cut off mid-flight */
  timeout: 180_000,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Keep all artifacts in a predictable location (linked by the HTML report).
  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:3001',
    /**
     * Audit mode: set PW_AUDIT=1 to collect full traces for coverage/observability work.
     * Default stays lightweight while still keeping artifacts for failures.
     */
    trace: process.env.PW_AUDIT === '1' ? 'on' : 'retain-on-failure',
    video: process.env.PW_AUDIT === '1' ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Set SKIP_WEBSERVER=1 if you already run Firestore emulator (see firebase.json / .env.test) + `npm run dev -p 3001` manually
  ...(process.env.SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: {
          command: webServerCommand,
          url: 'http://localhost:3001',
          reuseExistingServer: !process.env.CI,
          timeout: 180 * 1000,
          stdout: 'pipe',
          stderr: 'pipe',
          // Merge so FIRESTORE_EMULATOR_HOST from .env.test (loaded above) reaches Next; NODE_ENV loads .env.test in Next 16
          env: {
            ...process.env,
            NODE_ENV: 'test',
            // Must match admin-dev-auth.ts — test NODE_ENV alone no longer bypasses Clerk.
            ALLOW_ADMIN_AUTH_BYPASS: '1',
            // .env.test has no Cloud SQL / Clerk secrets; allow dev server to boot for Firestore-only E2E.
            SKIP_ENV_VALIDATION: '1',
          },
        },
      }),
});
