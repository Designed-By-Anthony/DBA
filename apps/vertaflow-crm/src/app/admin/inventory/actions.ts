"use server";

import { auth } from "@clerk/nextjs/server";
import {
	getDb,
	type InventoryItemRow,
	inventoryItems,
	withTenantContext,
} from "@dba/database";
import { and, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createItemSchema = z.object({
	name: z.string().min(1).max(200),
	sku: z.string().max(100).optional(),
	barcode: z.string().max(100).optional(),
	description: z.string().max(2000).optional(),
	stockType: z.enum(["stock", "non_stock", "special_order"]).default("stock"),
	stockCount: z.number().int().min(0).default(0),
	lowStockThreshold: z.number().int().min(0).default(5),
	costOfGoodsCents: z.number().int().min(0).default(0),
	imageUrl: z.string().url().optional(),
});

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

export async function createInventoryItem(
	data: z.infer<typeof createItemSchema>,
) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = createItemSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [item] = await tx
			.insert(inventoryItems)
			.values({
				tenantId: orgId,
				...parsed,
				isActive: true,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		revalidatePath("/admin/inventory");
		return item;
	});
}

export async function updateInventoryItem(
	itemId: string,
	data: Partial<z.infer<typeof createItemSchema>>,
) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [item] = await tx
			.update(inventoryItems)
			.set({
				...data,
				updatedAt: new Date().toISOString(),
			})
			.where(
				and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, orgId)),
			)
			.returning();

		revalidatePath("/admin/inventory");
		return item;
	});
}

export async function deleteInventoryItem(itemId: string) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		await tx
			.update(inventoryItems)
			.set({ isActive: false, updatedAt: new Date().toISOString() })
			.where(
				and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, orgId)),
			);

		revalidatePath("/admin/inventory");
	});
}

export async function listInventoryItems(
	search?: string,
): Promise<InventoryItemRow[]> {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const conditions = [
			eq(inventoryItems.tenantId, orgId),
			eq(inventoryItems.isActive, true),
		];

		if (search) {
			conditions.push(ilike(inventoryItems.name, `%${search}%`));
		}

		return tx
			.select()
			.from(inventoryItems)
			.where(and(...conditions))
			.orderBy(inventoryItems.name);
	});
}

export async function getInventoryItem(
	itemId: string,
): Promise<InventoryItemRow | null> {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [item] = await tx
			.select()
			.from(inventoryItems)
			.where(
				and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, orgId)),
			)
			.limit(1);

		return item ?? null;
	});
}
