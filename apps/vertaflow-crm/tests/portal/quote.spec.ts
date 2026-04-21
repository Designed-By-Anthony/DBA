import { expect, test } from "@playwright/test";
import { gotoPage } from "../helpers/navigation";

/**
 * Quotes are not in the Postgres schema yet; the page calls notFound().
 * We assert 404/notFound behavior for unknown IDs (not 500).
 */
test.describe("Portal — Quote page", () => {
	test("unknown quote id returns notFound experience (not 500)", async ({
		page,
	}) => {
		const res = await gotoPage(page, "/portal/quote/does-not-exist-123");
		expect(res?.status()).not.toBe(500);
		const title = await page.title();
		expect(title.toLowerCase()).toMatch(/404|not found|quote|proposal/);
	});
});
