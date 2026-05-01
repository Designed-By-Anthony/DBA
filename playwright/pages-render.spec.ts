import { expect, test } from "@playwright/test";
import { getAllMarketingPathnames } from "./lib/marketing-paths";

/* `/404` rewrites to `/page-not-found` but stays HTTP 404; we already test the not-found page there. */
const paths = getAllMarketingPathnames().filter((p) => p !== "/404");

test.describe("Marketing pages render visible content", () => {
	for (const path of paths) {
		test(`${path} — main has text after paint`, async ({ page }) => {
			await page.goto(path, {
				waitUntil: "domcontentloaded",
				timeout: 120_000,
			});

			const main = page.locator("#main-content");
			await expect(main).toBeVisible({ timeout: 30_000 });

			/* Reveal system can hide .reveal-up until IO or ~1.4s timeout; safety net at ~3.4s. */
			await expect
				.poll(
					async () => {
						return main.evaluate((el) => {
							const s = window.getComputedStyle(el);
							const opacity = Number.parseFloat(s.opacity);
							return (
								opacity > 0.02 &&
								el.getClientRects().length > 0 &&
								(el.innerText?.trim().length ?? 0) > 24
							);
						});
					},
					{ timeout: 12_000, intervals: [200, 400, 600] },
				)
				.toBe(true);
		});
	}

	test("/free-seo-audit → /contact (308, legacy URL)", async ({
		request,
		baseURL,
	}) => {
		const target = `${baseURL ?? "http://127.0.0.1:3001"}/free-seo-audit`;
		const res = await request.get(target, { maxRedirects: 0 });
		expect(res.status()).toBe(308);
		const loc = res.headers().location ?? "";
		expect(loc).toMatch(/\/contact$/);
	});
});
