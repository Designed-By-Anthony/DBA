const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — SEO Meta", () => {
	it("contact page title clearly describes the page purpose", () => {
		cy.visit(`${MARKETING}/contact`);
		cy.title().should("match", /Contact.*Web Design.*SEO.*Designed by Anthony/);
	});

	it("homepage has structured data", () => {
		cy.visit(`${MARKETING}/`);
		cy.get('script[type="application/ld+json"]').should("have.length.greaterThan", 0);
	});
});

describe("Marketing — Service Pages", () => {
	const servicePages = [
		"/services/custom-web-design",
		"/services/local-seo",
		"/services/managed-hosting",
		"/services/website-rescue",
		"/services/ai-automation",
		"/services/workspace-setup",
		"/services/google-business-profile",
	];

	for (const path of servicePages) {
		it(`${path} loads without error`, () => {
			cy.request({ url: `${MARKETING}${path}`, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.eq(200);
			});
		});
	}

	it("managed hosting page has pricing section", () => {
		cy.visit(`${MARKETING}/services/managed-hosting`);
		// Dismiss cookie consent if present
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.get(".service-pricing-card").first().should("be.visible");
	});

	it("workspace setup page has pricing section", () => {
		cy.visit(`${MARKETING}/services/workspace-setup`);
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.get(".service-pricing-card").first().should("be.visible");
	});
});
