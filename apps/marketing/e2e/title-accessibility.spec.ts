import { expect, test } from "@playwright/test";

test("contact page title clearly describes the page purpose", async ({
	page,
}) => {
	await page.goto("/contact", { waitUntil: "domcontentloaded" });
	await expect(page).toHaveTitle(
		/Contact — Web Design & SEO \| Designed by Anthony/,
	);
});

test("report page fallback title clearly describes a missing audit report", async ({
	page,
}) => {
	await page.goto("/report?id=DBA-INVALID0", { waitUntil: "domcontentloaded" });
	await expect(page).toHaveTitle(
		/Audit Report Not Found \| Designed by Anthony/,
	);
});
