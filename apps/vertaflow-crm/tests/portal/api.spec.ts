import { expect, test } from "@playwright/test";

/**
 * Portal Branding API Tests
 *
 * Tests the /api/portal/branding endpoint directly.
 */
test.describe("Branding API", () => {
	test("returns default branding without org param", async ({ request }) => {
		const res = await request.get("/api/portal/branding");
		expect(res.status()).toBe(200);

		const data = await res.json();
		expect(data.brandName).toBe("Client Portal");
		expect(data.brandColor).toBe("#2563eb");
		expect(data.brandInitial).toBe("D");
		expect(data.verticalTemplate).toBe("general");
	});

	test("returns default branding for unknown org", async ({ request }) => {
		const res = await request.get("/api/portal/branding?org=org_doesnotexist");
		expect(res.status()).toBe(200);

		const data = await res.json();
		// Should fall back to defaults for non-existent orgs
		expect(data.brandName).toBeDefined();
		expect(data.brandColor).toBeDefined();
		expect(data.verticalTemplate).toBeDefined();
	});

	test("branding response includes all required fields", async ({
		request,
	}) => {
		const res = await request.get("/api/portal/branding");
		const data = await res.json();

		// Must have all four fields for the portal to render correctly
		expect(data).toHaveProperty("brandName");
		expect(data).toHaveProperty("brandColor");
		expect(data).toHaveProperty("brandInitial");
		expect(data).toHaveProperty("verticalTemplate");
	});
});

/**
 * Magic Link API Tests
 *
 * Tests the /api/portal/magic-link endpoint.
 */
test.describe("Magic Link API", () => {
	test("rejects requests without email", async ({ request }) => {
		const res = await request.post("/api/portal/magic-link", {
			data: {},
		});
		expect(res.status()).toBe(400);
	});

	test("rejects empty email", async ({ request }) => {
		const res = await request.post("/api/portal/magic-link", {
			data: { email: "" },
		});
		expect(res.status()).toBe(400);
	});

	test("handles non-existent prospect email gracefully", async ({
		request,
	}) => {
		const res = await request.post("/api/portal/magic-link", {
			data: { email: "nobody@doesnotexist.com" },
		});
		// Anti-enumeration: may return 200 with success body, or 400 — never 500.
		expect(res.status()).not.toBe(500);
		expect([200, 400, 404].includes(res.status())).toBeTruthy();
	});
});

/**
 * Portal Verify API Tests
 *
 * Tests the /api/portal/verify endpoint.
 */
test.describe("Portal Verify API", () => {
	test("rejects requests without token", async ({ request }) => {
		const res = await request.post("/api/portal/verify", {
			data: {},
		});
		expect(res.status()).toBe(400);
	});

	test("rejects invalid tokens", async ({ request }) => {
		const res = await request.post("/api/portal/verify", {
			data: { token: "invalid_token_12345" },
		});
		expect(res.status()).toBe(401);
	});
});
