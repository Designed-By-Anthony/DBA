"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  getDb,
  withTenantContext,
  appointments,
  type AppointmentRow,
} from "@dba/database";
import { eq, and, gte } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

const appointmentSchema = z.object({
  prospectId: z.string().optional(),
  prospectName: z.string().optional(),
  prospectEmail: z.string().email().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  recurrenceRule: z.string().optional(),
  assignedTo: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function createAppointment(data: z.infer<typeof appointmentSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = appointmentSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [appt] = await tx
      .insert(appointments)
      .values({
        tenantId: orgId,
        ...parsed,
        status: "scheduled",
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/calendar");
    return appt;
  });
}

export async function updateAppointment(
  apptId: string,
  data: Partial<z.infer<typeof appointmentSchema>> & {
    status?: "scheduled" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled";
  }
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [appt] = await tx
      .update(appointments)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(appointments.id, apptId), eq(appointments.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/calendar");
    return appt;
  });
}

export async function listAppointments(
  fromDate?: string,
  statusFilter?: string
): Promise<AppointmentRow[]> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const conditions = [eq(appointments.tenantId, orgId)];

    if (fromDate) {
      conditions.push(gte(appointments.startTime, fromDate));
    }
    if (statusFilter) {
      conditions.push(
        eq(
          appointments.status,
          statusFilter as "scheduled" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled"
        )
      );
    }

    return tx
      .select()
      .from(appointments)
      .where(and(...conditions))
      .orderBy(appointments.startTime);
  });
}

export async function deleteAppointment(apptId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    await tx
      .update(appointments)
      .set({ status: "cancelled", updatedAt: new Date().toISOString() })
      .where(and(eq(appointments.id, apptId), eq(appointments.tenantId, orgId)));

    revalidatePath("/admin/appointments");
    revalidatePath("/admin/calendar");
  });
}
