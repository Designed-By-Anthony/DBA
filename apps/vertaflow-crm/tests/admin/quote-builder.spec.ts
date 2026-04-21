import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Admin — Quote builder (negative path coverage)", () => {
	test("unknown prospect id shows Prospect not found", async ({ page }) => {
		const res = await gotoPage(
			page,
			"/admin/prospects/does-not-exist-123/quote",
		);
		expect(res?.status()).not.toBe(500);
		await expect(page.locator("text=Application Error")).not.toBeVisible();

		await expect(page.getByText(/prospect not found/i)).toBeVisible({
			timeout: 30_000,
		});
	});
});
