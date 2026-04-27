const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — Accessibility", () => {
	it("contact page exposes a single main landmark", () => {
		cy.visit(`${MARKETING}/contact`);
		cy.get("main#main-content").should("have.length", 1);
	});

	it("contact page title clearly describes the page purpose", () => {
		cy.visit(`${MARKETING}/contact`);
		cy.title().should("match", /Contact.*Web Design.*SEO.*Designed by Anthony/);
	});
});
