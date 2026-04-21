/**
 * Inventory Management — Core Logic
 *
 * Handles stock decrement, low-stock detection, and out-of-stock behavior.
 * Respects stock_type: 'stock' decrements, 'non_stock' skips, 'special_order' allows backorder.
 */

import { inventoryItems, itemVariants, menuItems } from "@dba/database";
import { and, eq, lte, sql } from "drizzle-orm";

/**
 * Accept any Drizzle query-runner (full Database OR a transaction object).
 * This keeps the inventory helpers callable from both contexts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = {
	select: any;
	update: any;
	insert: any;
	delete: any;
	execute: any;
} & Record<string, any>;

export type StockCheckResult = {
	available: boolean;
	currentStock: number;
	isLowStock: boolean;
	isOutOfStock: boolean;
	stockType: string;
};

/**
 * Check stock level for an inventory item.
 */
export async function checkStock(
	db: DB,
	tenantId: string,
	itemId: string,
): Promise<StockCheckResult> {
	const [item] = await db
		.select({
			stockCount: inventoryItems.stockCount,
			lowStockThreshold: inventoryItems.lowStockThreshold,
			stockType: inventoryItems.stockType,
		})
		.from(inventoryItems)
		.where(
			and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, tenantId)),
		)
		.limit(1);

	if (!item) {
		return {
			available: false,
			currentStock: 0,
			isLowStock: false,
			isOutOfStock: true,
			stockType: "stock",
		};
	}

	// non_stock items are always available (services, labor, etc.)
	if (item.stockType === "non_stock") {
		return {
			available: true,
			currentStock: 0,
			isLowStock: false,
			isOutOfStock: false,
			stockType: "non_stock",
		};
	}

	// special_order items are available but flagged differently
	if (item.stockType === "special_order") {
		return {
			available: true,
			currentStock: item.stockCount,
			isLowStock: item.stockCount <= item.lowStockThreshold,
			isOutOfStock: item.stockCount <= 0,
			stockType: "special_order",
		};
	}

	return {
		available: item.stockCount > 0,
		currentStock: item.stockCount,
		isLowStock: item.stockCount <= item.lowStockThreshold,
		isOutOfStock: item.stockCount <= 0,
		stockType: "stock",
	};
}

/**
 * Decrement stock after a sale.
 * Returns false if the item is out of stock (for 'stock' type items).
 * Non-stock items always succeed. Special order items always succeed but flag backorder.
 */
export async function decrementStock(
	db: DB,
	tenantId: string,
	itemId: string,
	quantity: number = 1,
	variantId?: string,
): Promise<{ success: boolean; newStock: number; isBackorder: boolean }> {
	// If there's a variant, decrement from variant stock
	if (variantId) {
		const result = await db
			.update(itemVariants)
			.set({
				stockCount: sql`GREATEST(${itemVariants.stockCount} - ${quantity}, 0)`,
				updatedAt: new Date().toISOString(),
			})
			.where(
				and(
					eq(itemVariants.id, variantId),
					eq(itemVariants.tenantId, tenantId),
				),
			)
			.returning({ stockCount: itemVariants.stockCount });

		return {
			success: true,
			newStock: result[0]?.stockCount ?? 0,
			isBackorder: (result[0]?.stockCount ?? 0) <= 0,
		};
	}

	// Check stock type first
	const check = await checkStock(db, tenantId, itemId);

	if (check.stockType === "non_stock") {
		return { success: true, newStock: 0, isBackorder: false };
	}

	if (check.stockType === "stock" && check.isOutOfStock) {
		return { success: false, newStock: 0, isBackorder: false };
	}

	const result = await db
		.update(inventoryItems)
		.set({
			stockCount: sql`GREATEST(${inventoryItems.stockCount} - ${quantity}, 0)`,
			updatedAt: new Date().toISOString(),
		})
		.where(
			and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, tenantId)),
		)
		.returning({ stockCount: inventoryItems.stockCount });

	const newStock = result[0]?.stockCount ?? 0;
	return {
		success: true,
		newStock,
		isBackorder: check.stockType === "special_order" && newStock <= 0,
	};
}

/**
 * Increment stock (returns, restocking, receiving).
 */
export async function incrementStock(
	db: DB,
	tenantId: string,
	itemId: string,
	quantity: number = 1,
): Promise<number> {
	const result = await db
		.update(inventoryItems)
		.set({
			stockCount: sql`${inventoryItems.stockCount} + ${quantity}`,
			updatedAt: new Date().toISOString(),
		})
		.where(
			and(eq(inventoryItems.id, itemId), eq(inventoryItems.tenantId, tenantId)),
		)
		.returning({ stockCount: inventoryItems.stockCount });

	return result[0]?.stockCount ?? 0;
}

/**
 * Get all low-stock items for a tenant (for alerts / automation triggers).
 */
export async function getLowStockItems(db: DB, tenantId: string) {
	return db
		.select({
			id: inventoryItems.id,
			name: inventoryItems.name,
			sku: inventoryItems.sku,
			stockCount: inventoryItems.stockCount,
			lowStockThreshold: inventoryItems.lowStockThreshold,
		})
		.from(inventoryItems)
		.where(
			and(
				eq(inventoryItems.tenantId, tenantId),
				eq(inventoryItems.stockType, "stock"),
				eq(inventoryItems.isActive, true),
				lte(inventoryItems.stockCount, inventoryItems.lowStockThreshold),
			),
		);
}

/**
 * Sync menu item availability based on linked inventory stock.
 * When a stock item hits 0, mark the linked menu item as unavailable (shows "Out of Stock").
 * When stock is replenished, mark it available again.
 */
export async function syncMenuAvailability(
	db: DB,
	tenantId: string,
	inventoryItemId: string,
): Promise<void> {
	const check = await checkStock(db, tenantId, inventoryItemId);

	// If non-stock, always available
	if (check.stockType === "non_stock") return;

	await db
		.update(menuItems)
		.set({
			isAvailable: !check.isOutOfStock,
			updatedAt: new Date().toISOString(),
		})
		.where(
			and(
				eq(menuItems.inventoryItemId, inventoryItemId),
				eq(menuItems.tenantId, tenantId),
			),
		);
}
