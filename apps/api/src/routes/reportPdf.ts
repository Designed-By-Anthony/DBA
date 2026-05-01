import { buildAuditPdf } from "@dba/shared/lighthouse/lib/auditReportPdf";
import { db, REPORTS_COLLECTION } from "@dba/shared/lighthouse/lib/report-store";
import { isValidReportId } from "@dba/shared/lighthouse/lib/reportId";
import { Elysia } from "elysia";
import type { AuditData } from "../../../../packages/shared/src/lighthouse/auditReport";

function toAuditData(data: Record<string, unknown>): AuditData {
	const scores = (data.scores as Record<string, unknown>) ?? {};
	const metrics = (data.metrics as Record<string, unknown>) ?? {};
	const lead = (data.lead as Record<string, unknown>) ?? {};

	return {
		url: String(lead.url ?? ""),
		trustScore: Number(scores.trustScore ?? 0),
		performance: scores.performance == null ? null : Number(scores.performance),
		accessibility:
			scores.accessibility == null ? null : Number(scores.accessibility),
		bestPractices:
			scores.bestPractices == null ? null : Number(scores.bestPractices),
		seo: scores.seo == null ? null : Number(scores.seo),
		conversion: Number(scores.conversion ?? 0),
		metrics: {
			fcp: String(metrics.fcp ?? "—"),
			lcp: String(metrics.lcp ?? "—"),
			tbt: String(metrics.tbt ?? "—"),
			cls: String(metrics.cls ?? "—"),
		},
		psiDegradedReason:
			typeof data.psiDegradedReason === "string"
				? data.psiDegradedReason
				: null,
		aiInsight: data.aiInsight as AuditData["aiInsight"],
		diagnostics: data.diagnostics as AuditData["diagnostics"],
		sitewide: data.sitewide as AuditData["sitewide"],
		backlinks: data.backlinks as AuditData["backlinks"],
		indexCoverage: data.indexCoverage as AuditData["indexCoverage"],
		places: data.places as AuditData["places"],
		competitors: Array.isArray(data.competitors)
			? (data.competitors as AuditData["competitors"])
			: [],
	};
}

export const reportPdfRoute = new Elysia({ aot: false }).get(
	"/api/report/:id/pdf",
	async ({ params, set }) => {
		const { id } = params;

		if (!isValidReportId(id)) {
			set.status = 400;
			return { error: "Invalid report ID format" };
		}

		try {
			const ref = db.collection(REPORTS_COLLECTION).doc(id);
			const snap = await ref.get();

			if (!snap.exists) {
				set.status = 404;
				return { error: "Report not found" };
			}

			const raw = snap.data();
			if (!raw) {
				set.status = 500;
				return { error: "Report data unavailable" };
			}

			const auditData = toAuditData(raw as Record<string, unknown>);
			const blob = buildAuditPdf(auditData, id);
			const buf = await blob.arrayBuffer();

			const host = (() => {
				try {
					return (
						new URL(auditData.url).hostname.replace(/^www\./, "") || "audit"
					);
				} catch {
					return "audit";
				}
			})();

			return new Response(buf, {
				headers: {
					"Content-Type": "application/pdf",
					"Content-Disposition": `attachment; filename="audit-${host}-${id}.pdf"`,
					"Cache-Control": "private, max-age=300",
				},
			});
		} catch (err) {
			console.error(
				"PDF generation failed:",
				err instanceof Error ? err.message : err,
			);
			set.status = 500;
			return { error: "Failed to generate PDF" };
		}
	},
);
