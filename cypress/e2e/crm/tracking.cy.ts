describe("Tracking + compliance endpoints", () => {
	it("open pixel returns a GIF with no-cache headers", () => {
		cy.request("/api/track/open/test-email-123").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.headers["content-type"]).to.include("image/gif");
			expect(res.headers["cache-control"]).to.include("no-cache");
		});
	});

	it("click tracking rejects unsigned redirect (open-redirect guard)", () => {
		cy.request({
			url: "/api/track/click/test-email-123?url=https%3A%2F%2Fexample.com",
			failOnStatusCode: false,
			followRedirect: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("click tracking rejects when url missing", () => {
		cy.request({
			url: "/api/track/click/test-email-123",
			failOnStatusCode: false,
			followRedirect: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("unsubscribe rejects missing parameters", () => {
		cy.request({
			url: "/api/unsubscribe",
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
			expect(res.body.toString().toLowerCase()).to.include("invalid");
		});
	});

	it("unsubscribe rejects invalid token", () => {
		cy.request({
			url: "/api/unsubscribe?id=prospect_123&token=invalid",
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
			expect(res.body.toString().toLowerCase()).to.include("invalid");
		});
	});
});
