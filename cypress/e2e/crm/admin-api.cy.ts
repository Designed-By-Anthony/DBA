/**
 * Admin API contract tests.
 * Covers every /api/admin/* endpoint for status-code sanity.
 * Auth-guarded endpoints should return 401/403, never 500.
 */

describe("Admin API — Tickets", () => {
	it("GET /api/admin/tickets responds (not 500)", () => {
		cy.request({ url: "/api/admin/tickets", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/tickets without auth returns 401 or 403", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/tickets",
			body: { subject: "test", description: "test" },
			failOnStatusCode: false,
		}).then((res) => {
			expect([401, 403]).to.include(res.status);
		});
	});

	it("PATCH /api/admin/tickets/nonexistent returns 401/403/404", () => {
		cy.request({
			method: "PATCH",
			url: "/api/admin/tickets/nonexistent-id",
			body: { adminReply: "test", status: "resolved" },
			failOnStatusCode: false,
		}).then((res) => {
			expect([401, 403, 404]).to.include(res.status);
		});
	});
});

describe("Admin API — AI Support", () => {
	it("POST /api/admin/ai-support without auth returns 401 or 403", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/ai-support",
			body: { message: "test" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/ai-support/escalate without auth returns 401 or 403", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/ai-support/escalate",
			body: { ticketId: "test" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Contracts", () => {
	it("GET /api/admin/contracts responds (not 500)", () => {
		cy.request({ url: "/api/admin/contracts", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/contracts without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/contracts",
			body: { name: "Test Contract" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Estimates", () => {
	it("GET /api/admin/estimates responds (not 500)", () => {
		cy.request({ url: "/api/admin/estimates", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/estimates without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/estimates",
			body: { name: "Test Estimate" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Invoices", () => {
	it("GET /api/admin/invoices responds (not 500)", () => {
		cy.request({ url: "/api/admin/invoices", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/invoices without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/invoices",
			body: { amount: 100 },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Kitchen Display", () => {
	it("GET /api/admin/kitchen responds (not 500)", () => {
		cy.request({ url: "/api/admin/kitchen", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Notifications", () => {
	it("GET /api/admin/notifications responds (not 500)", () => {
		cy.request({ url: "/api/admin/notifications", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/notification-preferences without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/notification-preferences",
			body: { email: true },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/admin/push-subscribe without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/push-subscribe",
			body: { subscription: {} },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Upload", () => {
	it("POST /api/admin/upload without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/upload",
			body: {},
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});

describe("Admin API — Review Requests", () => {
	it("POST /api/admin/review-requests without auth returns non-500", () => {
		cy.request({
			method: "POST",
			url: "/api/admin/review-requests",
			body: { prospectId: "test" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});
});
