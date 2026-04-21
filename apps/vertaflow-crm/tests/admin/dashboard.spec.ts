import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Admin Dashboard", () => {
	test.beforeEach(async ({ page }) => {
		await gotoPage(page, "/admin");
	});

	test("renders the dashboard shell & sidebar (not login screen)", async ({
		page,
	}) => {
		await expect(
			page.getByRole("heading", { name: /web viewer admin/i }),
		).not.toBeVisible();
		await expect(
			page.locator('nav, aside, [class*="sidebar"], [class*="shell"]').first(),
		).toBeVisible();
	});

	test("shows first-row KPI cards (matches admin dashboard layout)", async ({
		page,
	}) => {
		// KPIs are <Link class="glass-card kpi-card"> — match by role + label substring (includes numeric value)
		await expect(
			page.getByRole("link", { name: /Total Prospects/ }),
		).toBeVisible({ timeout: 20_000 });
		await expect(page.getByRole("link", { name: /Emails Sent/ })).toBeVisible({
			timeout: 20_000,
		});
		await expect(page.getByRole("link", { name: /Scheduled/ })).toBeVisible({
			timeout: 20_000,
		});
		await expect(
			page.getByRole("link", { name: /Weighted forecast/ }),
		).toBeVisible({ timeout: 20_000 });
	});

	test("KPI Pipeline Value card is present", async ({ page }) => {
		await expect(
			page.getByRole("link", { name: /Pipeline Value/ }).first(),
		).toBeVisible({
			timeout: 20_000,
		});
	});

	test("shows Recent Prospects section", async ({ page }) => {
		await expect(page.getByText(/recent prospects/i)).toBeVisible({
			timeout: 15_000,
		});
	});

	test("shows Recent Emails section", async ({ page }) => {
		await expect(page.getByText(/recent emails/i)).toBeVisible({
			timeout: 15_000,
		});
	});

	test("has a link to prospects page", async ({ page }) => {
		const link = page.getByRole("link", { name: /Total Prospects/i }).first();
		await expect(link).toBeVisible({ timeout: 15_000 });
		await expect(link).toHaveAttribute("href", "/admin/prospects");
		// Follow the same destination the KPI card advertises (covers App Router + data shell without flaking on Link click quirks).
		await page.goto("/admin/prospects");
		await expect(page).toHaveURL(/\/admin\/prospects\/?$/);
	});
});
