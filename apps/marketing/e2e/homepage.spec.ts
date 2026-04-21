import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
	test("loads and renders hero section", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveTitle(/Designed by Anthony/);
		await expect(page.locator(".page-hero h1")).toBeVisible();
		await expect(page.locator("#hero-founder-btn")).toBeVisible();
	});

	test("hero CTA links are correct", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const founderBtn = page.locator("#hero-founder-btn");
		await expect(founderBtn).toHaveAttribute("href", /calendly\.com/);

		const auditBtn = page.locator("#hero-run-audit-btn");
		await expect(auditBtn).toHaveAttribute("href", "/free-seo-audit");
	});

	test("founding partner section is visible with clear CTAs", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const foundingSection = page.locator(".founding-partner-shell");
		await expect(foundingSection).toBeVisible();
		await expect(
			foundingSection.locator('a[href*="calendly.com"]').first(),
		).toBeVisible();
		await expect(
			foundingSection.locator('a[href="/free-seo-audit"]').first(),
		).toBeVisible();
	});

	test("featured work section is visible", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await expect(page.locator(".featured-work-grid")).toBeVisible();
		await expect(page.locator(".featured-work-card")).toHaveCount(3);
	});

	test("has structured data", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		const schemas = page.locator('script[type="application/ld+json"]');
		expect(await schemas.count()).toBeGreaterThan(0);
	});
});
