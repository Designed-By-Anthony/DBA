import { buildCorsHeaders } from "@lh/lib/http";
import {
	db,
	FieldValue,
	REPORTS_COLLECTION,
	Timestamp,
} from "@lh/lib/report-store";
import { isValidReportId } from "@lh/lib/reportId";
import { after, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/report/[id]
 *
 * Fetches a stored report by ID. Intended to be called server-side by the
 * `/report/[id]` page during SSR.
 *
 * - Validates the ID format (DBA-XXXXYYYY)
 * - 404 if not found
 * - Increments `views` + updates `lastViewedAt` after the response
 * - Strips `lead.email` from the response so it isn't leaked to anyone with the URL
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const corsHeaders = buildCorsHeaders(request, "GET, OPTIONS", "Content-Type");
	const responseHeaders = { ...corsHeaders, "Cache-Control": "no-store" };
	const { id } = await params;

	if (!isValidReportId(id)) {
		return NextResponse.json(
			{ error: "Invalid report ID format" },
			{ status: 400, headers: responseHeaders },
		);
	}

	try {
		const ref = db.collection(REPORTS_COLLECTION).doc(id);
		const snap = await ref.get();

		if (!snap.exists) {
			return NextResponse.json(
				{ error: "Report not found" },
				{ status: 404, headers: responseHeaders },
			);
		}

		const data = snap.data();
		if (!data) {
			return NextResponse.json(
				{ error: "Report data unavailable" },
				{ status: 500, headers: responseHeaders },
			);
		}
		const publicLead = {
			name: data.lead?.name || "",
			company: data.lead?.company || "",
			url: data.lead?.url || "",
		};

		after(async () => {
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

		return NextResponse.json(
			{
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
			},
			{ headers: responseHeaders },
		);
	} catch (err) {
		console.error(
			"Report fetch failed:",
			err instanceof Error ? err.message : err,
		);
		return NextResponse.json(
			{ error: "Failed to fetch report" },
			{ status: 500, headers: responseHeaders },
		);
	}
}

export async function OPTIONS(request: Request) {
	const corsHeaders = buildCorsHeaders(request, "GET, OPTIONS", "Content-Type");
	return new Response(null, { status: 204, headers: corsHeaders });
}
