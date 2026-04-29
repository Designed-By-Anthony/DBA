import { defineConfig, devices } from "@playwright/test";

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const testPort = process.env.PLAYWRIGHT_TEST_PORT ?? "3001";
const zapProxy =
	process.env.PLAYWRIGHT_ZAP === "1"
		? { server: process.env.ZAP_PROXY_URL ?? "http://127.0.0.1:8080" }
		: undefined;

export default defineConfig({
	testDir: "playwright",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report" }],
	],
	use: {
		baseURL:
			process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://127.0.0.1:${testPort}`,
		trace: "on-first-retry",
		ignoreHTTPSErrors: true,
		...(zapProxy ? { proxy: zapProxy } : {}),
	},
	...(skipWebServer
		? {}
		: {
				webServer: {
					command: `bun --cwd apps/web run build && bun --cwd apps/web run start -p ${testPort}`,
					url: `http://127.0.0.1:${testPort}`,
					/* Avoid a stale `next start` on :3000 from an older build (redirects/tests drift). */
					reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
					timeout: 600_000,
					stdout: "pipe",
					stderr: "pipe",
				},
			}),
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
