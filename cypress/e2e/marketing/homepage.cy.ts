/**
 * Marketing site — Homepage tests
 * Target: http://localhost:4321 (Astro dev server)
 */
const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — Homepage", () => {
	beforeEach(() => {
		cy.visit(`${MARKETING}/`);
	});

	it("loads and renders hero section", () => {
		cy.title().should("match", /Designed by Anthony/);
		cy.get(".page-hero h1").should("be.visible");
		cy.get("#hero-founder-btn").should("be.visible");
	});

	it("hero CTA links are correct", () => {
		cy.get("#hero-founder-btn").should("have.attr", "href").and("match", /calendly\.com/);
		cy.get("#hero-run-audit-btn").should("have.attr", "href", "/free-seo-audit");
	});

	it("founding partner section is visible with clear CTAs", () => {
		cy.get(".founding-partner-shell").should("be.visible");
		cy.get('.founding-partner-shell a[href*="calendly.com"]').first().should("be.visible");
		cy.get('.founding-partner-shell a[href="/free-seo-audit"]').first().should("be.visible");
	});

	it("featured work section is visible with 3 cards", () => {
		cy.get(".featured-work-grid").should("be.visible");
		cy.get(".featured-work-card").should("have.length", 3);
	});

	it("has structured data (JSON-LD)", () => {
		cy.get('script[type="application/ld+json"]').should("have.length.greaterThan", 0);
	});
});
