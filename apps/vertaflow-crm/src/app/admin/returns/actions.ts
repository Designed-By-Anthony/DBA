"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb, orderItems, returns, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { incrementStock } from "@/lib/inventory";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

const returnSchema = z.object({
	orderId: z.string().uuid(),
	reason: z.string().max(1000).optional(),
	returnType: z.enum(["refund", "exchange", "store_credit"]).default("refund"),
	refundAmountCents: z.number().int().min(0),
	restockItems: z.boolean().default(false),
});

export async function createReturn(data: z.infer<typeof returnSchema>) {
	const { orgId, userId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = returnSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [ret] = await tx
			.insert(returns)
			.values({
				tenantId: orgId,
				orderId: parsed.orderId,
				reason: parsed.reason,
				returnType: parsed.returnType,
				refundAmountCents: parsed.refundAmountCents,
				restocked: parsed.restockItems,
				processedBy: userId,
				createdAt: now,
			})
			.returning();

		// Restock inventory if requested
		if (parsed.restockItems) {
			const items = await tx
				.select()
				.from(orderItems)
				.where(
					and(
						eq(orderItems.orderId, parsed.orderId),
						eq(orderItems.tenantId, orgId),
					),
				);

			for (const item of items) {
				if (item.inventoryItemId) {
					await incrementStock(tx, orgId, item.inventoryItemId, item.quantity);
				}
			}
		}

		revalidatePath("/admin/returns");
		revalidatePath("/admin/inventory");
		return ret;
	});
}
