import { defineConfig, devices } from "@playwright/test";

/**
 * Portable embed pack + Calendly HTML + tech-trace — **no web server**.
 * Uses `page.setContent` against repo HTML under `apps/customer-site-embeds/`.
 *
 * Run: `pnpm run test:e2e:embed-static` (from `apps/marketing`).
 */
export default defineConfig({
	testDir: "./e2e",
	testMatch: ["customer-site-embeds-static.spec.ts"],
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	workers: 1,
	reporter: "list",
	timeout: 30_000,
	use: {
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "embed-static",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
