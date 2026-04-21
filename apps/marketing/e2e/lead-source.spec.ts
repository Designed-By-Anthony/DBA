import { expect, test } from "@playwright/test";
import { dismissCookieConsentIfPresent } from "./helpers";

test.describe("Lead source hidden fields", () => {
	test("contact page posts contact_page + Contact page label", async ({
		page,
	}) => {
		await page.goto("/contact", { waitUntil: "domcontentloaded" });
		await dismissCookieConsentIfPresent(page);
		const form = page.locator("[data-audit-form]").first();
		await expect(form.locator('input[name="offer_type"]')).toHaveValue(
			"contact_page",
		);
		await expect(form.locator('input[name="lead_source"]')).toHaveValue(
			"Contact page",
		);
	});

	test("homepage quick form posts home_page_contact + Home page contact", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await dismissCookieConsentIfPresent(page);
		const form = page.locator(".home-quick-lead [data-audit-form]");
		await expect(form.locator('input[name="offer_type"]')).toHaveValue(
			"home_page_contact",
		);
		await expect(form.locator('input[name="lead_source"]')).toHaveValue(
			"Home page contact",
		);
	});
});
