import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load base local config, then override with test sandbox config
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test', override: true });

const FIRESTORE_EMULATOR_PORT = 9350;

/** If something already listens on the Firestore emulator port, skip nested `emulators:exec` (avoids bind conflicts). */
function firestorePortAlreadyInUse(): boolean {
  if (process.platform === 'win32') return false;
  try {
    execSync(`lsof -i :${FIRESTORE_EMULATOR_PORT} -sTCP:LISTEN`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * pnpm forwards config keys that make nested `npm` / `npx` warn on npm 10+.
 */
function shWebServerCommand(inner: string): string {
  if (process.platform === 'win32') return inner;
  const unset = [
    'npm_config_recursive',
    'npm_config_verify_deps_before_run',
    'npm_config_manage_package_manager_versions',
    'npm_config__jsr_registry',
    'pnpm_config_verify_deps_before_run',
  ]
    .map((k) => `-u ${k}`)
    .join(' ');
  return `env ${unset} sh -c '${inner.replace(/'/g, "'\\''")}'`;
}

/**
 * Agency OS — Playwright E2E Test Configuration
 *
 * Full suite: Firestore via `firebase emulators:exec` + Next on :3001.
 * If a Firestore emulator is already bound to the port in `firebase.json`, only Next is started.
 *
 * Or set SKIP_WEBSERVER=1 and run emulator + `pnpm run dev -- -p 3001` yourself.
 * Force Next-only: E2E_NO_FIRESTORE_EMULATOR=1 (expects emulator reachable via .env.test).
 */
const skipNestedFirestoreEmu =
  process.env.E2E_NO_FIRESTORE_EMULATOR === '1' || firestorePortAlreadyInUse();

const webServerInner = skipNestedFirestoreEmu
  ? 'pnpm exec next dev -p 3001'
  : 'pnpm exec firebase emulators:exec --only firestore --project dba-website-prod "pnpm exec next dev -p 3001"';

const webServerCommand = shWebServerCommand(webServerInner);

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
            // Force the centralized mailer into test-fire mode so Playwright
            // runs never send real email via Resend. The outbox is inspectable
            // through GET /api/test/emails.
            EMAIL_TEST_MODE: 'true',
          },
        },
      }),
});
