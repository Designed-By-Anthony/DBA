import {
	type AutomationRow,
	activities,
	automations,
	type Database,
	getDb,
	leads,
	notifications,
	withTenantContext,
} from "@dba/database";
import { and, eq } from "drizzle-orm";
import { sendProspectEmailFromTemplate } from "@/lib/prospect-email";
import type { AutomationTrigger } from "./types";

/** JSONB action shape from `automations.action` (may include legacy / DB-only kinds). */
type AutomationEngineAction = {
	type: string;
	payload?: Record<string, unknown>;
};

type TenantTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Automations Core Engine
 * Listens to lifecycle events and executes "If X -> Then Y" logic.
 */
export async function processAutomations(
	agencyId: string,
	prospectId: string,
	trigger: AutomationTrigger,
	triggerData: Record<string, unknown> = {},
): Promise<void> {
	try {
		const db = getDb();
		if (!db) return;

		await withTenantContext(db, agencyId, async (tx) => {
			// 1. Load active automation rules for this tenant matching the trigger
			const rules = await tx
				.select()
				.from(automations)
				.where(
					and(
						eq(automations.tenantId, agencyId),
						eq(automations.isActive, true),
						eq(automations.trigger, trigger as AutomationRow["trigger"]),
					),
				);

			if (rules.length === 0) return;

			// 2. Process all triggered actions contextually
			for (const rule of rules) {
				const ruleName = rule.name || rule.id;
				await executeRuleAction(
					tx,
					agencyId,
					prospectId,
					rule.action as unknown as AutomationEngineAction,
					triggerData,
					ruleName,
				);
			}
		});
	} catch (err) {
		console.error(
			`[Automations] Engine evaluation failed for prospect ${prospectId}:`,
			err,
		);
	}
}

/**
 * Executes a single automation action
 */
async function executeRuleAction(
	db: TenantTx,
	agencyId: string,
	prospectId: string,
	action: AutomationEngineAction,
	contextData: Record<string, unknown>,
	ruleName: string,
) {
	try {
		switch (action.type) {
			case "add_tag": {
				const tag = String(action.payload?.tag || "");
				if (!tag) break;

				// Get current lead
				const lead = await db
					.select()
					.from(leads)
					.where(
						and(eq(leads.tenantId, agencyId), eq(leads.prospectId, prospectId)),
					)
					.limit(1);

				if (lead.length === 0) break;

				const currentTags = Array.isArray(lead[0].tags) ? lead[0].tags : [];
				const updatedTags = Array.from(new Set([...currentTags, tag]));

				// Update tags using JSONB operations
				await db
					.update(leads)
					.set({
						tags: updatedTags,
						updatedAt: new Date().toISOString(),
					})
					.where(
						and(eq(leads.tenantId, agencyId), eq(leads.prospectId, prospectId)),
					);

				await logAutomationActivity(
					db,
					agencyId,
					prospectId,
					ruleName,
					`Added tag: ${tag}`,
				);
				break;
			}

			case "change_status": {
				const newStatus = String(action.payload?.status || "");
				if (!newStatus) break;

				await db
					.update(leads)
					.set({
						status: newStatus,
						updatedAt: new Date().toISOString(),
					})
					.where(
						and(eq(leads.tenantId, agencyId), eq(leads.prospectId, prospectId)),
					);

				await logAutomationActivity(
					db,
					agencyId,
					prospectId,
					ruleName,
					`Changed status to: ${newStatus}`,
				);
				break;
			}

			case "create_task": {
				const title = String(action.payload?.title || "System Task");
				await logAutomationActivity(
					db,
					agencyId,
					prospectId,
					ruleName,
					`Skipped task creation: ${title}`,
				);
				break;
			}

			case "send_email": {
				const subject = String(action.payload?.subject || "Hello");
				const bodyHtml = String(
					action.payload?.bodyHtml ||
						action.payload?.body ||
						"<p>Hello {{name}},</p>",
				);

				const result = await sendProspectEmailFromTemplate({
					agencyId,
					prospectId,
					subject,
					bodyHtml,
				});

				await logAutomationActivity(
					db,
					agencyId,
					prospectId,
					ruleName,
					result.ok
						? `Email sent: ${subject}`
						: `Email failed: ${result.error || "unknown"}`,
				);
				break;
			}

			case "send_notification": {
				const title = String(action.payload?.title || "Notification");
				const body = String(action.payload?.body || "");

				await db.insert(notifications).values({
					tenantId: agencyId,
					title,
					body,
					type: "lead",
					referenceId: prospectId,
					referenceType: "lead",
					isRead: false,
					createdAt: new Date().toISOString(),
				});

				await logAutomationActivity(
					db,
					agencyId,
					prospectId,
					ruleName,
					`Sent notification: ${title}`,
				);
				break;
			}

			default:
				console.warn(`[Automations] Unrecognized action type: ${action.type}`);
		}
	} catch (err) {
		console.error(
			`[Automations] Failed to execute action ${action.type}:`,
			err,
		);
	}
}

/**
 * Logs automation activity to the activities table
 */
async function logAutomationActivity(
	db: TenantTx,
	agencyId: string,
	prospectId: string,
	ruleName: string,
	detail: string,
) {
	try {
		const now = new Date().toISOString();
		await db.insert(activities).values({
			tenantId: agencyId,
			leadId: prospectId,
			type: "note_added",
			title: `⚡ Workflow Executed: ${ruleName}`,
			description: detail,
			metadata: { isAutomated: true },
			createdAt: now,
		});
	} catch (err) {
		console.error("[Automations] Failed to log activity:", err);
	}
}
