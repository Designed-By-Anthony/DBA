import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Portal — Online ordering", () => {
	test("order page loads menu and can add item to cart", async ({ page }) => {
		await gotoPage(page, "/portal/order");
		await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible({
			timeout: 20_000,
		});

		// Wait for mocked menu items to load
		await expect(page.getByText("Artisan Burger")).toBeVisible({
			timeout: 20_000,
		});

		// Clicking a menu item should open the mod modal
		await page.getByText("Artisan Burger").click();
		await expect(page.getByText(/customize your order/i)).toBeVisible();

		// Add to cart and verify cart updates
		await page.getByRole("button", { name: /add to cart/i }).click();
		await expect(page.getByText(/your order/i)).toBeVisible();
		await expect(page.getByText("Artisan Burger")).toBeVisible();
	});

	test("checkout button is disabled when cart is empty", async ({ page }) => {
		await gotoPage(page, "/portal/order");
		const checkout = page.getByRole("button", { name: /checkout/i });
		await expect(checkout).toBeDisabled();
	});
});
