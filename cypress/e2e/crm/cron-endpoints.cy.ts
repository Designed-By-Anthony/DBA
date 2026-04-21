describe("Cron endpoints — Auth Guard", () => {
	it("POST /api/cron/ai-summarize without CRON_SECRET returns 401", () => {
		cy.request({
			method: "POST",
			url: "/api/cron/ai-summarize",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect([401, 403]).to.include(res.status);
		});
	});

	it("POST /api/cron/email-sequences without CRON_SECRET returns 401", () => {
		cy.request({
			method: "POST",
			url: "/api/cron/email-sequences",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect([401, 403]).to.include(res.status);
		});
	});
});
