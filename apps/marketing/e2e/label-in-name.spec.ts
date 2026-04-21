import { expect, test } from "@playwright/test";

test("report target link accessible name starts with the visible URL", async ({
	page,
}) => {
	// Avoid racing the page's fetch() to /api/report/:id — when it wins, it can call
	// setReportData after this test's mock and desync visible text vs aria-label.
	await page.route("**/api/report/**", (route) => route.abort());

	await page.goto("/report?id=DBA-DESI6HSF", { waitUntil: "domcontentloaded" });
	await page.evaluate(() => {
		type InlineReportInstance = HTMLElement & {
			setReportData: (data: Record<string, unknown>) => void;
		};
		const inlineReport = document.querySelector(
			"inline-report",
		) as InlineReportInstance | null;
		if (!inlineReport || typeof inlineReport.setReportData !== "function") {
			throw new Error("inline-report custom element is unavailable");
		}

		inlineReport.setReportData({
			reportId: "DBA-DESI6HSF",
			url: "designedbyanthony.com",
			company: "Designed by Anthony",
			createdAt: { _seconds: 1712808000 },
			scores: {
				performance: 98,
				accessibility: 96,
				bestPractices: 100,
				seo: 98,
				trustScore: 97,
				conversion: 95,
			},
			metrics: {},
			diagnostics: {},
			aiInsight: {
				summary:
					"Strong local service-business homepage with clear calls to action.",
				strengths: ["Fast page load"],
				weaknesses: ["Minor copy polish"],
			},
			htmlSignals: {},
			places: { placeFound: false, rating: null, reviewCount: 0 },
			competitors: [],
		});
	});

	const targetLink = page.locator("a[data-report-url]");
	await expect(targetLink).toBeVisible();

	const visibleText = ((await targetLink.textContent()) || "")
		.replace(/\s+/g, " ")
		.trim();
	const ariaLabel = (await targetLink.getAttribute("aria-label")) || "";

	expect(visibleText.length).toBeGreaterThan(0);
	expect(ariaLabel.startsWith(visibleText)).toBe(true);
});
