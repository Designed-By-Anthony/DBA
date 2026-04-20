import type * as React from "react";
import type { AgencyLeadMetadata } from "../vertical-metadata";

/**
 * Agency feature set — Lighthouse audit viewer + SEO lead scoring.
 *
 * Reads vertical-specific metadata from the lead's `metadata` JSONB column,
 * so the CRM SQL schema stays lean.
 */
export type AgencyFeatureSetProps = {
  metadata: AgencyLeadMetadata | undefined | null;
  /** Render slot for a full Lighthouse report iframe / custom viewer. */
  renderAuditViewer?: (url: string) => React.ReactNode;
};

export function AgencyFeatureSet({ metadata, renderAuditViewer }: AgencyFeatureSetProps) {
  const m = metadata ?? {};
  const auditUrl = m.lighthouseReportUrl;
  return (
    <section aria-label="Agency feature set" data-vertical="agency" className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="SEO Lead Score" value={m.seoLeadScore} suffix="/ 100" />
        <Kpi label="Moz DA" value={m.mozDomainAuthority} suffix="/ 100" />
        <Kpi label="Backlinks" value={m.backlinkCount} />
        <Kpi label="PageSpeed" value={m.pagespeedScore} suffix="/ 100" />
      </div>
      {auditUrl ? (
        <div data-slot="lighthouse-audit-viewer">
          {renderAuditViewer ? (
            renderAuditViewer(auditUrl)
          ) : (
            <a
              href={auditUrl}
              target="_blank"
              rel="noopener"
              className="text-sm underline text-blue-400"
            >
              View Lighthouse report →
            </a>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Kpi({ label, value, suffix }: { label: string; value: number | undefined; suffix?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">
        {value ?? "—"}
        {value != null && suffix ? <span className="text-xs text-white/50 ml-1">{suffix}</span> : null}
      </p>
    </div>
  );
}
