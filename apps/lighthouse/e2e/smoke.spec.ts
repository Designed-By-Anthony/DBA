import { expect, test } from "@playwright/test";

test.describe("Lighthouse audit app", () => {
	test("home page loads and shows audit form", async ({ page }) => {
		const res = await page.goto("/");
		expect(res?.ok(), "home should return 2xx").toBeTruthy();
		await expect(page).toHaveTitle(/Website Audit/i);
		await expect(page.getByLabel("Website URL")).toBeVisible();
		await expect(
			page.getByRole("button", { name: /Run Free Audit/i }),
		).toBeVisible();
	});
});
