import { expect, test } from "@playwright/test";

test("free audit page does not render an empty report target link before results load", async ({
	page,
}) => {
	await page.goto("/free-seo-audit", { waitUntil: "domcontentloaded" });
	await expect(page.locator('a[data-report-url][href="#"]')).toHaveCount(0);
});
