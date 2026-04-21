import type * as React from "react";
import type {
	ServiceProJobStatus,
	ServiceProLeadMetadata,
} from "../vertical-metadata";

/**
 * Service Pro feature set — Job dispatch Kanban + geo-tag + SMS dispatch badge.
 *
 * Columns: Dispatched → On-Site → Completed. Metadata fields read from
 * `leads.metadata` so SQL schema stays lean.
 */
export type ServiceProLead = {
	id: string;
	name: string;
	email: string;
	metadata: ServiceProLeadMetadata | undefined | null;
};

export type ServiceProFeatureSetProps = {
	leads: ServiceProLead[];
	/** Optional render hook for the per-card details (e.g. links, actions). */
	renderLeadCard?: (lead: ServiceProLead) => React.ReactNode;
};

const COLUMNS: Array<{ id: ServiceProJobStatus; label: string }> = [
	{ id: "new", label: "New" },
	{ id: "dispatched", label: "Dispatched" },
	{ id: "on_site", label: "On-Site" },
	{ id: "completed", label: "Completed" },
];

export function ServiceProFeatureSet({
	leads,
	renderLeadCard,
}: ServiceProFeatureSetProps) {
	return (
		<section
			aria-label="Service Pro feature set"
			data-vertical="service_pro"
			className="grid grid-cols-1 md:grid-cols-4 gap-3"
		>
			{COLUMNS.map((col) => {
				const colLeads = leads.filter(
					(l) => (l.metadata?.jobStatus ?? "new") === col.id,
				);
				return (
					<div
						key={col.id}
						data-column={col.id}
						className="rounded-lg border border-white/10 bg-white/5 p-3 min-h-[120px]"
					>
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
								{col.label}
							</h4>
							<span className="text-[10px] text-white/50">
								{colLeads.length}
							</span>
						</div>
						<ul className="space-y-2">
							{colLeads.map((lead) => (
								<li
									key={lead.id}
									className="rounded border border-white/10 bg-black/20 p-2 text-xs text-white"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="font-medium truncate">{lead.name}</span>
										{lead.metadata?.smsDispatchSentAt ? (
											<span className="text-[10px] bg-emerald-500/20 text-emerald-300 rounded px-1">
												SMS
											</span>
										) : null}
									</div>
									<div className="text-[11px] text-white/60 truncate">
										{lead.email}
									</div>
									{lead.metadata?.geo ? (
										<div className="text-[10px] text-white/50 mt-1">
											📍 {lead.metadata.geo.lat.toFixed(3)},{" "}
											{lead.metadata.geo.lng.toFixed(3)}
										</div>
									) : null}
									{lead.metadata?.addressLine ? (
										<div className="text-[10px] text-white/50 truncate">
											{lead.metadata.addressLine}
										</div>
									) : null}
									{renderLeadCard ? renderLeadCard(lead) : null}
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</section>
	);
}
