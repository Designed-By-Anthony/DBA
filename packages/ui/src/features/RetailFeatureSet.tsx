import * as React from "react";
import type { RetailLeadMetadata } from "../vertical-metadata";

/**
 * Retail / Florist feature set — Inventory + Loyalty loop.
 *
 * Stripe Terminal hookup is exposed via `stripeTerminalReaderId` on the
 * tenant (wired at the CRM layer). "We miss you" re-engagement driven by
 * `lastPurchaseAt` is surfaced here.
 */
export type RetailLead = {
  id: string;
  name: string;
  email: string;
  metadata: RetailLeadMetadata | undefined | null;
};

export type RetailFeatureSetProps = {
  leads: RetailLead[];
  /** Days since last purchase that trips the re-engagement highlight. */
  reengagementThresholdDays?: number;
};

export function RetailFeatureSet({
  leads,
  reengagementThresholdDays = 45,
}: RetailFeatureSetProps) {
  const now = Date.now();
  const stale = leads.filter((l) => {
    const last = l.metadata?.lastPurchaseAt ? Date.parse(l.metadata.lastPurchaseAt) : NaN;
    if (!Number.isFinite(last)) return false;
    return (now - last) / 86_400_000 >= reengagementThresholdDays;
  });

  return (
    <section aria-label="Retail feature set" data-vertical="retail" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="Customers" value={leads.length} />
        <Kpi
          label={`Stale ${reengagementThresholdDays}d+`}
          value={stale.length}
        />
        <Kpi
          label="Avg CLV"
          value={avgClv(leads)}
          prefix="$"
        />
      </div>
      <div data-slot="re-engagement" className="rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
            “We miss you” list
          </h4>
          <span className="text-[10px] text-white/50">{stale.length}</span>
        </div>
        {stale.length === 0 ? (
          <p className="text-xs text-white/50">Nobody is stale yet. Keep shipping.</p>
        ) : (
          <ul className="space-y-2">
            {stale.slice(0, 20).map((lead) => (
              <li
                key={lead.id}
                className="rounded border border-white/10 bg-black/20 p-2 text-xs text-white flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{lead.name}</div>
                  <div className="text-[11px] text-white/50 truncate">
                    {lead.email || "—"}
                    {lead.metadata?.loyaltyTier ? ` · ${lead.metadata.loyaltyTier}` : ""}
                  </div>
                </div>
                <div className="text-[11px] text-white/60 whitespace-nowrap">
                  {lead.metadata?.lastPurchaseAt
                    ? new Date(lead.metadata.lastPurchaseAt).toLocaleDateString()
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Kpi({ label, value, prefix }: { label: string; value: number; prefix?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">
        {prefix}
        {value}
      </p>
    </div>
  );
}

function avgClv(leads: RetailLead[]): number {
  const values = leads
    .map((l) => l.metadata?.customerLifetimeValueCents)
    .filter((v): v is number => typeof v === "number");
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length / 100);
}
