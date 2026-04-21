describe("Preview — customer web viewer", () => {
	it("demo preview renders without crashing", () => {
		cy.request({ url: "/preview/demo", failOnStatusCode: false }).then((res) => {
			expect(res.status).to.not.eq(500);
		});
		cy.visit("/preview/demo");
		cy.assertNoAppError();
	});

	it("unknown customer returns 404-ish experience (not 500)", () => {
		cy.request({
			url: "/preview/this_customer_should_not_exist_123",
			failOnStatusCode: false,
		}).then((res) => {
			expect(res.status).to.not.eq(500);
		});
		cy.visit("/preview/this_customer_should_not_exist_123");
		cy.title().should("match", /404|not found|preview|viewer/i);
	});
});
