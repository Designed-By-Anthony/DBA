import {
	db,
	FieldValue,
	REPORTS_COLLECTION,
	Timestamp,
} from "@lh/lib/report-store";
import { isValidReportId } from "@lh/lib/reportId";
import { Elysia } from "elysia";

export const reportRoute = new Elysia({ aot: false }).get(
	"/api/report/:id",
	async ({ params, set }) => {
		set.headers["Cache-Control"] = "no-store";
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

			const data = snap.data();
			if (!data) {
				set.status = 500;
				return { error: "Report data unavailable" };
			}

			await ref
				.update({
					views: FieldValue.increment(1),
					lastViewedAt: Timestamp.now(),
				})
				.catch((err) => console.error("Update failed:", err));

			return {
				id: data.id,
				url: data.lead?.url || "",
				createdAt: data.createdAt?.toDate?.().toISOString() || null,
				psiDegradedReason: data.psiDegradedReason || null,

				performance: data.scores?.performance ?? 0,
				accessibility: data.scores?.accessibility ?? 0,
				bestPractices: data.scores?.bestPractices ?? 0,
				seo: data.scores?.seo ?? 0,
				trustScore: data.scores?.trustScore ?? 0,
				conversion: data.scores?.conversion ?? 0,

				lead: {
					name: data.lead?.name || "",
					company: data.lead?.company || "",
					url: data.lead?.url || "",
				},
				metrics: data.metrics || {},
				diagnostics: data.diagnostics || {},
				aiInsight: data.aiInsight || {},
				htmlSignals: data.htmlSignals || {},
				sitewide: data.sitewide || {},
				backlinks: data.backlinks || {},
				indexCoverage: data.indexCoverage || {},
				places: data.places || {},
				competitors: data.competitors || [],
			};
		} catch (err) {
			console.error("Report fetch failed:", err);
			set.status = 500;
			return { error: "Failed to fetch report" };
		}
	},
);
