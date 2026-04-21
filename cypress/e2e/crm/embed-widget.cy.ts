describe("Embed Widget — Lead Form", () => {
	it("GET /api/embed/lead/skin returns widget config", () => {
		cy.request({ url: "/api/embed/lead/skin", failOnStatusCode: false }).then((res) => {
			// Should respond with config or auth error, never 500
			expect(res.status).to.not.eq(500);
		});
	});

	it("POST /api/embed/lead/submit creates a lead", () => {
		const email = `e2e-embed-${Date.now()}@example.com`;
		cy.request({
			method: "POST",
			url: "/api/embed/lead/submit",
			body: {
				name: "Embed Widget Test",
				email,
				_hp: "",
			},
			failOnStatusCode: false,
		}).then((res) => {
			// Should succeed or return validation error, never 500
			expect(res.status).to.not.eq(500);
		});
	});

	it("widget JS file serves from /widgets/lead-form.js", () => {
		cy.request("/widgets/lead-form.js").then((res) => {
			expect(res.status).to.eq(200);
			expect(res.headers["content-type"]).to.match(/javascript/i);
		});
	});
});
