/**
 * WebMCP implementation - Expose site tools to AI agents via the browser
 * https://webmachinelearning.github.io/webmcp/
 * https://developer.chrome.com/blog/webmcp-epp
 */

interface WebMCPContext {
	name: string;
	description: string;
	inputSchema: object;
	execute: (input: unknown) => Promise<unknown>;
}

declare global {
	interface Window {
		modelContext?: {
			provideContext: (context: WebMCPContext) => void;
		};
	}
}

/**
 * Initialize WebMCP to expose site tools to AI agents
 */
export function initWebMCP(): void {
	if (typeof window === "undefined" || !window.modelContext) {
		// WebMCP not available - this is fine, agents will use other discovery methods
		return;
	}

	// Tool: Navigate to contact form
	window.modelContext.provideContext({
		name: "contact_us",
		description:
			"Navigate to the contact form to request web design services, SEO optimization, or custom web application development from ANTHONY. in the Mohawk Valley.",
		inputSchema: {
			type: "object",
			properties: {
				service_type: {
					type: "string",
					enum: ["web_design", "seo", "custom_app", "audit"],
					description: "Type of service the user is interested in",
				},
			},
		},
		execute: async (input: unknown) => {
			const params = input as { service_type?: string };
			const serviceParam = params.service_type
				? `?service=${encodeURIComponent(params.service_type)}`
				: "";
			window.location.href = `https://designedbyanthony.com/contact${serviceParam}`;
			return { success: true, redirected_to: "/contact" };
		},
	});

	// Tool: Request website audit
	window.modelContext.provideContext({
		name: "request_audit",
		description:
			"Request a free comprehensive website audit including Core Web Vitals, on-page SEO, accessibility, best practices, and performance analysis.",
		inputSchema: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The website URL to audit",
					format: "uri",
				},
				email: {
					type: "string",
					description: "Email address to receive the audit report",
					format: "email",
				},
				name: {
					type: "string",
					description: "Contact name",
				},
			},
			required: ["url", "email"],
		},
		execute: async (input: unknown) => {
			const params = input as { url: string; email: string; name?: string };
			// Navigate to lighthouse with pre-filled data
			const queryParams = new URLSearchParams();
			queryParams.set("url", params.url);
			queryParams.set("email", params.email);
			if (params.name) queryParams.set("name", params.name);
			window.location.href = `https://designedbyanthony.com/lighthouse?${queryParams.toString()}`;
			return {
				success: true,
				redirected_to: "/lighthouse",
				message: "Navigating to audit form",
			};
		},
	});

	// Tool: View services
	window.modelContext.provideContext({
		name: "view_services",
		description:
			"View the complete list of web design and digital marketing services offered by ANTHONY.",
		inputSchema: {
			type: "object",
			properties: {},
		},
		execute: async () => {
			window.location.href = "https://designedbyanthony.com/services";
			return { success: true, redirected_to: "/services" };
		},
	});

	// Tool: Submit lead form
	window.modelContext.provideContext({
		name: "submit_lead",
		description:
			"Submit a lead form directly via the Convex webhook for web design services or custom development projects.",
		inputSchema: {
			type: "object",
			properties: {
				name: { type: "string", description: "Full name" },
				email: {
					type: "string",
					description: "Email address",
					format: "email",
				},
				message: { type: "string", description: "Project details" },
				phone: { type: "string", description: "Phone (optional)" },
				lead_source: {
					type: "string",
					description: "Source of the lead",
					default: "ai_agent",
				},
			},
			required: ["name", "email", "message"],
		},
		execute: async (input: unknown) => {
			const params = input as {
				name: string;
				email: string;
				message: string;
				phone?: string;
				lead_source?: string;
			};

			try {
				const response = await fetch(
					"https://tremendous-emu-522.convex.site/webhook/lead",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							name: params.name,
							email: params.email,
							message: params.message,
							phone: params.phone || "",
							lead_source: params.lead_source || "ai_agent",
							page_url: window.location.href,
							page_title: document.title,
						}),
					},
				);

				if (response.ok) {
					return {
						success: true,
						message: "Lead submitted successfully",
					};
				}
				throw new Error("Failed to submit lead");
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
					fallback_url: "https://designedbyanthony.com/contact",
				};
			}
		},
	});
}
