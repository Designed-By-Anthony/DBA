const leadSecret = () => Cypress.env("LEAD_WEBHOOK_SECRET") || "dba-lead-hook-2026";

describe("Lead intake API", () => {
	it("GET /api/lead describes public ingest", () => {
		cy.request("/api/lead").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.ok).to.eq(true);
			expect(res.body.endpoint).to.eq("public-lead-ingest");
		});
	});

	it("OPTIONS /api/lead returns 204 with CORS headers", () => {
		cy.request({ method: "OPTIONS", url: "/api/lead" }).then((res) => {
			expect(res.status).to.eq(204);
			expect(res.headers).to.have.property("access-control-allow-origin");
		});
	});

	it("POST /api/lead creates prospect (no client secret)", () => {
		const email = `e2e-public-${Date.now()}@example.com`;
		cy.request("POST", "/api/lead", {
			name: "E2E Public Lead",
			email,
			source: "cypress",
			message: "public ingest test",
			_hp: "",
		}).then((res) => {
			expect(res.status).to.be.oneOf([200, 201]);
			expect(res.body.success).to.eq(true);
			expect(res.body.prospectId).to.be.ok;
			expect(res.body).to.have.property("agencyId");
		});
	});

	it("POST /api/lead accepts portable-pack snake_case marketing fields", () => {
		const email = `e2e-portable-${Date.now()}@example.com`;
		cy.request("POST", "/api/lead", {
			name: "E2E Portable Pack",
			email,
			message: "snake_case parity for customer-site-embeds",
			_hp: "",
			offer_type: "vertaflow_product_portable_embed",
			cta_source: "customer_site_embed",
			page_context: "cypress_api",
			lead_source: "Cypress lead-intake.cy.ts",
			source: "customer_site_embed|lane:vertaflow_product",
		}).then((res) => {
			expect(res.status).to.be.oneOf([200, 201]);
			expect(res.body.success).to.eq(true);
			expect(res.body.prospectId).to.be.ok;
		});
	});

	it("POST /api/lead returns 400 without name", () => {
		cy.request({
			method: "POST",
			url: "/api/lead",
			body: { email: "only@example.com", _hp: "" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(400);
		});
	});

	it("POST /api/lead honeypot _hp non-empty returns 200 silently", () => {
		cy.request("POST", "/api/lead", {
			name: "Bot",
			email: "bot@example.com",
			_hp: "filled-by-bot",
		}).then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.success).to.eq(true);
		});
	});
});

describe("Lead webhook API", () => {
	it("GET /api/webhooks/lead without secret: secretOk false", () => {
		cy.request("/api/webhooks/lead").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.secretOk).to.eq(false);
		});
	});

	it("GET /api/webhooks/lead with secret: secretOk and resolvedAgencyId", () => {
		cy.request({
			url: "/api/webhooks/lead",
			headers: { "x-webhook-secret": leadSecret() },
		}).then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.secretOk).to.eq(true);
			expect(res.body).to.have.property("resolvedAgencyId");
		});
	});

	it("POST /api/webhooks/lead without secret returns 401", () => {
		cy.request({
			method: "POST",
			url: "/api/webhooks/lead",
			body: { name: "X", email: "x@y.com" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(401);
		});
	});

	it("POST /api/webhooks/lead ping does not create prospect", () => {
		cy.request("POST", "/api/webhooks/lead", {
			ping: true,
			secret: leadSecret(),
		}).then((res) => {
			expect(res.status).to.eq(200);
			expect(res.body.ping).to.eq(true);
			expect(res.body.ok).to.eq(true);
		});
	});

	it("POST /api/webhooks/lead with secret creates prospect", () => {
		const email = `e2e-webhook-${Date.now()}@example.com`;
		cy.request("POST", "/api/webhooks/lead", {
			name: "E2E Webhook Lead",
			email,
			source: "cypress_webhook",
			secret: leadSecret(),
			auditUrl: "https://example.com/report/test",
		}).then((res) => {
			expect(res.status).to.be.oneOf([200, 201]);
			expect(res.body.success).to.eq(true);
			expect(res.body.prospectId).to.be.ok;
		});
	});
});
