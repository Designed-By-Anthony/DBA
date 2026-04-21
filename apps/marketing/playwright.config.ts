import { defineConfig, devices } from "@playwright/test";

/**
 * Test Explorer groups (VS Code / Cursor Playwright extension): each entry is a project.
 * Paths are relative to `testDir` (`./e2e`).
 */
const specs = {
	smoke: ["smoke.spec.ts", "lead-source.spec.ts"],
	regression: [
		"homepage.spec.ts",
		"navigation.spec.ts",
		"service-pages.spec.ts",
		"audit-tool.spec.ts",
		"contact-form.spec.ts",
		"cookie-banner.spec.ts",
		"mobile.spec.ts",
		"deep-routes.spec.ts",
		"feeds-http.spec.ts",
	],
	accessibility: [
		"link-accessible-name.spec.ts",
		"label-in-name.spec.ts",
		"title-accessibility.spec.ts",
		"svg-accessible-name.spec.ts",
		"table-caption.spec.ts",
		"table-headers.spec.ts",
		"non-text-contrast.spec.ts",
	],
	seo: ["seo.spec.ts"],
	hosting: ["security-headers.spec.ts", "console-hosting.spec.ts"],
	live: ["smoke-live.spec.ts", "seo-live.spec.ts"],
	api: ["api-connectivity.spec.ts"],
};

const defaultBaseURL = "http://127.0.0.1:4321";
/**
 * Static parity server (applies `static-headers.json` headers: CSP, HSTS, etc.).
 * Port 5500 avoids macOS AirPlay Receiver / other apps that bind :5000.
 */
const PARITY_PORT = "5500";
const parityServerURL = `http://127.0.0.1:${PARITY_PORT}`;

const useParityStaticServer =
	process.env.PLAYWRIGHT_USE_STATIC_PARITY_SERVER === "1";
const explicitBaseURL = process.env.BASE_URL;
const baseURL =
	explicitBaseURL ?? (useParityStaticServer ? parityServerURL : defaultBaseURL);

const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER;

const startParityStaticServer =
	!skipWebServer &&
	useParityStaticServer &&
	(!explicitBaseURL || explicitBaseURL === parityServerURL);

const startAstroPreview =
	!skipWebServer &&
	!useParityStaticServer &&
	(!explicitBaseURL || explicitBaseURL === defaultBaseURL);

/**
 * pnpm sets npm_config_* / pnpm_config_*; nested `npm` in the webServer then warns (npm 10+).
 * `env -u` clears them for the shell that runs build + preview (Unix only).
 */
function shWebServerCommand(inner: string): string {
	if (process.platform === "win32") return inner;
	const unset = [
		"npm_config_recursive",
		"npm_config_verify_deps_before_run",
		"npm_config_manage_package_manager_versions",
		"npm_config__jsr_registry",
		"pnpm_config_verify_deps_before_run",
	]
		.map((k) => `-u ${k}`)
		.join(" ");
	return `env ${unset} sh -c '${inner.replace(/'/g, "'\\''")}'`;
}

/**
 * Default: build + `astro preview`, then test at 127.0.0.1:4321.
 *
 * Production-parity headers (CSP, Trusted Types, HSTS):
 *   PLAYWRIGHT_USE_STATIC_PARITY_SERVER=1 npm run test:e2e
 *   → build + `node scripts/static-parity-server.mjs` at 127.0.0.1:5500 (see static-headers.json)
 *
 * Live site: BASE_URL=https://designedbyanthony.com PLAYWRIGHT_SKIP_WEBSERVER=1
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.PLAYWRIGHT_WORKERS
		? Number(process.env.PLAYWRIGHT_WORKERS)
		: 1,
	reporter: "html",
	timeout: 30_000,

	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	...(startParityStaticServer
		? {
				webServer: {
					command: shWebServerCommand(
						"npm run build && node scripts/static-parity-server.mjs",
					),
					url: parityServerURL,
					timeout: 300_000,
					reuseExistingServer: false,
				},
			}
		: startAstroPreview
			? {
					webServer: {
						command: shWebServerCommand(
							"npm run build && npm run preview -- --host 127.0.0.1 --port 4321",
						),
						url: defaultBaseURL,
						timeout: 500_000,
						reuseExistingServer: false,
					},
				}
			: {}),

	projects: [
		{
			name: "2-regression",
			testMatch: [...specs.regression],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "3-accessibility",
			testMatch: [...specs.accessibility],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "4-seo",
			testMatch: [...specs.seo],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "5-hosting",
			testMatch: [...specs.hosting],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "6-live",
			testMatch: [...specs.live],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "7-api",
			testMatch: [...specs.api],
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "8-mobile",
			testMatch: "**/*.spec.ts",
			use: { ...devices["Pixel 7"] },
		},
		{
			name: "smoke",
			testMatch: [...specs.smoke],
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
