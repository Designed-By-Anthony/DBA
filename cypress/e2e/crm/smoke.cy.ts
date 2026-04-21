describe("🧯 Smoke Tests (Basic Sanity)", () => {
	it("Admin login page renders without 500 error", () => {
		cy.request({ url: "/admin", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
		cy.visit("/admin");
		cy.contains("Agency OS", { timeout: 15000 }).should("be.visible");
	});

	it("Portal login page renders without 500 error", () => {
		cy.request({ url: "/portal", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
		cy.visit("/portal");
		cy.contains(/Client Portal/i, { timeout: 15000 }).should("be.visible");
	});

	it("My Clients page renders without 500 error", () => {
		cy.visit("/admin/clients");
		cy.contains("My Clients", { timeout: 15000 }).should("be.visible");
	});

	it("Inbox page renders without 500 error", () => {
		cy.visit("/admin/inbox");
		cy.contains(/Omnichannel Inbox/i, { timeout: 15000 }).should(
			"be.visible",
		);
	});

	it("Email History page renders without 500 error", () => {
		cy.visit("/admin/email/history");
		cy.contains(/Email History/i, { timeout: 15000 }).should("be.visible");
	});

	it("Branding API responds with 200", () => {
		cy.request("/api/portal/branding").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body).to.have.property("brandName");
			expect(res.body).to.have.property("verticalTemplate");
		});
	});
});
