import { expect, test } from "@playwright/test";
import { getAllMarketingPathnames } from "../src/lib/marketing-routes";
import { runZapSpiderAndReport } from "./helpers/zap-crawl";

const ZAP_SEED_ROUTES = getAllMarketingPathnames();

test.describe("OWASP ZAP crawl harness", () => {
	test("visit primary GET routes for proxy traffic", async ({ page }) => {
		for (const path of ZAP_SEED_ROUTES) {
			const res = await page.goto(path, {
				waitUntil: "load",
				timeout: 120_000,
			});
			expect(res?.status(), `${path} should not hard-fail`).toBeLessThan(500);
			await expect(page.locator("body")).toBeAttached();
		}
	});

	test.afterAll(async () => {
		if (process.env.PLAYWRIGHT_ZAP !== "1") return;
		const testPort = process.env.PLAYWRIGHT_TEST_PORT ?? "3001";
		const base =
			process.env.PLAYWRIGHT_TEST_BASE_URL ??
			process.env.BASE_URL ??
			`http://127.0.0.1:${testPort}`;
		const seed = base.replace(/\/$/, "");
		await runZapSpiderAndReport(`${seed}/`);
	});
});
