import { expect, test } from "@playwright/test";
import { gotoPage } from "./helpers/navigation";

test.describe("🧯 Smoke Tests (Basic Sanity)", () => {
	test("Admin login page renders without 500 error", async ({ page }) => {
		const response = await gotoPage(page, "/admin");
		expect(response?.status()).not.toBe(500);
		await expect(page.locator("text=Agency OS").first()).toBeVisible({
			timeout: 15000,
		});
	});

	test("Portal login page renders without 500 error", async ({ page }) => {
		const response = await gotoPage(page, "/portal");
		expect(response?.status()).not.toBe(500);
		await expect(
			page.getByRole("heading", { name: /Client Portal/i }),
		).toBeVisible({ timeout: 15000 });
	});

	test("My Clients page renders without 500 error", async ({ page }) => {
		const response = await gotoPage(page, "/admin/clients");
		expect(response?.status()).not.toBe(500);
		await expect(page.getByRole("heading", { name: "My Clients" })).toBeVisible(
			{ timeout: 15000 },
		);
	});

	test("Inbox page renders without 500 error", async ({ page }) => {
		const response = await gotoPage(page, "/admin/inbox");
		expect(response?.status()).not.toBe(500);
		await expect(
			page.getByRole("heading", { name: /Omnichannel Inbox/i }),
		).toBeVisible({ timeout: 15000 });
	});

	test("Email History page renders without 500 error", async ({ page }) => {
		const response = await gotoPage(page, "/admin/email/history");
		expect(response?.status()).not.toBe(500);
		await expect(
			page.getByRole("heading", { name: /Email History/i }),
		).toBeVisible({ timeout: 15000 });
	});

	test("Branding API responds with 200", async ({ request }) => {
		const res = await request.get("/api/portal/branding");
		expect(res.status()).toBe(200);
		const data = await res.json();
		expect(data.brandName).toBeDefined();
		expect(data.verticalTemplate).toBeDefined();
	});

	// Skip this test in dev — Next.js Turbopack dev server doesn't reliably mount SWs
	test.skip("Service worker intercepts offline navigation", async ({
		page,
		context,
	}) => {
		await gotoPage(page, "/portal");
		await page.waitForLoadState("domcontentloaded");

		// Mocks offline mode
		await context.setOffline(true);

		try {
			await gotoPage(page, "/portal/dashboard", { timeout: 5000 });
		} catch {
			// Expected to fail navigation or load offline page
		}

		// Check if it routes to offline or displays disconnected UI
		const text = await page.textContent("body");
		const isOfflineMode =
			text?.toLowerCase().includes("offline") ||
			text?.toLowerCase().includes("internet");
		expect(isOfflineMode).toBeTruthy();
	});
});
