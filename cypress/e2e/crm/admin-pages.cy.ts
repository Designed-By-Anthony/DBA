/**
 * Comprehensive admin page smoke tests.
 * Every CRM admin route gets a no-500, no-Application-Error check.
 */

const adminPages = [
	{ path: "/admin", label: "Dashboard" },
	{ path: "/admin/prospects", label: "Prospects" },
	{ path: "/admin/clients", label: "My Clients" },
	{ path: "/admin/pipeline", label: "Pipeline" },
	{ path: "/admin/calendar", label: "Calendar" },
	{ path: "/admin/appointments", label: "Appointments" },
	{ path: "/admin/inbox", label: "Omnichannel Inbox" },
	{ path: "/admin/email", label: "Email" },
	{ path: "/admin/email/sequences", label: "Email Sequences" },
	{ path: "/admin/email/history", label: "Email History" },
	{ path: "/admin/contracts", label: "Contracts" },
	{ path: "/admin/estimates", label: "Estimates" },
	{ path: "/admin/invoices", label: "Invoices" },
	{ path: "/admin/billing", label: "Billing" },
	{ path: "/admin/reports", label: "Reports" },
	{ path: "/admin/tickets", label: "Tickets" },
	{ path: "/admin/pricebook", label: "Price Book" },
	{ path: "/admin/automations", label: "Automations" },
];

const settingsPages = [
	{ path: "/admin/settings", label: "Settings" },
	{ path: "/admin/settings/branding", label: "Branding" },
	{ path: "/admin/settings/business", label: "Business" },
	{ path: "/admin/settings/domains", label: "Domains" },
	{ path: "/admin/settings/notifications", label: "Notifications" },
	{ path: "/admin/settings/payments", label: "Payments" },
	{ path: "/admin/settings/pipeline", label: "Pipeline Settings" },
	{ path: "/admin/settings/sources", label: "Sources" },
	{ path: "/admin/settings/team", label: "Team" },
	{ path: "/admin/settings/vertical", label: "Vertical" },
];

const legalPages = [
	{ path: "/admin/legal/terms", label: "Terms" },
	{ path: "/admin/legal/privacy", label: "Privacy" },
	{ path: "/admin/legal/aup", label: "AUP" },
];

describe("Admin — Core Pages (no 500, no crash)", () => {
	for (const { path, label } of adminPages) {
		it(`${label} (${path}) renders without 500`, () => {
			cy.request({ url: path, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.not.eq(500);
			});
			cy.visit(path);
			cy.assertNoAppError();
		});
	}
});

describe("Admin — Settings Pages (no 500, no crash)", () => {
	for (const { path, label } of settingsPages) {
		it(`${label} (${path}) renders without 500`, () => {
			cy.request({ url: path, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.not.eq(500);
			});
			cy.visit(path);
			cy.assertNoAppError();
		});
	}
});

describe("Admin — Legal Pages (no 500, no crash)", () => {
	for (const { path, label } of legalPages) {
		it(`${label} (${path}) renders without 500`, () => {
			cy.request({ url: path, failOnStatusCode: false }).then((res) => {
				expect(res.status).to.not.eq(500);
			});
			cy.visit(path);
			cy.assertNoAppError();
		});
	}
});
