import { defineConfig, devices } from "@playwright/test";

/**
 * Root Playwright config for Cursor/VS Code Test Explorer discovery.
 *
 * Each app in this monorepo maintains its own Playwright config, but the
 * Playwright extension typically only auto-discovers a single config.
 * This file provides a unified view of *all* E2E specs across:
 * - apps/marketing
 * - apps/web-viewer (Agency OS)
 * - apps/lighthouse
 *
 * Running the full suite is still best done via the repo scripts:
 *   pnpm test:e2e
 */
export default defineConfig({
  // We delegate webServer orchestration to per-app scripts (pnpm test:e2e).
  // This config exists primarily for discovery + ad-hoc runs.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  timeout: 180_000,
  workers: 1,
  projects: [
    {
      name: "marketing",
      testDir: "apps/marketing/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.MARKETING_BASE_URL ?? process.env.BASE_URL ?? "http://127.0.0.1:4321",
      },
    },
    {
      name: "agency-os",
      testDir: "apps/web-viewer/tests",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.AGENCY_OS_BASE_URL ?? "http://127.0.0.1:3001",
      },
    },
    {
      name: "lighthouse",
      testDir: "apps/lighthouse/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.LIGHTHOUSE_BASE_URL ?? "http://127.0.0.1:3002",
      },
    },
  ],
});

