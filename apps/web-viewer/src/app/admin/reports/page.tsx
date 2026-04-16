import { getReportingSnapshot } from "../reporting-actions";
import ReportsClient from "./ReportsClient";
import Link from "next/link";

export default async function ReportsPage() {
  let snap: Awaited<ReturnType<typeof getReportingSnapshot>> | null = null;
  try {
    snap = await getReportingSnapshot();
  } catch {
    snap = null;
  }

  const d = snap?.dashboard;
  const t = snap?.tickets;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-text-muted mt-1">
          Pipeline snapshot, ticket SLA overview, and data export.
        </p>
      </div>

      {d && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Weighted forecast", value: `$${(d.weightedPipelineValue ?? d.forecastedMrr ?? 0).toLocaleString()}` },
            { label: "Pipeline value", value: `$${d.pipelineValue.toLocaleString()}` },
            { label: "Stale leads (14d+)", value: String(d.staleLeadCount ?? 0) },
            { label: "Overdue tasks", value: String(d.overdueOpenTasksCount ?? 0) },
          ].map((x) => (
            <div key={x.label} className="glass-card p-4 rounded-xl border border-glass-border">
              <p className="text-[10px] uppercase text-text-muted">{x.label}</p>
              <p className="text-xl font-bold text-white mt-1">{x.value}</p>
            </div>
          ))}
        </div>
      )}

      {t && (
        <div className="rounded-xl border border-glass-border bg-glass-bg p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Support tickets (your clients)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-muted">Total (recent window)</p>
              <p className="text-2xl font-bold text-white">{t.total}</p>
            </div>
            <div>
              <p className="text-text-muted">Open / in progress</p>
              <p className="text-2xl font-bold text-white">{t.open}</p>
            </div>
            <div>
              <p className="text-text-muted">First response recorded</p>
              <p className="text-2xl font-bold text-emerald-400">{t.slaMet}</p>
            </div>
            <div>
              <p className="text-text-muted">SLA overdue (no response yet)</p>
              <p className="text-2xl font-bold text-red-400">{t.slaBreachedOrLate}</p>
            </div>
            <div>
              <p className="text-text-muted">Awaiting first response (in SLA window)</p>
              <p className="text-2xl font-bold text-amber-300">{t.awaitingFirstResponse}</p>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-4">
            SLA uses wall-clock hours from ticket creation by priority (same rules as the Tickets page).
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <ReportsClient />
        <Link href="/admin/pipeline" className="text-sm text-(--color-brand) hover:underline">
          Open pipeline →
        </Link>
        <Link href="/admin/tickets" className="text-sm text-(--color-brand) hover:underline">
          Open tickets →
        </Link>
      </div>
    </div>
  );
}
