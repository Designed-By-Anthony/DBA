"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb, taxRates, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

const taxRateSchema = z.object({
	name: z.string().min(1).max(100),
	rateBps: z.number().int().min(0).max(10000),
	isDefault: z.boolean().default(false),
});

export async function createTaxRate(data: z.infer<typeof taxRateSchema>) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = taxRateSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		// If setting as default, clear existing default
		if (parsed.isDefault) {
			await tx
				.update(taxRates)
				.set({ isDefault: false, updatedAt: now })
				.where(and(eq(taxRates.tenantId, orgId), eq(taxRates.isDefault, true)));
		}

		const [rate] = await tx
			.insert(taxRates)
			.values({
				tenantId: orgId,
				...parsed,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		revalidatePath("/admin/settings");
		return rate;
	});
}

export async function listTaxRates() {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) =>
		tx
			.select()
			.from(taxRates)
			.where(and(eq(taxRates.tenantId, orgId), eq(taxRates.isActive, true))),
	);
}

/** Get the default tax rate for calculations. Returns rate in basis points. */
export async function getDefaultTaxRate(): Promise<number> {
	const { orgId } = await auth();
	if (!orgId) return 0;
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [rate] = await tx
			.select({ rateBps: taxRates.rateBps })
			.from(taxRates)
			.where(
				and(
					eq(taxRates.tenantId, orgId),
					eq(taxRates.isDefault, true),
					eq(taxRates.isActive, true),
				),
			)
			.limit(1);

		return rate?.rateBps ?? 0;
	});
}
