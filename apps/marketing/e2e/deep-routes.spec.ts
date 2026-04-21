import { expect, test } from "@playwright/test";
import { dismissCookieConsentIfPresent } from "./helpers";

/** Stable slugs — update if renamed. */
const DEEP_ROUTES = [
	"/blog/mobile-first-seo",
	"/portfolio/the-long-beach-handyman",
	"/privacy",
	"/terms",
	"/cookie",
	"/image-license",
	"/service-areas/utica",
	"/services/google-business-profile",
	"/thank-you",
];

test.describe("Deep routes", () => {
	for (const path of DEEP_ROUTES) {
		test(`${path} returns 200`, async ({ page }) => {
			const response = await page.goto(path, { waitUntil: "domcontentloaded" });
			expect(response?.status(), `${path} should return 200`).toBe(200);
		});
	}
});

test.describe("Report viewer shell", () => {
	test("malformed report id shows error state", async ({ page }) => {
		// Use report.html + query so static preview resolves; clean /report/ID URLs rely on edge rewrites.
		await page.goto("/report.html?id=DBA-BAD", {
			waitUntil: "domcontentloaded",
		});
		await expect(page.locator("#report-error")).toBeVisible({
			timeout: 10_000,
		});
		await expect(page.locator("#report-loading")).toBeHidden();
	});
});

test.describe("FAQ accordion", () => {
	test("first question expands on click", async ({ page }) => {
		await page.goto("/faq", { waitUntil: "domcontentloaded" });
		await dismissCookieConsentIfPresent(page);

		const firstTrigger = page.locator("#faq-accordion .faq-trigger").first();
		await expect(firstTrigger).toBeVisible();
		await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");

		await firstTrigger.click();
		await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
		await expect(
			page.locator("#faq-accordion .faq-panel.is-open").first(),
		).toBeVisible();
	});
});
