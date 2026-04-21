import { expect, test } from "@playwright/test";

/**
 * Confirms the hosted Lighthouse API is reachable from CI/local runners.
 * Uses a valid-format but non-existent report id (expects 404, not a network failure).
 */
const defaultApiBase =
	"https://lighthouse-audit--lighthouse-492701.us-east4.hosted.app";

test.describe("Lighthouse API connectivity", () => {
	test("report endpoint responds (404 for missing report)", async ({
		request,
	}) => {
		const base = process.env.PUBLIC_API_URL || defaultApiBase;
		const res = await request.get(
			`${base.replace(/\/$/, "")}/api/report/DBA-00000000`,
		);
		expect(
			res.status(),
			"API should return 404 for a missing report, proving the service is up",
		).toBe(404);
	});
});
