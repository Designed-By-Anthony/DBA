describe("PWA — Manifest & Offline", () => {
	it("GET /manifest.webmanifest returns valid JSON", () => {
		cy.request("/manifest.webmanifest").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.headers["content-type"]).to.match(/json/i);
		});
	});

	it("manifest has required PWA fields", () => {
		cy.request("/manifest.webmanifest").then((res) => {
			const data = res.body;
			expect(data).to.have.property("name");
			expect(data).to.have.property("short_name");
			expect(data).to.have.property("start_url");
			expect(data).to.have.property("display");
			expect(data).to.have.property("theme_color");
			expect(data).to.have.property("icons");
			expect(data.icons).to.be.an("array");
		});
	});

	it("manifest is branded for VertaFlow portal install flow", () => {
		cy.request("/manifest.webmanifest").then((res) => {
			expect(res.body.name).to.eq("VertaFlow Portal");
			expect(res.body.short_name).to.eq("VertaFlow");
		});
	});

	it("manifest start_url points to portal dashboard", () => {
		cy.request("/manifest.webmanifest").then((res) => {
			expect(res.body.start_url).to.eq("/portal/dashboard");
		});
	});

	it("manifest display mode is standalone (app-like)", () => {
		cy.request("/manifest.webmanifest").then((res) => {
			expect(res.body.display).to.eq("standalone");
		});
	});

	it("192x192 icon file exists", () => {
		cy.request("/icons/icon-192.png").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.headers["content-type"]).to.match(/image/i);
		});
	});

	it("512x512 icon file exists", () => {
		cy.request("/icons/icon-512.png").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.headers["content-type"]).to.match(/image/i);
		});
	});

	it("apple-touch-icon exists", () => {
		cy.request("/icons/apple-touch-icon.png").then((res) => {
			expect(res.status).to.eq(200);
		});
	});

	it("offline page loads without application error", () => {
		cy.visit("/offline");
		cy.assertNoAppError();
	});

	it("offline page shows branded heading", () => {
		cy.visit("/offline");
		cy.get("h1, h2, h3").contains(/offline/i, { timeout: 10000 }).should("be.visible");
	});

	it("offline page has Try Again button", () => {
		cy.visit("/offline");
		cy.contains("button", /try again/i, { timeout: 10000 }).should("be.visible");
	});

	it("layout has theme-color meta tag", () => {
		cy.visit("/portal");
		cy.assertNoAppError();
		cy.get('meta[name="theme-color"]').should("exist");
	});
});

describe("PWA — API Auth Guards", () => {
	it("GET /api/portal/tickets returns 401 without session", () => {
		cy.request({ url: "/api/portal/tickets", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.eq(401);
		});
	});

	it("POST /api/portal/push-token returns 401 without session", () => {
		cy.request({
			method: "POST",
			url: "/api/portal/push-token",
			body: { token: "test-token" },
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(401);
		});
	});

	it("DELETE /api/portal/push-token returns 401 without session", () => {
		cy.request({
			method: "DELETE",
			url: "/api/portal/push-token",
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.eq(401);
		});
	});

	it("GET /api/admin/tickets responds (not 500)", () => {
		cy.request({ url: "/api/admin/tickets", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
	});

	it("PATCH /api/admin/tickets/nonexistent returns 404 or auth error", () => {
		cy.request({
			method: "PATCH",
			url: "/api/admin/tickets/nonexistent-id-xyz",
			body: { adminReply: "test", status: "resolved" },
			failOnStatusCode: false,
		}).then((res) => {
			expect([401, 403, 404]).to.include(res.status);
		});
	});
});
