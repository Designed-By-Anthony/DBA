"use server";

import { auth } from "@clerk/nextjs/server";
import {
	getDb,
	type OrderRow,
	orderItems,
	orders,
	withTenantContext,
} from "@dba/database";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { decrementStock, syncMenuAvailability } from "@/lib/inventory";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

const orderItemSchema = z.object({
	menuItemId: z.string().uuid().optional(),
	inventoryItemId: z.string().uuid().optional(),
	name: z.string().min(1),
	quantity: z.number().int().min(1),
	unitPriceCents: z.number().int().min(0),
	modifiers: z
		.array(z.object({ name: z.string(), priceCents: z.number() }))
		.default([]),
});

const createOrderSchema = z.object({
	orderType: z.enum([
		"dine_in",
		"takeout",
		"delivery",
		"retail_pos",
		"ecommerce",
		"catering",
	]),
	paymentMethod: z.enum(["card", "cash", "check", "gift_card", "split"]),
	prospectId: z.string().optional(),
	tableId: z.string().uuid().optional(),
	notes: z.string().optional(),
	items: z.array(orderItemSchema).min(1),
	tipAmountCents: z.number().int().min(0).default(0),
	cashTenderedCents: z.number().int().min(0).optional(),
	checkNumber: z.string().optional(),
});

export async function createOrder(data: z.infer<typeof createOrderSchema>) {
	const { orgId, userId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const parsed = createOrderSchema.parse(data);
	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		// Generate next order number
		const [latest] = await tx
			.select({ orderNumber: orders.orderNumber })
			.from(orders)
			.where(eq(orders.tenantId, orgId))
			.orderBy(desc(orders.createdAt))
			.limit(1);

		const num = latest
			? parseInt(latest.orderNumber.replace("ORD-", ""), 10) + 1
			: 1;
		const orderNumber = `ORD-${String(num).padStart(4, "0")}`;

		// Calculate totals
		const subtotalCents = parsed.items.reduce((sum, item) => {
			const modTotal = item.modifiers.reduce((ms, m) => ms + m.priceCents, 0);
			return sum + (item.unitPriceCents + modTotal) * item.quantity;
		}, 0);

		const taxCents = 0; // TODO: Apply tenant tax rate from tax_rates table
		const totalCents = subtotalCents + taxCents + parsed.tipAmountCents;

		const changeDueCents =
			parsed.paymentMethod === "cash" && parsed.cashTenderedCents
				? parsed.cashTenderedCents - totalCents
				: undefined;

		// Create order
		const [order] = await tx
			.insert(orders)
			.values({
				tenantId: orgId,
				orderNumber,
				prospectId: parsed.prospectId,
				status: "new",
				orderType: parsed.orderType,
				paymentMethod: parsed.paymentMethod,
				subtotalCents,
				taxCents,
				tipAmountCents: parsed.tipAmountCents,
				totalCents,
				cashTenderedCents: parsed.cashTenderedCents,
				changeDueCents,
				checkNumber: parsed.checkNumber,
				tableId: parsed.tableId,
				takenBy: userId,
				notes: parsed.notes,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		// Create order items & decrement stock
		for (const item of parsed.items) {
			const modTotal = item.modifiers.reduce((ms, m) => ms + m.priceCents, 0);
			const lineTotalCents = (item.unitPriceCents + modTotal) * item.quantity;

			await tx.insert(orderItems).values({
				tenantId: orgId,
				orderId: order.id,
				menuItemId: item.menuItemId,
				inventoryItemId: item.inventoryItemId,
				name: item.name,
				quantity: item.quantity,
				unitPriceCents: item.unitPriceCents,
				totalCents: lineTotalCents,
				modifiers: item.modifiers,
				createdAt: now,
			});

			// Decrement inventory stock
			if (item.inventoryItemId) {
				await decrementStock(tx, orgId, item.inventoryItemId, item.quantity);
				await syncMenuAvailability(tx, orgId, item.inventoryItemId);
			}
		}

		revalidatePath("/admin/pos");
		return order;
	});
}

export async function updateOrderStatus(
	orderId: string,
	status:
		| "new"
		| "preparing"
		| "ready"
		| "completed"
		| "cancelled"
		| "refunded",
) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const now = new Date().toISOString();
		const [order] = await tx
			.update(orders)
			.set({
				status,
				updatedAt: now,
				...(status === "completed" ? { completedAt: now, paidAt: now } : {}),
			})
			.where(and(eq(orders.id, orderId), eq(orders.tenantId, orgId)))
			.returning();

		revalidatePath("/admin/pos");
		return order;
	});
}

export async function listOrders(
	statusFilter?: string,
	limit: number = 50,
): Promise<OrderRow[]> {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const conditions = [eq(orders.tenantId, orgId)];

		if (statusFilter) {
			conditions.push(
				eq(
					orders.status,
					statusFilter as
						| "new"
						| "preparing"
						| "ready"
						| "completed"
						| "cancelled"
						| "refunded",
				),
			);
		}

		return tx
			.select()
			.from(orders)
			.where(and(...conditions))
			.orderBy(desc(orders.createdAt))
			.limit(limit);
	});
}
