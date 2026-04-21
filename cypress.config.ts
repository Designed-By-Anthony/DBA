export default {
	projectId: "9ob41r",
	e2e: {
		baseUrl: "http://localhost:3000",
		specPattern: "cypress/e2e/**/*.cy.ts",
		supportFile: "cypress/support/e2e.ts",
		video: false,
		screenshotOnRunFailure: true,
		defaultCommandTimeout: 15000,
		requestTimeout: 15000,
		responseTimeout: 30000,
		retries: {
			runMode: 2,
			openMode: 0,
		},
		env: {
			LEAD_WEBHOOK_SECRET: "dba-lead-hook-2026",
			MARKETING_URL: "http://localhost:4321",
			LIGHTHOUSE_URL: "http://localhost:3100",
		},
	},
};
