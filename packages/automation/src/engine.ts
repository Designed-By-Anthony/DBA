/**
 * Augusta Automation Engine — runtime.
 *
 * Generic rules runner: loads tenant-scoped rules from SQL (`automations`
 * table in @dba/database), validates each rule's condition + action JSONB
 * with Zod, evaluates the condition, then hands the rule to a caller-provided
 * action handler (so we don't bake Resend/Twilio into this package).
 */

import { automations, getDb } from "@dba/database";
import type { VerticalId } from "@dba/ui/vertical-config";
import { and, eq } from "drizzle-orm";
import { evaluateCondition } from "./condition";
import {
	type AutomationAction,
	type AutomationEvent,
	type AutomationRule,
	type AutomationRunOutcome,
	type AutomationTrigger,
	automationActionSchema,
	automationConditionSchema,
	automationEventSchema,
	automationRuleSchema,
	automationTriggerSchema,
} from "./types";

export type ActionHandlerContext = {
	rule: AutomationRule;
	event: AutomationEvent;
};

/** Caller supplies one handler per action type — keeps this package transport-free. */
export type ActionHandlers = {
	[K in AutomationAction["type"]]?: (
		action: Extract<AutomationAction, { type: K }>,
		ctx: ActionHandlerContext,
	) => Promise<{ ok: true; detail?: string } | { ok: false; error: string }>;
};

export type RunAutomationsOptions = {
	event: AutomationEvent;
	handlers: ActionHandlers;
	/**
	 * Optional: per-vertical default rules baked into code (see defaults.ts).
	 * Merged with SQL rules at run time; dedup'd by `(name, trigger)` in favor
	 * of SQL so tenants can override factory rules.
	 */
	defaultRules?: AutomationRule[];
};

/**
 * Load active rules for a tenant from SQL. Invalid rows (JSONB failed Zod)
 * are dropped with a console.warn — so a bad hand-edited row can't crash the
 * entire pipeline. Tenant-scoping is non-optional (Zero-Trust guardrail).
 */
export async function loadActiveRules(
	tenantId: string,
	trigger: AutomationTrigger,
): Promise<AutomationRule[]> {
	const db = getDb();
	if (!db) return [];
	const rows = await db
		.select()
		.from(automations)
		.where(
			and(
				eq(automations.tenantId, tenantId),
				eq(automations.isActive, true),
				eq(automations.trigger, trigger as any),
			),
		);

	const out: AutomationRule[] = [];
	for (const r of rows) {
		const parsed = automationRuleSchema.safeParse({
			id: r.id,
			tenantId: r.tenantId,
			name: r.name,
			isActive: r.isActive,
			trigger: r.trigger,
			condition: r.condition ?? {},
			action: r.action,
			verticalScope: (r.metadata as { verticalScope?: VerticalId })
				?.verticalScope,
		});
		if (parsed.success) {
			out.push(parsed.data);
		} else {
			console.warn(
				`[automation] dropping invalid rule ${r.id}`,
				parsed.error.flatten(),
			);
		}
	}
	return out;
}

function mergeRules(
	sqlRules: AutomationRule[],
	defaults: AutomationRule[],
): AutomationRule[] {
	const keyOf = (r: AutomationRule) => `${r.trigger}|${r.name.toLowerCase()}`;
	const seen = new Set(sqlRules.map(keyOf));
	const out = [...sqlRules];
	for (const d of defaults) {
		if (!seen.has(keyOf(d))) out.push(d);
	}
	return out;
}

/**
 * Main entry point — load + evaluate + execute.
 * Returns the per-rule outcomes so the caller can log an audit trail.
 */
export async function runAutomations(
	opts: RunAutomationsOptions,
): Promise<AutomationRunOutcome[]> {
	const event = automationEventSchema.parse(opts.event);

	const sqlRules = await loadActiveRules(event.tenantId, event.trigger);

	// Filter factory defaults to the event's vertical if declared.
	const defaults = (opts.defaultRules ?? []).filter((r) => {
		if (r.trigger !== event.trigger) return false;
		if (!r.verticalScope) return true;
		return event.vertical ? r.verticalScope === event.vertical : true;
	});

	const rules = mergeRules(sqlRules, defaults);
	if (rules.length === 0) return [];

	const outcomes: AutomationRunOutcome[] = [];
	for (const rule of rules) {
		try {
			// Re-validate condition + action with Zod to be sure (defence in depth).
			const cond = automationConditionSchema.safeParse(rule.condition);
			const condition = cond.success ? cond.data : {};
			const passes = evaluateCondition(condition, event);
			if (!passes) {
				outcomes.push({
					ruleId: rule.id,
					ruleName: rule.name,
					skipped: "condition_not_met",
				});
				continue;
			}

			const parsedAction = automationActionSchema.parse(rule.action);
			const handler = opts.handlers[parsedAction.type];
			if (!handler) {
				outcomes.push({
					ruleId: rule.id,
					ruleName: rule.name,
					skipped: "handler_missing",
				});
				continue;
			}

			// `handler` is the union — we intentionally narrow via the discriminant.
			const result = await (
				handler as (
					a: AutomationAction,
					c: ActionHandlerContext,
				) => Promise<
					{ ok: true; detail?: string } | { ok: false; error: string }
				>
			)(parsedAction, { rule, event });

			if (result.ok) {
				outcomes.push({
					ruleId: rule.id,
					ruleName: rule.name,
					ok: true,
					detail: result.detail,
				});
			} else {
				outcomes.push({
					ruleId: rule.id,
					ruleName: rule.name,
					ok: false,
					error: result.error,
				});
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "unknown_error";
			console.error(
				`[automation] rule ${rule.id} (${rule.name}) crashed:`,
				err,
			);
			outcomes.push({
				ruleId: rule.id,
				ruleName: rule.name,
				ok: false,
				error: msg,
			});
		}
	}

	return outcomes;
}

export { automationTriggerSchema };
