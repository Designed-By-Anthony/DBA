const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

const CRITICAL_PAGES = [
	"/", "/contact", "/about", "/portfolio", "/services",
	"/faq", "/blog", "/ouredge", "/service-areas",
	"/services/custom-web-design", "/services/local-seo",
	"/services/managed-hosting", "/services/website-rescue",
	"/services/ai-automation", "/services/workspace-setup",
];

const DEEP_ROUTES = [
	"/blog/mobile-first-seo", "/portfolio/the-long-beach-handyman",
	"/privacy", "/terms", "/cookie", "/image-license",
	"/service-areas/utica", "/services/google-business-profile", "/thank-you",
];

describe("Marketing — All Critical Pages Load (200)", () => {
	for (const path of CRITICAL_PAGES) {
		it(`${path} returns 200`, () => {
			cy.request({ url: `${MARKETING}${path}`, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.eq(200);
			});
		});
	}
});

describe("Marketing — Deep Routes (200)", () => {
	for (const path of DEEP_ROUTES) {
		it(`${path} returns 200`, () => {
			cy.request({ url: `${MARKETING}${path}`, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.eq(200);
			});
		});
	}
});

describe("Marketing — Desktop Navigation", () => {
	it("all nav links are present", () => {
		cy.viewport(1280, 800);
		cy.visit(`${MARKETING}/`);
		cy.get('.nav-desktop a[href="/services"]').should("be.visible");
		cy.get('.nav-desktop a[href="/portfolio"]').should("be.visible");
		cy.get('.nav-desktop a[href="/contact"]').should("be.visible");
	});
});

describe("Marketing — Mobile Navigation", () => {
	it("hamburger opens and closes", () => {
		cy.viewport(375, 812);
		cy.visit(`${MARKETING}/`);
		cy.get("#hamburger-btn").click();
		cy.get("#mobile-nav").should("have.class", "open");
		cy.get("body").type("{esc}");
		cy.get("#mobile-nav").should("not.have.class", "open");
	});
});
