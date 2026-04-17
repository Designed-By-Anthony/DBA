/**
 * Generic Lead Card — Chameleon display for any lead.
 *
 * Global fields (name / email / phone) render in the header; the metadata
 * JSONB is formatted per the tenant's vertical. One component, four
 * different "feels" at runtime — exactly what the Global Dashboard promised.
 */
import * as React from "react";
import type { VerticalId } from "./vertical-config";

export type LeadLike = {
  prospectId?: string;
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  status?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
};

export type LeadCardProps = {
  lead: LeadLike;
  vertical: VerticalId | string | null | undefined;
  /** Optional CTA (e.g. "Open in CRM" link). */
  actionSlot?: React.ReactNode;
};

type FieldDef = { path: string; label: string; render?: (v: unknown) => React.ReactNode };

/**
 * Per-vertical "cards" map. Unknown verticals fall back to the agency set
 * since that's the sales default. Keep this pure (no hooks) so server
 * components can render it cheaply.
 */
const VERTICAL_FIELDS: Record<VerticalId, FieldDef[]> = {
  agency: [
    { path: "seoLeadScore", label: "SEO score", render: (v) => formatScore(v) },
    { path: "mozDomainAuthority", label: "Moz DA", render: (v) => formatScore(v) },
    { path: "pagespeedScore", label: "PageSpeed", render: (v) => formatScore(v) },
    { path: "backlinkCount", label: "Backlinks" },
    {
      path: "lighthouseReportUrl",
      label: "Report",
      render: (v) =>
        typeof v === "string" && v ? (
          <a href={v} target="_blank" rel="noopener" className="underline text-blue-400">
            View →
          </a>
        ) : null,
    },
  ],
  service_pro: [
    { path: "jobStatus", label: "Job status", render: (v) => toTitle(String(v ?? "")) },
    { path: "crewId", label: "Crew" },
    { path: "addressLine", label: "Address" },
    { path: "geo", label: "Geo", render: renderGeo },
    {
      path: "smsDispatchSentAt",
      label: "SMS dispatched",
      render: (v) => (typeof v === "string" ? fmtDate(v) : null),
    },
  ],
  restaurant: [
    { path: "tableNumber", label: "Table" },
    { path: "partySize", label: "Party size" },
    { path: "source", label: "Channel" },
    {
      path: "orderTotalCents",
      label: "Order total",
      render: (v) => (typeof v === "number" ? fmtUsd(v) : null),
    },
    {
      path: "dietaryTags",
      label: "Dietary",
      render: (v) =>
        Array.isArray(v) ? (
          <div className="flex flex-wrap gap-1">
            {v.map((t) => (
              <span key={String(t)} className="rounded bg-white/10 px-1 text-[10px] text-white/80">
                {String(t)}
              </span>
            ))}
          </div>
        ) : null,
    },
  ],
  florist: [
    { path: "loyaltyTier", label: "Tier", render: (v) => toTitle(String(v ?? "")) },
    {
      path: "customerLifetimeValueCents",
      label: "CLV",
      render: (v) => (typeof v === "number" ? fmtUsd(v) : null),
    },
    {
      path: "lastPurchaseAt",
      label: "Last purchase",
      render: (v) => (typeof v === "string" ? fmtDate(v) : null),
    },
    { path: "discountCode", label: "Discount" },
  ],
};

export function GenericLeadCard({ lead, vertical, actionSlot }: LeadCardProps) {
  const verticalId: VerticalId =
    (VERTICAL_IDS_SET.has(vertical as VerticalId) ? (vertical as VerticalId) : "agency");
  const fields = VERTICAL_FIELDS[verticalId] ?? VERTICAL_FIELDS.agency;
  const metadata = lead.metadata ?? {};
  const rows = fields
    .map((f) => ({ f, value: readPath(metadata, f.path) }))
    .filter(({ value }) => value !== undefined && value !== null && value !== "");

  return (
    <article
      data-generic-lead-card
      data-vertical={verticalId}
      className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white"
    >
      <header className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{lead.name}</span>
            {lead.status ? (
              <span className="text-[10px] rounded bg-white/10 px-1 py-0.5 text-white/70">
                {lead.status}
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-white/60 truncate">
            {lead.email}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </div>
          {lead.source ? (
            <div className="text-[10px] text-white/40 mt-0.5">source · {lead.source}</div>
          ) : null}
        </div>
        {actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
      </header>
      {rows.length === 0 ? (
        <p className="text-[11px] text-white/40 italic">No vertical metadata yet.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
          {rows.map(({ f, value }) => (
            <React.Fragment key={f.path}>
              <dt className="text-[10px] uppercase tracking-wide text-white/50">{f.label}</dt>
              <dd className="text-[11px] text-white/90 truncate">
                {f.render ? f.render(value) : String(value)}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </article>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const VERTICAL_IDS_SET = new Set<VerticalId>(["agency", "service_pro", "restaurant", "florist"]);

function readPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function formatScore(v: unknown): React.ReactNode {
  if (typeof v !== "number") return null;
  return <span>{v}<span className="text-white/40 text-[10px] ml-0.5">/ 100</span></span>;
}

function fmtUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function renderGeo(v: unknown): React.ReactNode {
  if (!v || typeof v !== "object") return null;
  const g = v as { lat?: number; lng?: number };
  if (typeof g.lat !== "number" || typeof g.lng !== "number") return null;
  return `📍 ${g.lat.toFixed(3)}, ${g.lng.toFixed(3)}`;
}

function toTitle(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
