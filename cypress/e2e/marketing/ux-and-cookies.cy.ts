const MARKETING = Cypress.env("MARKETING_URL") || "http://localhost:4321";

describe("Marketing — Cookie Consent Banner", () => {
	beforeEach(() => {
		cy.visit(`${MARKETING}/`);
		cy.window().then((win) => {
			win.localStorage.removeItem("dba_cookie_consent");
		});
		cy.reload();
	});

	it("appears on first visit", () => {
		cy.get("#cookie-consent-root").should("be.visible");
	});

	it("dismisses on accept and stays dismissed on reload", () => {
		cy.get("#cookie-consent-root").should("be.visible");
		cy.get("#cookie-consent-accept").click();
		cy.wait(400);
		cy.get("#cookie-consent-root").should("not.be.visible");
		cy.reload();
		cy.wait(300);
		cy.get("#cookie-consent-root").should("not.be.visible");
	});
});

describe("Marketing — Mobile UX", () => {
	it("sticky CTA bar is visible on mobile", () => {
		cy.viewport(375, 812);
		cy.visit(`${MARKETING}/`);
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.get("#reachOutSticky").should("be.visible");
	});

	it("sticky bar opens reach-out modal with contact options", () => {
		cy.viewport(375, 812);
		cy.visit(`${MARKETING}/`);
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.get("#reachOutOpenBtn").click();
		cy.get("#reachOutModal").should("be.visible");
		cy.get('#reachOutModal a[href="/contact"]').should("be.visible");
		cy.get('#reachOutModal a[href="tel:+13159225592"]').should("be.visible");
		cy.get('#reachOutModal a[href*="mailto:anthony@designedbyanthony.com"]').should("be.visible");
		cy.get("#reachOutCalendlyBtn").should("be.visible");
	});

	it("no horizontal overflow on mobile", () => {
		cy.viewport(375, 812);
		cy.visit(`${MARKETING}/`);
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.window().then((win) => {
			const bodyWidth = win.document.body.scrollWidth;
			const viewportWidth = win.innerWidth;
			expect(bodyWidth).to.be.at.most(viewportWidth + 1);
		});
	});
});

describe("Marketing — Desktop UX", () => {
	it("reach-out sticky bar is visible on desktop", () => {
		cy.viewport(1280, 800);
		cy.visit(`${MARKETING}/`);
		cy.get("body").then(($body) => {
			if ($body.find("#cookie-consent-accept").length) {
				cy.get("#cookie-consent-accept").click();
			}
		});
		cy.get("#reachOutSticky").should("be.visible");
	});
});
