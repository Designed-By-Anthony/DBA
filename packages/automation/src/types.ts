/**
 * Augusta Automation Engine — types.
 *
 * IF (event) AND (condition) THEN (action). The triggers, condition operators,
 * and action shapes are all Zod-schema'd so callers get strict types and the
 * SQL JSONB columns (`automations.condition` + `automations.action`) are
 * validated at read and write time.
 */

import { VERTICAL_IDS } from "@dba/ui/vertical-config";
import { z } from "zod";

/** Lifecycle events the engine listens for. */
export const AUTOMATION_TRIGGERS = [
	"lead_created",
	"prospect_status_changed",
	"activity_added",
	"ticket_created",
	"form_submission",
	"audit_completed",
	"job_finished",
	"payment_received",
] as const;
export const automationTriggerSchema = z.enum(AUTOMATION_TRIGGERS);
export type AutomationTrigger = z.infer<typeof automationTriggerSchema>;

/** Action kinds the engine knows how to run. */
export const AUTOMATION_ACTION_TYPES = [
	"send_email",
	"send_sms",
	"add_tag",
	"change_status",
	"create_activity",
	"assign_owner",
] as const;

const sendEmailAction = z.object({
	type: z.literal("send_email"),
	payload: z.object({
		subject: z.string().min(1),
		bodyHtml: z.string().min(1),
		templateVars: z.record(z.string(), z.string()).optional(),
		/** Optional override; otherwise routed to the lead's email. */
		to: z.string().email().optional(),
	}),
});

const sendSmsAction = z.object({
	type: z.literal("send_sms"),
	payload: z.object({
		body: z.string().min(1).max(1600),
		/** Optional E.164; defaults to the lead's phone (if present). */
		to: z
			.string()
			.regex(/^\+[1-9]\d{6,14}$/)
			.optional(),
	}),
});

const addTagAction = z.object({
	type: z.literal("add_tag"),
	payload: z.object({ tag: z.string().min(1).max(40) }),
});

const changeStatusAction = z.object({
	type: z.literal("change_status"),
	payload: z.object({ status: z.string().min(1).max(40) }),
});

const createActivityAction = z.object({
	type: z.literal("create_activity"),
	payload: z.object({
		title: z.string().min(1).max(160),
		description: z.string().max(2000).optional(),
	}),
});

const assignOwnerAction = z.object({
	type: z.literal("assign_owner"),
	payload: z.object({ userId: z.string().min(1) }),
});

export const automationActionSchema = z.discriminatedUnion("type", [
	sendEmailAction,
	sendSmsAction,
	addTagAction,
	changeStatusAction,
	createActivityAction,
	assignOwnerAction,
]);
export type AutomationAction = z.infer<typeof automationActionSchema>;

/**
 * Condition DSL. A condition is a small set of predicates that are ALL true
 * (logical AND) for the action to fire. Supported predicates:
 *
 *  - `equals`    — deep-ish equality on a JSON pointer (dot path) in the event.
 *  - `contains`  — case-insensitive substring (strings) or includes (arrays).
 *  - `gt` / `lt` — numeric comparisons.
 *  - `in`        — value is one of the given list.
 *
 * Example (service_pro, "only fire SMS for hot leads"):
 *   { predicates: [{ path: "event.lead.metadata.seoLeadScore", gt: 70 }] }
 */
export const automationConditionSchema = z
	.object({
		predicates: z
			.array(
				z
					.object({
						path: z.string().min(1),
						equals: z.unknown().optional(),
						contains: z.union([z.string(), z.number()]).optional(),
						gt: z.number().optional(),
						lt: z.number().optional(),
						in: z.array(z.unknown()).optional(),
					})
					.refine(
						(p) =>
							"equals" in p ||
							p.contains !== undefined ||
							p.gt !== undefined ||
							p.lt !== undefined ||
							p.in !== undefined,
						{
							message:
								"predicate needs one of: equals | contains | gt | lt | in",
						},
					),
			)
			.min(1),
	})
	.partial()
	.strict();

export type AutomationCondition = z.infer<typeof automationConditionSchema>;

/** Canonical rule row (JSONB-validated). */
export const automationRuleSchema = z.object({
	id: z.string(),
	tenantId: z.string().min(1),
	name: z.string().min(1),
	isActive: z.boolean(),
	trigger: automationTriggerSchema,
	condition: automationConditionSchema.or(z.object({}).strict()),
	action: automationActionSchema,
	/** For per-vertical factory rules + observability. */
	verticalScope: z.enum(VERTICAL_IDS).optional(),
});
export type AutomationRule = z.infer<typeof automationRuleSchema>;

/**
 * Event payload handed to the engine on `runAutomations(event)`. Each trigger
 * has different minimum fields; the engine passes the raw event into the
 * condition DSL via JSON pointer so Zod-validated shapes can still include
 * arbitrary vertical metadata.
 */
export const automationEventSchema = z
	.object({
		trigger: automationTriggerSchema,
		tenantId: z.string().min(1),
		prospectId: z.string().optional(),
		leadId: z.string().optional(),
		/** Vertical the event was raised under — drives per-vertical defaults. */
		vertical: z.enum(VERTICAL_IDS).optional(),
		data: z.record(z.string(), z.unknown()).default({}),
	})
	.strict();
export type AutomationEvent = z.infer<typeof automationEventSchema>;

/** Outcome of running a single rule. */
export type AutomationRunOutcome =
	| { ruleId: string; ruleName: string; ok: true; detail?: string }
	| { ruleId: string; ruleName: string; ok: false; error: string }
	| {
			ruleId: string;
			ruleName: string;
			skipped: "condition_not_met" | "handler_missing";
	  };
