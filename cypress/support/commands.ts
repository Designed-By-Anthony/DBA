/* eslint-disable @typescript-eslint/no-namespace */

// ---------------------------------------------------------------------------
// Mock data fixtures reused across portal tests
// ---------------------------------------------------------------------------
const defaultPortalData = {
	prospect: {
		name: "Jane Smith",
		company: "Smith Plumbing",
		status: "dev",
		onboarding: {
			contractSigned: true,
			downPaymentReceived: true,
			logoUploaded: false,
			photosUploaded: false,
			serviceDescriptions: false,
			domainAccess: false,
		},
		driveFolderUrl: "https://drive.google.com/test",
		contractDocUrl: "https://docs.google.com/test",
		pricingTier: "hosting",
		projectNotes:
			"We have finished the homepage and are now working on the services page.",
		contractSigned: true,
		contractStatus: "signed",
		fcmToken: null,
	},
	milestones: [
		{ label: "Initial Inquiry", completed: true, current: false },
		{ label: "Discovery Call", completed: true, current: false },
		{ label: "Proposal & Contract", completed: true, current: false },
		{ label: "Building Your Website", completed: false, current: true },
		{ label: "Website Live!", completed: false, current: false },
	],
	tickets: [
		{
			id: "ticket-abc123",
			subject: "Question about logo sizing",
			status: "open",
			createdAt: new Date().toISOString(),
		},
	],
};

const defaultTicketData = {
	tickets: [
		{
			id: "ticket-001",
			subject: "Logo upload issue",
			description: "I cannot figure out how to upload my logo.",
			status: "open",
			priority: "medium",
			adminReply: null,
			messages: [
				{
					id: "msg-001",
					from: "client",
					content: "I cannot figure out how to upload my logo.",
					createdAt: new Date().toISOString(),
				},
			],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: "ticket-002",
			subject: "Change the hero headline",
			description: "Please update the hero text.",
			status: "resolved",
			priority: "low",
			adminReply: "Done! The headline has been updated.",
			messages: [
				{
					id: "msg-002",
					from: "client",
					content: "Please update the hero text.",
					createdAt: new Date().toISOString(),
				},
				{
					id: "msg-003",
					from: "admin",
					content: "Done! The headline has been updated.",
					createdAt: new Date().toISOString(),
				},
			],
			createdAt: new Date(Date.now() - 86400000).toISOString(),
			updatedAt: new Date().toISOString(),
		},
	],
};

// ---------------------------------------------------------------------------
// Custom Cypress commands
// ---------------------------------------------------------------------------

declare global {
	namespace Cypress {
		interface Chainable {
			/** Assert the page does NOT show "Application Error" */
			assertNoAppError(): Chainable<void>;
			/** Intercept /api/portal/data with mock portal data */
			mockPortalData(
				overrides?: Record<string, unknown>,
			): Chainable<void>;
			/** Intercept /api/portal/tickets with mock ticket data */
			mockTickets(): Chainable<void>;
		}
	}
}

Cypress.Commands.add("assertNoAppError", () => {
	cy.contains("Application Error").should("not.exist");
});

Cypress.Commands.add(
	"mockPortalData",
	(overrides?: Record<string, unknown>) => {
		const data = overrides
			? { ...defaultPortalData, ...overrides }
			: defaultPortalData;
		cy.intercept("GET", "/api/portal/data", {
			statusCode: 200,
			body: data,
		}).as("portalData");
	},
);

Cypress.Commands.add("mockTickets", () => {
	cy.intercept("GET", "/api/portal/tickets", {
		statusCode: 200,
		body: defaultTicketData,
	}).as("getTickets");
	cy.intercept("POST", "/api/portal/tickets", {
		statusCode: 200,
		body: { success: true, ticketId: "ticket-new" },
	}).as("postTicket");
});
