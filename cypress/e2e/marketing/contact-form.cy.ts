const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — Contact Form", () => {
	beforeEach(() => {
		cy.visit(`${MARKETING}/contact`);
	});

	it("form renders all required fields", () => {
		cy.get("[data-audit-form]").should("be.visible");
		cy.get('input[name="first_name"]').should("be.visible");
		cy.get('input[name="email"]').should("be.visible");
		cy.get('input[name="website"]').should("be.visible");
		cy.get('textarea[name="biggest_issue"]').should("be.visible");
	});

	it("bot token field is present (reCAPTCHA hidden or legacy Turnstile)", () => {
		cy.get("[data-audit-form]").within(() => {
			cy.get(
				'input[name="g-recaptcha-response"], .cf-turnstile[data-size="invisible"]',
			).should("exist");
		});
	});

	it("submit button is present and enabled", () => {
		cy.get("[data-form-submit]").should("be.visible").and("be.enabled");
	});
});

describe("Marketing — Contact Page Calendly", () => {
	it("Calendly modal opens and injects iframe", () => {
		cy.visit(`${MARKETING}/contact`);
		cy.get("#calendlyOpenBtn").click();
		cy.get("#calendlyModal").should("be.visible");
		cy.get("#calendlyModalBody iframe").should("be.visible");
		cy.get("#calendlyModalBody iframe")
			.should("have.attr", "src")
			.and("match", /calendly\.com/);
	});
});

describe("Marketing — FAQ Accordion", () => {
	it("first question expands on click", () => {
		cy.visit(`${MARKETING}/faq`);
		// Dismiss cookie consent if present
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
				cy.wait(400);
			}
		});
		cy.get("#faq-accordion .faq-trigger")
			.first()
			.should("have.attr", "aria-expanded", "false");
		cy.get("#faq-accordion .faq-trigger").first().click();
		cy.get("#faq-accordion .faq-trigger")
			.first()
			.should("have.attr", "aria-expanded", "true");
		cy.get("#faq-accordion .faq-panel.is-open").first().should("be.visible");
	});
});
