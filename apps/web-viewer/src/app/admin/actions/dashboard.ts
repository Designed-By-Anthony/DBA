"use server";

import { db } from "@/lib/firebase";
import type { DashboardStats, ProspectStatus } from "@/lib/types";
import { pipelineStages } from "@/lib/theme.config";
import { verifyAuth } from "./auth";
import { STALE_LEAD_DAYS } from "../action-helpers";

const probByStatus: Record<ProspectStatus, number> = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.probability]),
) as Record<ProspectStatus, number>;

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await verifyAuth();

  let prospectsSnap: FirebaseFirestore.QuerySnapshot;
  let emailsSnap: FirebaseFirestore.QuerySnapshot;
  try {
    [prospectsSnap, emailsSnap] = await Promise.all([
      db.collection("prospects").where("agencyId", "==", session.user.agencyId).get(),
      db.collection("emails").where("agencyId", "==", session.user.agencyId).get(),
    ]);
  } catch {
    return {
      totalProspects: 0,
      prospectsByStatus: { lead: 0, contacted: 0, proposal: 0, dev: 0, launched: 0 },
      emailsSent: 0,
      emailsScheduled: 0,
      totalOpens: 0,
      totalClicks: 0,
      pipelineValue: 0,
      forecastedMrr: 0,
      weightedPipelineValue: 0,
      staleLeadCount: 0,
      overdueOpenTasksCount: 0,
      pipelineVelocityDays: 0,
    };
  }

  const prospects = prospectsSnap.docs.map((d) => d.data());
  const emails = emailsSnap.docs.map((d) => d.data());

  const statusCounts: Record<ProspectStatus, number> = {
    lead: 0,
    contacted: 0,
    proposal: 0,
    dev: 0,
    launched: 0,
  };

  let pipelineValue = 0;
  let weightedPipelineValue = 0;
  let totalVelocityDays = 0;
  let launchedCount = 0;
  const now = Date.now();
  const staleMs = STALE_LEAD_DAYS * 24 * 60 * 60 * 1000;
  let staleLeadCount = 0;

  prospects.forEach((p) => {
    const s = (p.status || "lead") as ProspectStatus;
    if (statusCounts[s] !== undefined) statusCounts[s]++;

    const deal = Number(p.dealValue) || 0;
    if (s !== "launched") {
      pipelineValue += deal;
      const prob = probByStatus[s] ?? 0.1;
      weightedPipelineValue += deal * prob;
    } else {
      launchedCount++;
      const days = Math.floor(
        (Date.now() - new Date(p.createdAt || Date.now()).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalVelocityDays += Math.max(1, days);
    }

    if (s !== "launched") {
      const lastTouch = p.lastContactedAt
        ? new Date(p.lastContactedAt as string).getTime()
        : new Date((p.createdAt as string) || Date.now()).getTime();
      if (now - lastTouch > staleMs) staleLeadCount++;
    }
  });

  const sentEmails = emails.filter((e) => e.status === "sent" || e.status === "scheduled");
  const totalOpens = emails.reduce((acc, e) => acc + (e.opens || 0), 0);
  const totalClicks = emails.reduce(
    (acc, e) => acc + (Array.isArray(e.clicks) ? e.clicks.length : 0),
    0,
  );

  let overdueOpenTasksCount = 0;
  try {
    const taskSnap = await db
      .collectionGroup("crm_tasks")
      .where("agencyId", "==", session.user.agencyId)
      .where("completed", "==", false)
      .limit(200)
      .get();
    taskSnap.docs.forEach((d) => {
      const due = new Date((d.data().dueAt as string) || 0).getTime();
      if (due < now) overdueOpenTasksCount++;
    });
  } catch {
    // missing index / empty
  }

  const roundedWeighted = Math.round(weightedPipelineValue);

  return {
    totalProspects: prospects.length,
    prospectsByStatus: statusCounts,
    emailsSent: sentEmails.filter((e) => e.status === "sent").length,
    emailsScheduled: sentEmails.filter((e) => e.status === "scheduled").length,
    totalOpens,
    totalClicks,
    pipelineValue,
    forecastedMrr: roundedWeighted,
    weightedPipelineValue: roundedWeighted,
    staleLeadCount,
    overdueOpenTasksCount,
    pipelineVelocityDays:
      launchedCount > 0 ? Math.round(totalVelocityDays / launchedCount) : 0,
  };
}

