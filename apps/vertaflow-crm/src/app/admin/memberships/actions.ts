"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb, memberships, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

const membershipSchema = z.object({
	prospectId: z.string(),
	name: z.string().min(1).max(200),
	priceCents: z.number().int().min(0),
	interval: z.enum(["week", "month", "quarter", "year"]).default("month"),
	startDate: z.string().min(1),
	endDate: z.string().optional(),
	stripeSubscriptionId: z.string().optional(),
});

export async function createMembership(data: z.infer<typeof membershipSchema>) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = membershipSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [membership] = await tx
			.insert(memberships)
			.values({
				tenantId: orgId,
				...parsed,
				status: "active",
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		revalidatePath("/admin/memberships");
		return membership;
	});
}

export async function updateMembershipStatus(
	membershipId: string,
	status: "active" | "paused" | "cancelled" | "expired",
) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [updated] = await tx
			.update(memberships)
			.set({ status, updatedAt: new Date().toISOString() })
			.where(
				and(eq(memberships.id, membershipId), eq(memberships.tenantId, orgId)),
			)
			.returning();

		revalidatePath("/admin/memberships");
		return updated;
	});
}

export async function listMemberships(prospectId?: string) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const conditions = [eq(memberships.tenantId, orgId)];
		if (prospectId) conditions.push(eq(memberships.prospectId, prospectId));

		return tx
			.select()
			.from(memberships)
			.where(and(...conditions))
			.orderBy(memberships.createdAt);
	});
}
