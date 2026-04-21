import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Portal — Payment result pages", () => {
	test("payment success page renders CTA back to dashboard", async ({
		page,
	}) => {
		await gotoPage(page, "/portal/payment-success");
		await expect(
			page.getByRole("heading", { name: /payment successful/i }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /return to dashboard/i }),
		).toBeVisible();
	});

	test("payment cancelled page renders and links back to dashboard", async ({
		page,
	}) => {
		await gotoPage(page, "/portal/payment-cancelled");
		await expect(
			page.getByRole("heading", { name: /payment cancelled/i }),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: /back to dashboard/i }),
		).toBeVisible();
	});
});
