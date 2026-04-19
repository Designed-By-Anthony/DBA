"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  getDb,
  withTenantContext,
  events,
  eventBookings,
  type EventRow,
  type EventBookingRow,
} from "@dba/database";
import { eq, and, gte, sql } from "drizzle-orm";
import { z } from "zod";

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not configured");
  return db;
}

const eventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  maxCapacity: z.number().int().min(1).optional(),
  isPublic: z.boolean().default(false),
  waitlistEnabled: z.boolean().default(false),
  priceCents: z.number().int().min(0).default(0),
  recurrenceRule: z.string().optional(),
});

export async function createEvent(data: z.infer<typeof eventSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const parsed = eventSchema.parse(data);
  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({ tenantId: orgId, ...parsed, createdAt: now, updatedAt: now })
      .returning();

    revalidatePath("/admin/events");
    return event;
  });
}

export async function updateEvent(eventId: string, data: Partial<z.infer<typeof eventSchema>>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [event] = await tx
      .update(events)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(events.id, eventId), eq(events.tenantId, orgId)))
      .returning();

    revalidatePath("/admin/events");
    return event;
  });
}

export async function listEvents(fromDate?: string): Promise<EventRow[]> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const conditions = [eq(events.tenantId, orgId)];
    if (fromDate) conditions.push(gte(events.startTime, fromDate));

    return tx.select().from(events).where(and(...conditions)).orderBy(events.startTime);
  });
}

/** Get event with remaining seats count. */
export async function getEventWithSeats(eventId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  return withTenantContext(db, orgId, async (tx) => {
    const [event] = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.tenantId, orgId)))
      .limit(1);

    if (!event) return null;

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.eventId, eventId),
          eq(eventBookings.tenantId, orgId),
          eq(eventBookings.status, "confirmed")
        )
      );

    const bookedCount = count ?? 0;
    const remainingSeats = event.maxCapacity ? event.maxCapacity - bookedCount : null;
    return { ...event, bookedCount, remainingSeats };
  });
}

/** Book a spot at an event — handles capacity + waitlist. */
export async function bookEvent(data: {
  eventId: string;
  prospectId?: string;
  prospectName: string;
  prospectEmail: string;
}): Promise<EventBookingRow> {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");
  const db = requireDb();

  const now = new Date().toISOString();

  return withTenantContext(db, orgId, async (tx) => {
    // Check capacity within the same transaction
    const [event] = await tx
      .select()
      .from(events)
      .where(and(eq(events.id, data.eventId), eq(events.tenantId, orgId)))
      .limit(1);

    if (!event) throw new Error("Event not found");

    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.eventId, data.eventId),
          eq(eventBookings.tenantId, orgId),
          eq(eventBookings.status, "confirmed")
        )
      );

    const bookedCount = count ?? 0;
    let status: "confirmed" | "waitlisted" = "confirmed";

    if (event.maxCapacity && bookedCount >= event.maxCapacity) {
      if (!event.waitlistEnabled) throw new Error("Event is full and waitlist is not enabled");
      status = "waitlisted";
    }

    const [booking] = await tx
      .insert(eventBookings)
      .values({
        tenantId: orgId,
        eventId: data.eventId,
        prospectId: data.prospectId,
        prospectName: data.prospectName,
        prospectEmail: data.prospectEmail,
        status,
        createdAt: now,
      })
      .returning();

    revalidatePath("/admin/events");
    return booking;
  });
}
