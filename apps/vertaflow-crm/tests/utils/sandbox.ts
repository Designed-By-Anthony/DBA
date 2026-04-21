import type { Page } from "@playwright/test";

/**
 * Mocks the external Stripe Checkout API to instantly return a mocked
 * session URL instead of hitting the real backend pipeline.
 */
export async function mockStripeCheckout(
	page: Page,
	mockUrl = "https://checkout.stripe.com/c/pay/cs_test_mock_12345",
) {
	await page.route("**/api/webhooks/stripe", async (route) => {
		// Allows testing webhook hits if needed
		await route.fulfill({ status: 200, json: { received: true } });
	});

	// Since actual checkout creation happens inside Server Actions communicating directly
	// with Stripe (not browser -> Stripe), we actually need to intercept the App-facing REST call
	// if you use one, or intercept the navigation itself:
	await page.route(mockUrl, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "text/html",
			body: '<html><body><h1>Mock Stripe Checkout</h1><button id="success-btn">Pay Now</button></body></html>',
		});
	});
}

/**
 * Mocks the Google Drive API to prevent tests from dumping empty folders
 * into the production agency workspace.
 */
export async function mockGoogleDrive(page: Page) {
	// If the browser attempts to hit google APIs (e.g. Oauth)
	await page.route("https://www.googleapis.com/**", async (route) => {
		await route.fulfill({
			status: 200,
			json: {
				id: "mock_folder_123",
				webViewLink: "https://drive.google.com/drive/folders/mock_folder_123",
			},
		});
	});
}
