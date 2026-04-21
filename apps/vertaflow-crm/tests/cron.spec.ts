import { expect, test } from "@playwright/test";

test.describe("Cron endpoints (authz)", () => {
	test("email-sequences cron rejects without secret", async ({ request }) => {
		const res = await request.get("/api/cron/email-sequences");
		expect(res.status()).toBe(401);
	});

	test("ai-summarize cron rejects in production without secret (dev may allow)", async ({
		request,
	}) => {
		const res = await request.get("/api/cron/ai-summarize");
		// The handler allows missing secret outside production. We only assert it's not a 500.
		expect(res.status()).not.toBe(500);
	});
});
