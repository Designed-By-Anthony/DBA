import {
	db,
	FieldValue,
	REPORTS_COLLECTION,
	Timestamp,
} from "@lh/lib/report-store";
import { isValidReportId } from "@lh/lib/reportId";
import { Elysia } from "elysia";

export const reportRoute = new Elysia().get(
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

			const publicLead = {
				name: data.lead?.name || "",
				company: data.lead?.company || "",
				url: data.lead?.url || "",
			};

			// Fire-and-forget view increment
			Promise.resolve().then(async () => {
				try {
					await ref.update({
						views: FieldValue.increment(1),
						lastViewedAt: Timestamp.now(),
					});
				} catch (err) {
					console.error(
						"View increment failed:",
						err instanceof Error ? err.message : err,
					);
				}
			});

			return {
				id: data.id,
				createdAt: data.createdAt?.toDate?.().toISOString() || null,
				psiDegradedReason:
					typeof data.psiDegradedReason === "string"
						? data.psiDegradedReason
						: null,
				lead: publicLead,
				scores: data.scores,
				metrics: data.metrics,
				diagnostics: data.diagnostics,
				aiInsight: data.aiInsight,
				htmlSignals: data.htmlSignals || {},
				sitewide: data.sitewide || {},
				backlinks: data.backlinks || {},
				indexCoverage: data.indexCoverage || {},
				places: data.places || {},
				competitors: data.competitors || [],
			};
		} catch (err) {
			console.error(
				"Report fetch failed:",
				err instanceof Error ? err.message : err,
			);
			set.status = 500;
			return { error: "Failed to fetch report" };
		}
	},
);
