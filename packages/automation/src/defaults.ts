/**
 * Per-vertical default automation rules (the "factory rules").
 *
 * These ship with every tenant. Tenants can override them by inserting a
 * row into the SQL `automations` table with the same `(trigger, name)` —
 * the engine's `mergeRules` prefers SQL over defaults.
 *
 * These rules are vertical-scoped so the Chameleon UI and the engine stay
 * aligned: a restaurant tenant never sees the agency's "audit → email report"
 * rule, and a roofer never sees the agency rule either.
 */
import type { AutomationRule } from "./types";

/**
 * Build the full set of factory rules for a tenant. Caller merges these with
 * whatever it has loaded from SQL via `runAutomations({ defaultRules })`.
 */
export function factoryRules(tenantId: string): AutomationRule[] {
	return [
		// ── Agency ──────────────────────────────────────────────────────
		{
			id: `factory::agency::audit_report`,
			tenantId,
			name: "Agency — email Lighthouse report on audit completion",
			isActive: true,
			trigger: "audit_completed",
			verticalScope: "agency",
			condition: {},
			action: {
				type: "send_email",
				payload: {
					subject: "Your Lighthouse audit is ready",
					bodyHtml:
						"<p>Your Lighthouse audit just finished. View the full report: {{auditUrl}}</p>",
				},
			},
		},

		// ── Service Pro (the "Roofer" Special) ──────────────────────────
		{
			id: `factory::service_pro::speed_to_lead_sms`,
			tenantId,
			name: "Service Pro — SMS dispatch on new lead",
			isActive: true,
			trigger: "lead_created",
			verticalScope: "service_pro",
			condition: {},
			action: {
				type: "send_sms",
				payload: {
					body: "New lead: {{lead.name}} — {{lead.phone}}. Hit them back in 5 min to win the job.",
				},
			},
		},
		{
			id: `factory::service_pro::review_ask`,
			tenantId,
			name: "Service Pro — request Google review on job completion",
			isActive: true,
			trigger: "job_finished",
			verticalScope: "service_pro",
			condition: {},
			action: {
				type: "send_email",
				payload: {
					subject: "Quick favor — a 60-second Google review?",
					bodyHtml:
						"<p>Hey {{lead.name}}, thanks for letting us out to your place. If we earned it, a Google review would mean the world.</p>",
				},
			},
		},

		// ── Restaurant (the "315-Flora" Special) ────────────────────────
		{
			id: `factory::restaurant::new_order_ack`,
			tenantId,
			name: "Restaurant — acknowledge new order via SMS",
			isActive: true,
			trigger: "lead_created",
			verticalScope: "restaurant",
			condition: {},
			action: {
				type: "send_sms",
				payload: {
					body: "Thanks, {{lead.name}}! Your order is in — we'll text again when it's ready.",
				},
			},
		},

		// ── Retail / Florist ────────────────────────────────────────────
		{
			id: `factory::florist::welcome_email`,
			tenantId,
			name: "Retail — welcome email on first capture",
			isActive: true,
			trigger: "lead_created",
			verticalScope: "florist",
			condition: {},
			action: {
				type: "send_email",
				payload: {
					subject: "Welcome — here's 10% off your first order",
					bodyHtml:
						"<p>Hi {{lead.name}}, thanks for stopping by. Use <b>WELCOME10</b> for 10% off your next order.</p>",
				},
			},
		},
	];
}
