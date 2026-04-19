"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDb, withTenantContext, hardwareDevices } from "@dba/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

const deviceSchema = z.object({
  deviceType: z.enum(["stripe_reader", "printnode_printer"]),
  label: z.string().min(1).max(200),
  externalId: z.string().min(1),
  location: z.string().max(200).optional(),
});

export async function registerDevice(data: z.infer<typeof deviceSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = deviceSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [device] = await tx
      .insert(hardwareDevices)
      .values({
        tenantId: orgId,
        ...parsed,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/settings");
    return device;
  });
}

export async function listDevices(type?: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const conditions = [eq(hardwareDevices.tenantId, orgId), eq(hardwareDevices.isActive, true)];
    if (type) conditions.push(eq(hardwareDevices.deviceType, type));

    return tx.select().from(hardwareDevices).where(and(...conditions));
  });
}

export async function deactivateDevice(deviceId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [updated] = await tx
      .update(hardwareDevices)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(and(eq(hardwareDevices.id, deviceId), eq(hardwareDevices.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/settings");
    return updated;
  });
}
