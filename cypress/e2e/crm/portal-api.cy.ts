describe("Branding API", () => {
	it("returns default branding without org param", () => {
		cy.request("/api/portal/branding").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.brandName).to.eq("Client Portal");
			expect(res.body.brandColor).to.eq("#2563eb");
			expect(res.body.brandInitial).to.eq("D");
			expect(res.body.verticalTemplate).to.eq("general");
		});
	});

	it("returns default branding for unknown org", () => {
		cy.request("/api/portal/branding?org=org_doesnotexist").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body).to.have.property("brandName");
			expect(res.body).to.have.property("brandColor");
			expect(res.body).to.have.property("verticalTemplate");
		});
	});

	it("branding response includes all required fields", () => {
		cy.request("/api/portal/branding").then((res) => {
			expect(res.body).to.have.property("brandName");
			expect(res.body).to.have.property("brandColor");
			expect(res.body).to.have.property("brandInitial");
			expect(res.body).to.have.property("verticalTemplate");
		});
	});
});

describe("Magic Link API", () => {
	it("rejects requests without email", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/magic-link",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("rejects empty email", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/magic-link",
			body: { email: "" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("handles non-existent prospect email gracefully (no 500)", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/magic-link",
			body: { email: "nobody@doesnotexist.com" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
			expect([200, 400, 404]).to.include(res.status);
		});
	});
});

describe("Portal Verify API", () => {
	it("rejects requests without token", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/verify",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("rejects invalid tokens", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/verify",
			body: { token: "invalid_token_12345" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(401);
		});
	});
});
