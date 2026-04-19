import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, orders, orderItems, restaurantTables } from "@dba/database";
import { eq, and, inArray, desc } from "drizzle-orm";

/**
 * GET /api/admin/kitchen
 *
 * Returns active orders for the Kitchen Display System (KDS).
 * Shows orders in status: new, preparing, ready.
 */
export async function GET() {
  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const activeOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, orgId),
        inArray(orders.status, ["new", "preparing", "ready"])
      )
    )
    .orderBy(orders.createdAt);

  // Attach items and table info to each order
  const enriched = await Promise.all(
    activeOrders.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(
          and(eq(orderItems.orderId, order.id), eq(orderItems.tenantId, orgId))
        );

      let tableName: string | null = null;
      if (order.tableId) {
        const [table] = await db
          .select({ tableNumber: restaurantTables.tableNumber, zone: restaurantTables.zone })
          .from(restaurantTables)
          .where(
            and(eq(restaurantTables.id, order.tableId), eq(restaurantTables.tenantId, orgId))
          )
          .limit(1);
        if (table) {
          tableName = table.zone ? `${table.zone} - Table ${table.tableNumber}` : `Table ${table.tableNumber}`;
        }
      }

      // Calculate elapsed time in minutes since order creation
      const elapsedMinutes = Math.round(
        (Date.now() - new Date(order.createdAt).getTime()) / 60000
      );

      return {
        ...order,
        items,
        tableName,
        elapsedMinutes,
        isUrgent: elapsedMinutes > 15,
      };
    })
  );

  return NextResponse.json({ orders: enriched });
}
