import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

test.describe("Portal — Kiosk", () => {
	test("kiosk scan step renders and proceeds to participant selection", async ({
		page,
	}) => {
		await gotoPage(page, "/portal/kiosk");
		await expect(
			page.locator("main").getByText(/Tap Band or Enter Phone/i),
		).toBeVisible({
			timeout: 15_000,
		});

		await page
			.getByRole("button", { name: /simulate scan \/ check in/i })
			.click();
		await expect(
			page.getByRole("heading", { name: /who is participating today/i }),
		).toBeVisible({ timeout: 10_000 });

		// Selecting the account manager should succeed without waiver step
		await page.getByText("Anthony Jones").click();
		await expect(page.getByText(/checked in/i)).toBeVisible({
			timeout: 10_000,
		});
	});

	test("selecting a dependent without waiver shows waiver step", async ({
		page,
	}) => {
		await gotoPage(page, "/portal/kiosk");
		await page
			.getByRole("button", { name: /simulate scan \/ check in/i })
			.click();

		await page.getByText("Sophia Jones").click();
		await expect(
			page.getByText(/mandatory legal action required/i),
		).toBeVisible({ timeout: 10_000 });
	});
});
