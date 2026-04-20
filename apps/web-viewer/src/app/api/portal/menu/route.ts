import { type NextRequest, NextResponse } from "next/server";
import {
  getDb,
  menuCategories,
  menuItems,
  events,
  eventBookings,
} from "@dba/database";
import { eq, and, gte, asc, sql } from "drizzle-orm";

/**
 * GET /api/portal/menu?tenant=<clerkOrgId>
 *
 * Public endpoint — returns the full menu for online ordering.
 * No auth required — used by client-facing ordering portal.
 */
export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant");
  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const cats = await db
    .select()
    .from(menuCategories)
    .where(and(eq(menuCategories.tenantId, tenantId), eq(menuCategories.isActive, true)))
    .orderBy(asc(menuCategories.sortOrder));

  const items = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      description: menuItems.description,
      priceCents: menuItems.priceCents,
      imageUrl: menuItems.imageUrl,
      categoryId: menuItems.categoryId,
      isAvailable: menuItems.isAvailable,
      sortOrder: menuItems.sortOrder,
    })
    .from(menuItems)
    .where(eq(menuItems.tenantId, tenantId))
    .orderBy(asc(menuItems.sortOrder));

  const menu = cats.map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: items
      .filter((i) => i.categoryId === cat.id)
      .map((i) => ({
        ...i,
        /** Shows "Out of Stock" instead of removing the item. */
        status: i.isAvailable ? "available" : "out_of_stock",
      })),
  }));

  return NextResponse.json({ menu });
}
