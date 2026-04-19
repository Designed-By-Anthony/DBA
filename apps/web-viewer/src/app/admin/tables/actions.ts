"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDb, withTenantContext, restaurantTables } from "@dba/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

const tableSchema = z.object({
  tableNumber: z.string().min(1).max(20),
  zone: z.string().max(50).optional(),
  seats: z.number().int().min(1).max(100).default(4),
});

export async function createTable(data: z.infer<typeof tableSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = tableSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [table] = await tx
      .insert(restaurantTables)
      .values({
        tenantId: orgId,
        ...parsed,
        status: "available",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/tables");
    return table;
  });
}

export async function updateTableStatus(
  tableId: string,
  status: "available" | "occupied" | "reserved" | "dirty"
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [updated] = await tx
      .update(restaurantTables)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(restaurantTables.id, tableId), eq(restaurantTables.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/tables");
    return updated;
  });
}

export async function listTables() {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) =>
    tx.select().from(restaurantTables).where(eq(restaurantTables.tenantId, orgId)).orderBy(restaurantTables.tableNumber)
  );
}
