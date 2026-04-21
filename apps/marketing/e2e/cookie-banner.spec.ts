import { expect, test } from "@playwright/test";

const CONSENT_KEY = "dba_cookie_consent";
const GA_SCRIPT_PATH =
	"https://www.googletagmanager.com/gtag/js?id=G-4RSTBMRHDW";
const TURNSTILE_SCRIPT_PATH =
	"https://challenges.cloudflare.com/turnstile/v0/api.js";

test.describe("Cookie consent banner", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await page.evaluate((key) => localStorage.removeItem(key), CONSENT_KEY);
		await page.reload({ waitUntil: "domcontentloaded" });
	});

	test("appears on first visit", async ({ page }) => {
		const banner = page.locator("#cookie-consent-root");
		await expect(banner).toBeVisible();
	});

	test("dismisses on accept and stays dismissed on reload", async ({
		page,
	}) => {
		const banner = page.locator("#cookie-consent-root");
		await expect(banner).toBeVisible();

		await page.locator("#cookie-consent-accept").click();
		await page.waitForTimeout(400);
		await expect(banner).toBeHidden();

		await page.reload({ waitUntil: "domcontentloaded" });
		await page.waitForTimeout(300);
		await expect(banner).toBeHidden();
	});

	test("loads only GA4 on accept and avoids third-party analytics cookies", async ({
		page,
		context,
	}) => {
		const externalRequests: string[] = [];

		page.on("request", (request) => {
			externalRequests.push(request.url());
		});

		await page.locator("#cookie-consent-accept").click();
		await expect
			.poll(() =>
				externalRequests.some((url) => url.startsWith(GA_SCRIPT_PATH)),
			)
			.toBeTruthy();
		await page.waitForTimeout(1500);

		const cookies = await context.cookies();
		const cookieDomains = cookies.map((cookie) => cookie.domain);

		expect(
			externalRequests.some((url) => url.startsWith(GA_SCRIPT_PATH)),
		).toBeTruthy();
		expect(
			externalRequests.some((url) =>
				/clarity\.ms|crazyegg|bing\.com/i.test(url),
			),
		).toBeFalsy();
		expect(
			cookieDomains.some((domain) =>
				/clarity\.ms|bing\.com|crazyegg/i.test(domain),
			),
		).toBeFalsy();
	});

	test("defers Turnstile until a protected form is engaged", async ({
		page,
	}) => {
		const initialResources = await page.evaluate(() =>
			performance
				.getEntriesByType("resource")
				.map((entry) => entry.name)
				.filter((name) => name.includes("challenges.cloudflare.com/turnstile")),
		);

		expect(initialResources).toEqual([]);

		await page.goto("/contact", { waitUntil: "domcontentloaded" });
		await page.evaluate((key) => localStorage.removeItem(key), CONSENT_KEY);
		await page.reload({ waitUntil: "domcontentloaded" });
		await page.locator("#cookie-consent-reject").click();
		await page
			.locator('[data-audit-form] input[name="first_name"]')
			.first()
			.focus();

		await expect
			.poll(async () =>
				page.evaluate(
					(turnstileScriptPath) =>
						performance
							.getEntriesByType("resource")
							.map((entry) => entry.name)
							.some((name) => name.startsWith(turnstileScriptPath)),
					TURNSTILE_SCRIPT_PATH,
				),
			)
			.toBeTruthy();
	});
});
