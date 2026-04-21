describe("Webhook endpoints (basic contract)", () => {
	it("calendly rejects invalid payload", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/calendly",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("idx rejects missing fields", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/idx",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("agentic rejects missing context", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/agentic",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("stripe webhook route exists (not 404)", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/stripe",
			body: {},
			headers: { "stripe-signature": "test" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(404);
		});
	});

	it("clerk webhook rejects unsigned payload", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/clerk",
			body: {},
			headers: { "Content-Type": "application/json" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});
});
