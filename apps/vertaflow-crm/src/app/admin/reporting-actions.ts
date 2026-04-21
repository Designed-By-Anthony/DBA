"use server";

import { getDb, leads, tickets, withTenantContext } from "@dba/database";
import { eq } from "drizzle-orm";
import {
	getDashboardStats,
	getProspects,
	verifyAuth,
} from "@/app/admin/actions";
import { getTicketSlaState } from "@/lib/ticket-sla";

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
	const session = await verifyAuth();
	const [dashboard, prospects] = await Promise.all([
		getDashboardStats(),
		getProspects(),
	]);

	const db = getDb();
	const ticketStats = {
		total: 0,
		open: 0,
		slaMet: 0,
		slaBreachedOrLate: 0,
		awaitingFirstResponse: 0,
	};

	if (db) {
		try {
			await withTenantContext(db, session.user.agencyId, async (tx) => {
				const ticketRows = await tx
					.select()
					.from(tickets)
					.where(eq(tickets.tenantId, session.user.agencyId))
					.limit(400);

				const idSet = new Set(prospects.map((p) => p.id));

				for (const t of ticketRows) {
					if (!idSet.has(t.leadId || "")) continue;
					ticketStats.total++;
					if (t.status === "open" || t.status === "in_progress")
						ticketStats.open++;
					if (t.firstResponseAt) {
						ticketStats.slaMet++;
						continue;
					}
					if (t.status === "resolved" || t.status === "closed") continue;
					const sla = getTicketSlaState(
						t.createdAt || "",
						t.priority || "medium",
						undefined,
					);
					if (sla.kind === "breach") {
						ticketStats.slaBreachedOrLate++;
					} else {
						ticketStats.awaitingFirstResponse++;
					}
				}
			});
		} catch (err) {
			console.error("Ticket stats error:", err);
		}
	}

	return { dashboard, tickets: ticketStats };
}

export async function exportProspectsCsv(): Promise<{
	csv: string;
	error?: string;
}> {
	const session = await verifyAuth();
	const db = getDb();
	if (!db) return { csv: "", error: "Database not configured" };

	try {
		const rows = await withTenantContext(
			db,
			session.user.agencyId,
			async (tx) => {
				return await tx
					.select()
					.from(leads)
					.where(eq(leads.tenantId, session.user.agencyId));
			},
		);

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
			lines.push(
				[
					csvEscape(r.prospectId),
					csvEscape(r.name),
					csvEscape(r.email),
					csvEscape(r.company),
					csvEscape(r.status),
					String(r.dealValue ?? ""),
					csvEscape(r.source),
					csvEscape(r.createdAt),
					csvEscape(r.lastContactedAt),
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
