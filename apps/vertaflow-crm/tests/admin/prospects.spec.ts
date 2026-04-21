import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Prospects Management", () => {
	test.beforeEach(async ({ page }) => {
		await gotoPage(page, "/admin/prospects");
		await page.waitForTimeout(1000);
	});

	test("page loads without error", async ({ page }) => {
		await expect(page.locator("text=Application Error")).not.toBeVisible();
		await expect(page.locator("text=500")).not.toBeVisible();
	});

	test("shows prospect list or empty state", async ({ page }) => {
		const hasTable = await page
			.locator("table")
			.isVisible()
			.catch(() => false);
		const hasHeading = await page
			.getByRole("heading", { name: /prospects/i })
			.isVisible()
			.catch(() => false);
		expect(hasTable || hasHeading).toBe(true);
	});

	test("Add Prospect button is visible", async ({ page }) => {
		// Look specifically for a button with add/new prospect text
		const addBtn = page
			.getByRole("button", { name: /add|new prospect/i })
			.or(page.getByRole("link", { name: /add|new prospect/i }));
		await expect(addBtn.first()).toBeVisible({ timeout: 10_000 });
	});

	test("clicking Add Prospect reveals the form", async ({ page }) => {
		const addBtn = page
			.getByRole("button", { name: /add|new prospect/i })
			.or(page.getByRole("link", { name: /add|new prospect/i }));
		await addBtn.first().click();

		// The form specifically for adding a prospect (not the nav "Email" link)
		// Use a heading or title that's unique to the add form
		await expect(
			page.getByText(/add new prospect|new prospect|add prospect/i).first(),
		).toBeVisible({ timeout: 5000 });
	});

	test("prospect table has expected column headers", async ({ page }) => {
		const rowCount = await page.locator("table tbody tr").count();
		if (rowCount > 0) {
			// Check column headers exist — use column header role to be specific
			await expect(
				page.getByRole("columnheader", { name: /name|company/i }).first(),
			).toBeVisible();
		}
	});
});
