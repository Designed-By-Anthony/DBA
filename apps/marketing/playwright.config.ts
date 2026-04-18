import { defineConfig, devices } from '@playwright/test';

/**
 * Test Explorer groups (VS Code / Cursor Playwright extension): each entry is a project.
 * Paths are relative to `testDir` (`./e2e`).
 */
const specs = {
  smoke: ['smoke.spec.ts', 'lead-source.spec.ts'],
  regression: [
    'homepage.spec.ts',
    'navigation.spec.ts',
    'service-pages.spec.ts',
    'audit-tool.spec.ts',
    'contact-form.spec.ts',
    'cookie-banner.spec.ts',
    'mobile.spec.ts',
    'deep-routes.spec.ts',
    'feeds-http.spec.ts',
  ],
  accessibility: [
    'link-accessible-name.spec.ts',
    'label-in-name.spec.ts',
    'title-accessibility.spec.ts',
    'svg-accessible-name.spec.ts',
    'table-caption.spec.ts',
    'table-headers.spec.ts',
    'non-text-contrast.spec.ts',
  ],
  seo: ['seo.spec.ts'],
  hosting: ['security-headers.spec.ts', 'console-hosting.spec.ts'],
  live: ['smoke-live.spec.ts', 'seo-live.spec.ts'],
  api: ['api-connectivity.spec.ts'],
};

const defaultBaseURL = 'http://127.0.0.1:4321';
/**
 * Firebase Hosting emulator (applies `firebase.json` headers: CSP, HSTS, etc.).
 * Port must match `firebase.json` → `emulators.hosting.port`. Default 5500 avoids macOS
 * AirPlay Receiver / other apps that bind :5000.
 */
/** Keep in sync with `firebase.json` → `emulators.hosting.port`. */
const HOSTING_EMULATOR_PORT = '5500';
const firebaseHostingEmulatorURL = `http://127.0.0.1:${HOSTING_EMULATOR_PORT}`;

const useFirebaseHostingEmulator = process.env.PLAYWRIGHT_USE_FIREBASE_EMULATOR === '1';
const explicitBaseURL = process.env.BASE_URL;
const baseURL =
  explicitBaseURL ?? (useFirebaseHostingEmulator ? firebaseHostingEmulatorURL : defaultBaseURL);

const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

const startFirebaseHostingEmulator =
  !skipWebServer &&
  useFirebaseHostingEmulator &&
  (!explicitBaseURL || explicitBaseURL === firebaseHostingEmulatorURL);

const startAstroPreview =
  !skipWebServer &&
  !useFirebaseHostingEmulator &&
  (!explicitBaseURL || explicitBaseURL === defaultBaseURL);

/**
 * pnpm sets npm_config_* / pnpm_config_*; nested `npm` in the webServer then warns (npm 10+).
 * `env -u` clears them for the shell that runs build + preview (Unix only).
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
 * Default: build + `astro preview`, then test at 127.0.0.1:4321.
 *
 * Production-parity headers (CSP, Trusted Types, HSTS):
 *   PLAYWRIGHT_USE_FIREBASE_EMULATOR=1 npm run test:e2e
 *   → build + `firebase emulators:start --only hosting` at 127.0.0.1:5500 (see `firebase.json` emulators)
 *
 * Live site: BASE_URL=https://designedbyanthony.com PLAYWRIGHT_SKIP_WEBSERVER=1
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : 1,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  ...(startFirebaseHostingEmulator
    ? {
        webServer: {
          command: shWebServerCommand(
            'npm run build && npx firebase emulators:start --only hosting --project dba-website-prod',
          ),
          url: firebaseHostingEmulatorURL,
          timeout: 300_000,
          reuseExistingServer: false,
        },
      }
    : startAstroPreview
      ? {
          webServer: {
            command: shWebServerCommand(
              'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
            ),
            url: defaultBaseURL,
            timeout: 240_000,
            reuseExistingServer: false,
          },
        }
      : {}),

  projects: [
    {
      name: '2-regression',
      testMatch: [...specs.regression],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '3-accessibility',
      testMatch: [...specs.accessibility],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '4-seo',
      testMatch: [...specs.seo],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '5-hosting',
      testMatch: [...specs.hosting],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '6-live',
      testMatch: [...specs.live],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '7-api',
      testMatch: [...specs.api],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: '8-mobile',
      testMatch: '**/*.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'smoke',
      testMatch: [...specs.smoke],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
