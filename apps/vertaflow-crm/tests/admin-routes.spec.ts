import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers/navigation";

/**
 * Smoke: every admin route renders without crash (Clerk dev bypass in test env).
 */
const ADMIN_ROUTES = [
	"/admin",
	"/admin/prospects",
	"/admin/pipeline",
	"/admin/inbox",
	"/admin/email",
	"/admin/email/history",
	"/admin/email/sequences",
	"/admin/automations",
	"/admin/tickets",
	"/admin/calendar",
	"/admin/clients",
	"/admin/billing",
	"/admin/reports",
	"/admin/settings",
	"/admin/settings/business",
	"/admin/pricebook",
	"/admin/kds",
] as const;

test.describe("Admin routes smoke", () => {
	for (const path of ADMIN_ROUTES) {
		test(`${path} loads without Application Error`, async ({ page }) => {
			const response = await gotoPage(page, path);
			expect(response?.status()).not.toBe(500);
			await page.waitForLoadState("load");
			await expect(page.locator("text=Application Error")).not.toBeVisible();
			const title = await page.title();
			expect(title.toLowerCase()).not.toMatch(/404/);
		});
	}
});
