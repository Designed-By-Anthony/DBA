"use server";

import { db } from "@/lib/firebase";
import { verifyAuth, getProspects, getDashboardStats } from "@/app/admin/actions";
import { getTicketSlaState } from "@/lib/ticket-sla";
import type { Prospect } from "@/lib/types";

export type ReportingSnapshot = {
  dashboard: Awaited<ReturnType<typeof getDashboardStats>>;
  tickets: {
    total: number;
    open: number;
    slaMet: number;
    slaBreachedOrLate: number;
    awaitingFirstResponse: number;
  };
};

export async function getReportingSnapshot(): Promise<ReportingSnapshot> {
  await verifyAuth();
  const [dashboard, prospects] = await Promise.all([
    getDashboardStats(),
    getProspects(),
  ]);
  const idSet = new Set(prospects.map((p) => p.id));

  const snap = await db
    .collection("tickets")
    .orderBy("createdAt", "desc")
    .limit(400)
    .get();

  let total = 0;
  let open = 0;
  let slaMet = 0;
  let slaBreachedOrLate = 0;
  let awaitingFirstResponse = 0;

  for (const doc of snap.docs) {
    const t = doc.data();
    const pid = t.prospectId as string;
    if (!idSet.has(pid)) continue;
    total++;
    const st = t.status as string;
    if (st === "open" || st === "in_progress") open++;

    const createdAt = t.createdAt as string;
    const priority = (t.priority as string) || "medium";
    const firstResponseAt = t.firstResponseAt as string | undefined;

    if (firstResponseAt) {
      slaMet++;
      continue;
    }
    if (st === "resolved" || st === "closed") {
      continue;
    }
    const sla = getTicketSlaState(createdAt, priority, undefined);
    if (sla.kind === "breach") {
      slaBreachedOrLate++;
    } else {
      awaitingFirstResponse++;
    }
  }

  return {
    dashboard,
    tickets: {
      total,
      open,
      slaMet,
      slaBreachedOrLate,
      awaitingFirstResponse,
    },
  };
}

export async function exportProspectsCsv(): Promise<{ csv: string; error?: string }> {
  const session = await verifyAuth();
  try {
    const snapshot = await db
      .collection("prospects")
      .where("agencyId", "==", session.user.agencyId)
      .get();
    const rows = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    const headers = [
      "id",
      "name",
      "email",
      "company",
      "status",
      "dealValue",
      "source",
      "createdAt",
      "lastContactedAt",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const p = r as Prospect & { id: string };
      lines.push(
        [
          csvEscape(p.id),
          csvEscape(p.name),
          csvEscape(p.email),
          csvEscape(p.company),
          csvEscape(p.status),
          String(p.dealValue ?? ""),
          csvEscape(p.source),
          csvEscape(p.createdAt),
          csvEscape(p.lastContactedAt ?? ""),
        ].join(","),
      );
    }
    return { csv: lines.join("\n") };
  } catch (e: unknown) {
    return { csv: "", error: e instanceof Error ? e.message : String(e) };
  }
}

function csvEscape(val: string | null | undefined): string {
  const s = val ?? "";
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
