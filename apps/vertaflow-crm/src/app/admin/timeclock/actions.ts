"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb, timeEntries, withTenantContext } from "@dba/database";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

/** Clock in to a job / appointment. */
export async function clockIn(data: {
	appointmentId?: string;
	prospectId?: string;
	notes?: string;
}) {
	const { orgId, userId } = await auth();
	if (!orgId || !userId) throw new Error("Unauthorized");
	const db = requireDb();

	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		// Check for already clocked-in entry
		const [existing] = await tx
			.select()
			.from(timeEntries)
			.where(
				and(
					eq(timeEntries.tenantId, orgId),
					eq(timeEntries.userId, userId),
					isNull(timeEntries.clockOut),
				),
			)
			.limit(1);

		if (existing) {
			throw new Error(
				"Already clocked in. Clock out first before starting a new entry.",
			);
		}

		const [entry] = await tx
			.insert(timeEntries)
			.values({
				tenantId: orgId,
				userId,
				appointmentId: data.appointmentId,
				prospectId: data.prospectId,
				clockIn: now,
				notes: data.notes,
				createdAt: now,
			})
			.returning();

		revalidatePath("/admin/timeclock");
		return entry;
	});
}

/** Clock out of the current running entry. */
export async function clockOut(entryId: string, notes?: string) {
	const { orgId, userId } = await auth();
	if (!orgId || !userId) throw new Error("Unauthorized");
	const db = requireDb();

	const now = new Date();
	const nowStr = now.toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [entry] = await tx
			.select()
			.from(timeEntries)
			.where(
				and(
					eq(timeEntries.id, entryId),
					eq(timeEntries.tenantId, orgId),
					eq(timeEntries.userId, userId),
				),
			)
			.limit(1);

		if (!entry) throw new Error("Time entry not found");
		if (entry.clockOut) throw new Error("Already clocked out");

		const durationMinutes = Math.round(
			(now.getTime() - new Date(entry.clockIn).getTime()) / 60000,
		);

		const [updated] = await tx
			.update(timeEntries)
			.set({
				clockOut: nowStr,
				durationMinutes,
				...(notes ? { notes } : {}),
			})
			.where(and(eq(timeEntries.id, entryId), eq(timeEntries.tenantId, orgId)))
			.returning();

		revalidatePath("/admin/timeclock");
		return updated;
	});
}

/** List time entries for the current tenant. */
export async function listTimeEntries() {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) =>
		tx
			.select()
			.from(timeEntries)
			.where(eq(timeEntries.tenantId, orgId))
			.orderBy(timeEntries.clockIn),
	);
}
