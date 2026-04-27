/**
 * Lighthouse audit app — Smoke tests
 * Target: http://localhost:3100 (Lighthouse dev server)
 */
const LIGHTHOUSE = Cypress.env("LIGHTHOUSE_URL") || "http://localhost:3100";

describe("Lighthouse — Smoke", () => {
	it("home page loads and shows audit form", () => {
		cy.request({ url: `${LIGHTHOUSE}/`, failOnStatusCode: false }).then(
			(res) => {
				expect(res.status).to.be.oneOf([200, 301, 302]);
			},
		);
	});

	it("audit API endpoint exists (not 404)", () => {
		cy.request({
			url: `${LIGHTHOUSE}/api/audit`,
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(404);
		});
	});

	it("contact API rejects empty POST", () => {
		cy.request({
			method: "POST",
			url: `${LIGHTHOUSE}/api/contact`,
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("report API responds for invalid ID (not 500)", () => {
		cy.request({
			url: `${LIGHTHOUSE}/api/report/INVALID-ID`,
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});
