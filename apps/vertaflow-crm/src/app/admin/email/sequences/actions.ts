"use server";

import {
	type EmailSequenceRow,
	emailSequences,
	getDb,
	sequenceEnrollments,
	withTenantContext,
} from "@dba/database";
import { and, eq } from "drizzle-orm";
import { verifyAuth } from "@/app/admin/actions";
import { processEmailSequences } from "@/lib/email-sequence-processor";
import type { EmailSequenceDefinition, EmailSequenceStep } from "@/lib/types";

type EmailSequenceStepRow = {
	delayDays?: number;
	delayHours?: number;
	subject: string;
	bodyHtml: string;
};

function stepsFromDbJson(steps: unknown): EmailSequenceStep[] {
	if (!Array.isArray(steps)) return [];
	return steps.map((raw) => {
		const step = raw as EmailSequenceStepRow;
		const delayHours =
			typeof step.delayHours === "number"
				? step.delayHours
				: typeof step.delayDays === "number"
					? step.delayDays * 24
					: 24;
		return {
			delayHours,
			subject: String(step.subject ?? ""),
			bodyHtml: String(step.bodyHtml ?? ""),
		};
	});
}

function stepsToDbJson(steps: EmailSequenceStep[]): EmailSequenceRow["steps"] {
	return steps.map((s) => ({
		delayDays: Math.max(0, s.delayHours) / 24,
		subject: s.subject,
		bodyHtml: s.bodyHtml,
	}));
}

export async function listEmailSequences(): Promise<EmailSequenceDefinition[]> {
	const session = await verifyAuth();
	const db = getDb();
	if (!db) return [];

	return await withTenantContext(db, session.user.agencyId, async (tx) => {
		const rows = await tx
			.select()
			.from(emailSequences)
			.where(eq(emailSequences.tenantId, session.user.agencyId));

		return rows
			.map((r) => ({
				id: r.id,
				agencyId: r.tenantId,
				name: r.name,
				isActive: r.isActive ?? true,
				steps: stepsFromDbJson(r.steps),
				createdAt: r.createdAt || "",
				updatedAt: r.updatedAt || "",
			}))
			.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
	});
}

export async function createEmailSequence(input: {
	name: string;
	steps: EmailSequenceStep[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
	const session = await verifyAuth();
	const name = input.name?.trim();
	if (!name || !input.steps?.length) {
		return { success: false, error: "Name and at least one step are required" };
	}

	const db = getDb();
	if (!db) return { success: false, error: "Database not configured" };

	return await withTenantContext(db, session.user.agencyId, async (tx) => {
		const now = new Date().toISOString();

		const result = await tx
			.insert(emailSequences)
			.values({
				tenantId: session.user.agencyId,
				name,
				isActive: true,
				steps: stepsToDbJson(input.steps),
				createdAt: now,
				updatedAt: now,
			})
			.returning({ id: emailSequences.id });

		return { success: true, id: result[0]?.id };
	});
}

export async function updateEmailSequence(
	id: string,
	fields: Partial<Pick<EmailSequenceDefinition, "name" | "isActive" | "steps">>,
): Promise<{ success: boolean }> {
	const session = await verifyAuth();
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	await withTenantContext(db, session.user.agencyId, async (tx) => {
		const existing = await tx
			.select()
			.from(emailSequences)
			.where(
				and(
					eq(emailSequences.id, id),
					eq(emailSequences.tenantId, session.user.agencyId),
				),
			)
			.limit(1);

		if (existing.length === 0) throw new Error("Not found");

		const payload: Record<string, unknown> = {
			updatedAt: new Date().toISOString(),
		};
		if (fields.name !== undefined) payload.name = fields.name;
		if (fields.isActive !== undefined) payload.isActive = fields.isActive;
		if (fields.steps !== undefined) payload.steps = stepsToDbJson(fields.steps);

		await tx
			.update(emailSequences)
			.set(payload)
			.where(eq(emailSequences.id, id));
	});

	return { success: true };
}

export async function deleteEmailSequence(
	id: string,
): Promise<{ success: boolean }> {
	const session = await verifyAuth();
	const db = getDb();
	if (!db) throw new Error("Database not configured");

	await withTenantContext(db, session.user.agencyId, async (tx) => {
		await tx
			.delete(emailSequences)
			.where(
				and(
					eq(emailSequences.id, id),
					eq(emailSequences.tenantId, session.user.agencyId),
				),
			);
	});

	return { success: true };
}

export async function enrollProspectInSequence(
	prospectId: string,
	sequenceId: string,
): Promise<{ success: boolean; error?: string }> {
	const session = await verifyAuth();
	const db = getDb();
	if (!db) return { success: false, error: "Database not configured" };

	return await withTenantContext(db, session.user.agencyId, async (tx) => {
		// Verify sequence exists
		const seqRows = await tx
			.select()
			.from(emailSequences)
			.where(
				and(
					eq(emailSequences.id, sequenceId),
					eq(emailSequences.tenantId, session.user.agencyId),
				),
			)
			.limit(1);

		if (seqRows.length === 0)
			return { success: false, error: "Sequence not found" };
		const seq = seqRows[0];
		const steps = stepsFromDbJson(seq.steps);
		if (!steps.length)
			return { success: false, error: "Sequence has no steps" };

		// Check for existing active enrollment
		const existing = await tx
			.select()
			.from(sequenceEnrollments)
			.where(
				and(
					eq(sequenceEnrollments.tenantId, session.user.agencyId),
					eq(sequenceEnrollments.leadId, prospectId),
					eq(sequenceEnrollments.sequenceId, sequenceId),
					eq(sequenceEnrollments.status, "active"),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return { success: false, error: "Already enrolled in this sequence" };
		}

		const now = new Date();
		const firstDelayHours = steps[0].delayHours ?? 24;
		const nextRunAt = new Date(
			now.getTime() + firstDelayHours * 60 * 60 * 1000,
		);

		await tx.insert(sequenceEnrollments).values({
			tenantId: session.user.agencyId,
			leadId: prospectId,
			sequenceId,
			stepIndex: 0,
			nextRunAt: nextRunAt.toISOString(),
			status: "active",
			enrolledAt: now.toISOString(),
			updatedAt: now.toISOString(),
		});

		return { success: true };
	});
}

export async function runDueSequenceEmails(): Promise<{
	processed: number;
	sent: number;
	errors: string[];
}> {
	await verifyAuth();
	return processEmailSequences();
}
