/**
 * Barcode & QR Code Utilities
 *
 * Server-side helpers for barcode lookup and generation.
 * Client-side scanning uses the browser's native BarcodeDetector API
 * or a polyfill — that logic lives in the UI components.
 */

import { eq, and, or } from "drizzle-orm";
import { inventoryItems, giftCards } from "@dba/database";

/**
 * Lookup an entity by barcode or QR code value.
 * Searches: inventory items (by barcode/SKU), gift cards (by code).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function lookupBarcode(tx: any, tenantId: string, code: string) {
  // 1. Check inventory items by barcode or SKU
  const [invItem] = await tx
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      barcode: inventoryItems.barcode,
      stockCount: inventoryItems.stockCount,
      stockType: inventoryItems.stockType,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.isActive, true),
        or(eq(inventoryItems.barcode, code), eq(inventoryItems.sku, code))
      )
    )
    .limit(1);

  if (invItem) {
    return { type: "inventory_item" as const, data: invItem };
  }

  // 2. Check gift cards by code
  const [card] = await tx
    .select({
      id: giftCards.id,
      code: giftCards.code,
      currentBalanceCents: giftCards.currentBalanceCents,
      isActive: giftCards.isActive,
    })
    .from(giftCards)
    .where(and(eq(giftCards.tenantId, tenantId), eq(giftCards.code, code.toUpperCase())))
    .limit(1);

  if (card) {
    return { type: "gift_card" as const, data: card };
  }

  return { type: "unknown" as const, data: null };
}

/**
 * Generate a unique barcode for a new inventory item.
 * Format: DBA-<tenant prefix>-<random digits>
 */
export function generateBarcode(tenantId: string): string {
  const prefix = tenantId.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  const rand = Math.floor(100000000 + Math.random() * 900000000);
  return `DBA-${prefix}-${rand}`;
}
