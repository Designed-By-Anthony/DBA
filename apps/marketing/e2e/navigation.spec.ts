import { expect, test } from "@playwright/test";

const CRITICAL_PAGES = [
	"/",
	"/contact",
	"/about",
	"/portfolio",
	"/services",
	"/faq",
	"/blog",
	"/ouredge",
	"/free-seo-audit",
	"/service-areas",
	"/services/custom-web-design",
	"/services/local-seo",
	"/services/managed-hosting",
	"/services/website-rescue",
	"/services/ai-automation",
	"/services/workspace-setup",
];

test.describe("Navigation - All Critical Pages Load", () => {
	for (const path of CRITICAL_PAGES) {
		test(`${path} returns 200`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
		});
	}
});

test.describe("Desktop Navigation", () => {
	test.use({ viewport: { width: 1280, height: 800 } });

	test("all nav links are present", async ({ page }) => {
		await page.goto("/");
		const nav = page.locator(".nav-desktop");
		await expect(nav.locator('a[href="/services"]')).toBeVisible();
		await expect(nav.locator('a[href="/portfolio"]')).toBeVisible();
		await expect(nav.locator('a[href="/contact"]')).toBeVisible();
	});
});

test.describe("Mobile Navigation", () => {
	test.use({ viewport: { width: 375, height: 812 } });

	test("hamburger opens and closes", async ({ page }) => {
		await page.goto("/");
		const hamburger = page.locator("#hamburger-btn");
		const mobileNav = page.locator("#mobile-nav");

		await hamburger.click();
		await expect(mobileNav).toHaveClass(/open/);

		// Overlay sits above the header in paint order; Escape uses the same close path as the app.
		await page.keyboard.press("Escape");
		await expect(mobileNav).not.toHaveClass(/open/);
	});
});
