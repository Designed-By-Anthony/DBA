import { expect, test } from "@playwright/test";

/**
 * Host-based routing in `src/proxy.ts` (admin.*, accounts.* → /admin, /portal).
 * Uses `*.localhost` which resolves to 127.0.0.1 on macOS/Linux CI.
 */
const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

test.describe("Subdomain host routing", () => {
	test("admin.localhost root serves Agency OS admin surface", async ({
		page,
	}) => {
		const res = await page.goto(
			`${base.replace("localhost", "admin.localhost")}/`,
			{
				waitUntil: "domcontentloaded",
				timeout: 180_000,
			},
		);
		expect(res?.status()).not.toBe(500);
		await expect(page.locator("text=Agency OS").first()).toBeVisible({
			timeout: 30_000,
		});
	});

	test("accounts.localhost root serves client portal login", async ({
		page,
	}) => {
		const res = await page.goto(
			`${base.replace("localhost", "accounts.localhost")}/`,
			{
				waitUntil: "domcontentloaded",
				timeout: 180_000,
			},
		);
		expect(res?.status()).not.toBe(500);
		await expect(
			page.getByRole("heading", { name: /Client Portal/i }),
		).toBeVisible({
			timeout: 30_000,
		});
	});

	test("accounts.localhost API is not prefixed with /portal", async ({
		request,
	}) => {
		const origin = base.replace("localhost", "accounts.localhost");
		const res = await request.get(`${origin}/api/portal/branding`);
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.brandName).toBeDefined();
	});
});
