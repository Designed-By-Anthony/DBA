"use server";

import { getDb, withTenantContext, activities, leads } from "@dba/database";
import { eq, and, sql } from "drizzle-orm";
import { verifyAuth } from "@/app/admin/actions";

export type CalendarBooking = {
  id: string;
  leadId: string;
  contactName: string;
  title: string;
  description: string | null;
  scheduledTime: string;
  eventUrl: string | null;
  inviteeEmail: string | null;
};

export type GetCalendarBookingsResult =
  | { ok: true; items: CalendarBooking[] }
  | { ok: false; error: string };

/**
 * Loads Calendly-backed bookings (`call_booked` activities) for the visible range.
 * Times come from webhook metadata `scheduledTime`.
 */
export async function getCalendarBookings(
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<GetCalendarBookingsResult> {
  try {
    const session = await verifyAuth();
    const db = getDb();
    if (!db) {
      return { ok: false, error: "Database not configured" };
    }

    const rangeStart = new Date(rangeStartIso);
    const rangeEnd = new Date(rangeEndIso);
    if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
      return { ok: false, error: "Invalid date range" };
    }
    if (rangeEnd <= rangeStart) {
      return { ok: false, error: "Invalid range" };
    }

    return await withTenantContext(db, session.user.agencyId, async (tx) => {
      const rows = await tx
        .select({
          activity: activities,
          leadName: leads.name,
        })
        .from(activities)
        .leftJoin(
          leads,
          and(
            eq(activities.leadId, leads.prospectId),
            eq(leads.tenantId, activities.tenantId),
          ),
        )
        .where(
          and(
            eq(activities.type, "call_booked"),
            sql`(metadata->>'scheduledTime') IS NOT NULL`,
            sql`trim(metadata->>'scheduledTime') <> ''`,
            sql`length(metadata->>'scheduledTime') >= 10`,
            sql`(metadata->>'scheduledTime')::timestamptz >= ${rangeStart.toISOString()}`,
            sql`(metadata->>'scheduledTime')::timestamptz < ${rangeEnd.toISOString()}`,
          ),
        )
        .orderBy(
          sql`(metadata->>'scheduledTime')::timestamptz asc`,
        );

      const items: CalendarBooking[] = rows.map(({ activity: a, leadName }) => {
        const meta = (a.metadata || {}) as Record<string, unknown>;
        const scheduledTime = String(meta.scheduledTime ?? "");
        const inviteeEmail =
          typeof meta.inviteeEmail === "string" ? meta.inviteeEmail : null;
        const eventUrl = typeof meta.eventUrl === "string" ? meta.eventUrl : null;
        const nameFromLead = (leadName || "").trim();
        const contactName = nameFromLead || inviteeEmail || "Guest";

        return {
          id: a.id,
          leadId: a.leadId,
          contactName,
          title: a.title,
          description: a.description ?? null,
          scheduledTime,
          eventUrl,
          inviteeEmail,
        };
      });

      return { ok: true, items } as const;
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load calendar";
    return { ok: false, error: msg };
  }
}
