import { expect, test } from "@playwright/test";

test.describe("Webhook endpoints (basic contract)", () => {
	test("calendly rejects invalid payload", async ({ request }) => {
		const res = await request.post("/api/webhooks/calendly", { data: {} });
		expect(res.status()).toBe(400);
	});

	test("idx rejects missing fields", async ({ request }) => {
		const res = await request.post("/api/webhooks/idx", { data: {} });
		expect(res.status()).toBe(400);
	});

	test("agentic rejects missing context", async ({ request }) => {
		const res = await request.post("/api/webhooks/agentic", { data: {} });
		expect(res.status()).toBe(400);
	});

	test("stripe webhook route exists (not 404)", async ({ request }) => {
		const res = await request.post("/api/webhooks/stripe", {
			data: {},
			headers: { "stripe-signature": "test" },
		});
		expect(res.status()).not.toBe(404);
	});

	test("clerk webhook rejects unsigned payload", async ({ request }) => {
		const res = await request.post("/api/webhooks/clerk", {
			data: {},
			headers: { "Content-Type": "application/json" },
		});
		expect(res.status()).toBe(400);
	});
});
