describe("Client Portal — Dashboard (Authenticated)", () => {
	beforeEach(() => {
		cy.mockPortalData();
		cy.visit("/portal/dashboard");
	});

	it("dashboard renders without application error", () => {
		cy.assertNoAppError();
	});

	it("shows welcome message with client first name", () => {
		cy.contains(/Welcome back, Jane/i, { timeout: 10000 }).should("be.visible");
	});

	it("shows company name in subtitle", () => {
		cy.contains(/Smith Plumbing/i, { timeout: 10000 }).should("be.visible");
	});

	it("shows current project status banner", () => {
		cy.contains(/In Development/i, { timeout: 10000 }).should("be.visible");
	});

	it("renders milestone list", () => {
		cy.contains("Building Your Website", { timeout: 10000 }).should("be.visible");
		cy.contains("Website Live!").should("be.visible");
	});

	it("shows existing support ticket in list", () => {
		cy.contains("Question about logo sizing", { timeout: 10000 }).should("be.visible");
	});

	it("shows ticket submit form", () => {
		cy.get('input[placeholder*="help"], input[placeholder*="What"]', { timeout: 10000 })
			.first()
			.should("be.visible");
	});

	it("submit ticket button is disabled when subject is empty", () => {
		cy.contains("button", /submit ticket/i, { timeout: 10000 })
			.first()
			.should("be.disabled");
	});

	it("portal nav shows Dashboard and Tickets tabs", () => {
		cy.get("a").contains(/dashboard/i).should("be.visible");
		cy.get("a").contains(/tickets/i).should("be.visible");
	});

	it("shows project notes from admin update", () => {
		cy.contains(/finished the homepage/i, { timeout: 10000 }).should("be.visible");
	});
});

describe("Client Portal — Dashboard (Unauthenticated)", () => {
	it("unauthenticated /portal/dashboard redirects to portal login", () => {
		cy.visit("/portal/dashboard");
		cy.url().should("include", "/portal");
	});
});
