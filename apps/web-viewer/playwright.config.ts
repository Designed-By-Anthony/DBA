import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.test', override: true });

/**
 * Agency OS — Playwright E2E. Starts Next on :3001 against Postgres (DATABASE_URL from .env.test).
 */
const webServerInner = 'pnpm exec next dev -p 3001';
const webServerCommand =
  process.platform === 'win32'
    ? webServerInner
    : `env -u npm_config_recursive -u npm_config_verify_deps_before_run -u npm_config_manage_package_manager_versions -u npm_config__jsr_registry -u pnpm_config_verify_deps_before_run sh -c '${webServerInner.replace(/'/g, "'\\''")}'`;

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 180_000,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:3001',
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
          env: {
            ...process.env,
            NODE_ENV: 'test',
            EMAIL_TEST_MODE: 'true',
          },
        },
      }),
});
