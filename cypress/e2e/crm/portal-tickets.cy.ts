describe("Client Portal — Tickets Page", () => {
	beforeEach(() => {
		cy.mockTickets();
		cy.visit("/portal/tickets");
	});

	it("tickets page loads without application error", () => {
		cy.assertNoAppError();
	});

	it("shows Support heading", () => {
		cy.get("h1, h2, h3").contains(/support/i, { timeout: 10000 }).should("be.visible");
	});

	it("New Ticket button is visible", () => {
		cy.contains("button", /new ticket/i, { timeout: 10000 }).should("be.visible");
	});

	it("lists existing tickets", () => {
		cy.contains("Logo upload issue", { timeout: 10000 }).should("be.visible");
		cy.contains("Change the hero headline").should("be.visible");
	});

	it("shows resolved ticket status badge", () => {
		cy.contains("resolved", { timeout: 10000 }).should("be.visible");
	});

	it("clicking New Ticket shows the submission form", () => {
		cy.contains("button", /new ticket/i).click();
		cy.get('input[placeholder*="Subject"], input[placeholder*="subject"]', { timeout: 5000 })
			.first()
			.should("be.visible");
	});

	it("Submit button is disabled without a subject", () => {
		cy.contains("button", /new ticket/i).click();
		cy.contains("button", /submit ticket/i, { timeout: 5000 })
			.first()
			.should("be.disabled");
	});

	it("Submit button enables after typing a subject", () => {
		cy.contains("button", /new ticket/i).click();
		cy.get('input[placeholder*="Subject"], input[placeholder*="subject"], input[placeholder*="help"]')
			.first()
			.type("My website is down");
		cy.contains("button", /submit ticket/i)
			.first()
			.should("be.enabled");
	});

	it("submitting a ticket shows success message", () => {
		cy.contains("button", /new ticket/i).click();
		cy.get("input").first().type("Billing question");
		cy.contains("button", /submit ticket/i).first().click();
		cy.contains(/submitted|sent|touch|success/i, { timeout: 10000 }).should("be.visible");
	});

	it("clicking a ticket shows the thread view", () => {
		cy.contains("Logo upload issue").click();
		cy.contains(/I cannot figure out how to upload/i, { timeout: 5000 }).should("be.visible");
	});

	it("portal nav is visible on tickets page", () => {
		cy.get("a").contains(/dashboard/i).first().should("be.visible");
	});
});

describe("Client Portal — Tickets (Unauthenticated)", () => {
	it("unauthenticated /portal/tickets redirects to portal login", () => {
		cy.visit("/portal/tickets");
		cy.url().should("include", "/portal");
	});
});
