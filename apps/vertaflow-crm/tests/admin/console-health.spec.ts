import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

const pages = ["/admin", "/admin/prospects", "/admin/settings/domains"];

test.describe("CRM console health", () => {
	for (const path of pages) {
		test(`${path} has no page errors, 500s, chart sizing errors, or hydration errors`, async ({
			page,
		}) => {
			const failures: string[] = [];

			page.on("pageerror", (error) => {
				failures.push(`pageerror: ${error.message}`);
			});
			page.on("console", (message) => {
				if (message.type() !== "error") return;
				const text = message.text();
				if (/favicon|content blockers/i.test(text)) return;
				// Next forwards Node/pg driver SSL deprecation warnings to the browser console as "error".
				if (/pg-connection-string|SECURITY WARNING: The SSL modes/i.test(text))
					return;
				failures.push(`console: ${text}`);
			});
			page.on("response", (response) => {
				const url = response.url();
				if (!url.startsWith("http://localhost:3001")) return;
				if (response.status() >= 500) {
					failures.push(`response ${response.status()}: ${url}`);
				}
			});

			await gotoPage(page, path);
			await page.waitForTimeout(1500);

			expect(failures).toEqual([]);
			await expect(page.locator("body")).not.toContainText("Application Error");
			await expect(page.locator("body")).not.toContainText(
				"Minified React error",
			);
			await expect(page.locator("body")).not.toContainText(
				"width(-1) and height(-1)",
			);
		});
	}
});
