import {
  getDb,
  withTenantContext,
  leads,
  activities,
  tickets,
} from "@dba/database";
import { eq, and, desc, inArray } from "drizzle-orm";
import type { ActivityType, ProspectHealthStatus } from "./types";

const SCORE_WEIGHTS: Record<ActivityType, number> = {
  form_submission: 10,
  audit_completed: 20,
  email_sent: 1,
  email_opened: 5,
  email_clicked: 12,
  call_booked: 40,
  call_completed: 30,
  note_added: 0,
  status_changed: 0,
  contract_sent: 25,
  contract_signed: 50,
  payment_received: 50,
  file_uploaded: 15,
  ticket_created: 5,
  ticket_replied: 2,
  milestone_shared: 5,
};

function activityType(value: unknown): ActivityType | null {
  return typeof value === "string" && value in SCORE_WEIGHTS
    ? (value as ActivityType)
    : null;
}

function dateFromValue(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === "object" && "toDate" in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    const date = toDate?.();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }
  return null;
}

/**
 * Recalculates the Lead Score (0-100) based on historical activity and time decay
 */
export async function recalculateLeadScore(
  tenantId: string,
  prospectId: string
): Promise<void> {
  try {
    const db = getDb();
    if (!db) return;

    await withTenantContext(db, tenantId, async (tx) => {
      // Fetch all activities for this prospect
      const prospectActivities = await tx
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.tenantId, tenantId),
            eq(activities.leadId, prospectId)
          )
        );

      let rawScore = 0;
      let lastEngagementDate: any = null;

      prospectActivities.forEach((activity) => {
        const type = activityType(activity.type);
        rawScore += type ? SCORE_WEIGHTS[type] : 0;

        const date = dateFromValue(activity.createdAt);
        if (date && (!lastEngagementDate || date > lastEngagementDate)) {
          lastEngagementDate = date;
        }
      });

      // Time decay factor: subtract 2 points for every full day of inactivity
      if (lastEngagementDate) {
        const daysElapsed = Math.floor(
          (Date.now() - lastEngagementDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const decay = Math.max(0, daysElapsed * 2);
        rawScore -= decay;
      }

      // Normalize to 0-100 ceiling/floor
      const finalScore = Math.max(0, Math.min(100, Math.floor(rawScore)));

      // Update the lead's score
      await tx
        .update(leads)
        .set({
          leadScore: finalScore,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId))
        );
    });
  } catch (error) {
    console.error(
      `[Intelligence] Failed to calculate lead score for ${prospectId}:`,
      error
    );
  }
}

/**
 * Evaluates and updates the health status of a prospect based on engagement gaps and open tickets
 */
export async function evaluateProspectHealth(
  tenantId: string,
  prospectId: string
): Promise<void> {
  try {
    const db = getDb();
    if (!db) return;

    await withTenantContext(db, tenantId, async (tx) => {
      // Fetch the lead
      const leadRows = await tx
        .select()
        .from(leads)
        .where(
          and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId))
        )
        .limit(1);

      if (leadRows.length === 0) return;

      const lead = leadRows[0];

      // For 'new' status leads, always mark as healthy
      if (lead.status === "new") {
        if (lead.healthStatus !== "healthy") {
          await tx
            .update(leads)
            .set({
              healthStatus: "healthy",
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId))
            );
        }
        return;
      }

      let health: ProspectHealthStatus = "healthy";

      // 1. Inactivity assessment
      const lastContactedAt = dateFromValue(lead.lastContactedAt);
      const daysSinceContact = lastContactedAt
        ? Math.floor(
            (Date.now() - lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      // 2. Open friction (tickets)
      const openTickets = await tx
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.tenantId, tenantId),
            eq(tickets.leadId, prospectId),
            inArray(tickets.status, ["open", "in_progress"])
          )
        );

      let oldestTicketDays = 0;
      openTickets.forEach((ticket) => {
        const ticketDate = dateFromValue(ticket.createdAt);
        if (!ticketDate) return;
        const age = Math.floor(
          (Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (age > oldestTicketDays) oldestTicketDays = age;
      });

      // 3. Determine health status based on thresholds
      if (oldestTicketDays >= 5 || daysSinceContact >= 14) {
        health = "churn_risk";
      } else if (oldestTicketDays >= 2 || daysSinceContact >= 7) {
        health = "at_risk";
      }

      // Update health status if changed
      if (lead.healthStatus !== health) {
        await tx
          .update(leads)
          .set({
            healthStatus: health,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId))
          );
      }
    });
  } catch (error) {
    console.error(
      `[Intelligence] Failed to evaluate health for ${prospectId}:`,
      error
    );
  }
}
