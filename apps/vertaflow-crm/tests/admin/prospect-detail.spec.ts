import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Admin — Prospect detail (negative path coverage)", () => {
	test("unknown prospect id shows not found state (not crash)", async ({
		page,
	}) => {
		const res = await gotoPage(page, "/admin/prospects/does-not-exist-123");
		expect(res?.status()).not.toBe(500);
		await expect(page.locator("text=Application Error")).not.toBeVisible();

		// The page is client-side and renders a clear fallback when no prospect loads.
		await expect(page.getByText(/prospect not found/i)).toBeVisible({
			timeout: 30_000,
		});
	});
});
