const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — Accessibility", () => {
	it("free audit page does not expose unlabeled inline SVGs", () => {
		cy.visit(`${MARKETING}/free-seo-audit`);
		cy.window().then((win) => {
			const root = win.document.querySelector("[data-lh-audit]");
			if (!root) return;
			const unlabeled = Array.from(root.querySelectorAll("svg")).filter((svg) => {
				if (svg.closest(".cf-turnstile")) return false;
				const ariaHidden = svg.getAttribute("aria-hidden") === "true";
				const ariaLabel = svg.getAttribute("aria-label");
				const hasTitle = !!svg.querySelector("title");
				return !ariaHidden && !ariaLabel && !hasTitle;
			});
			expect(unlabeled.length).to.eq(0);
		});
	});

	it("free audit page does not render empty report target link before results", () => {
		cy.visit(`${MARKETING}/free-seo-audit`);
		cy.get('a[data-report-url][href="#"]').should("have.length", 0);
	});

	it("competitor table includes an accessible caption", () => {
		cy.visit(`${MARKETING}/free-seo-audit`);
		cy.get(".competitor-table caption").should("have.length", 1);
		cy.get(".competitor-table caption").invoke("text").should("match", /local competitor comparison/i);
	});

	it("competitor table uses column and row headers", () => {
		cy.visit(`${MARKETING}/free-seo-audit`);
		cy.get(".competitor-table thead th").each(($th) => {
			expect($th.attr("scope")).to.eq("col");
		});
		cy.get(".competitor-table tbody tr").first().find(":first-child").then(($el) => {
			expect($el.prop("tagName")).to.eq("TH");
			expect($el.attr("scope")).to.eq("row");
		});
	});

	it("contact page title clearly describes the page purpose", () => {
		cy.visit(`${MARKETING}/contact`);
		cy.title().should("match", /Contact.*Web Design.*SEO.*Designed by Anthony/);
	});
});
