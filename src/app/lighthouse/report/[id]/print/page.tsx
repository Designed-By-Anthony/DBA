"use client";

import type { AuditAiInsight, AuditData } from "@lh/auditReport";
import { AuditResults } from "@lh/components/AuditResults";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LighthouseReportPrintPage() {
	const params = useParams();
	const id = typeof params?.id === "string" ? params.id : "";
	const [data, setData] = useState<AuditData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/report/${encodeURIComponent(id)}`, {
					cache: "no-store",
				});
				const json = (await res.json()) as Record<string, unknown>;
				if (!res.ok) {
					throw new Error(
						typeof json.error === "string" ? json.error : "Report not found.",
					);
				}
				const scores = (json.scores as Record<string, unknown>) ?? {};
				const metrics = (json.metrics as Record<string, unknown>) ?? {};
				const ai = (json.aiInsight as Record<string, unknown>) ?? {};
				const diag = (json.diagnostics as Record<string, unknown>) ?? {};
				const actionsRaw = Array.isArray(ai.prioritizedActions)
					? ai.prioritizedActions
					: [];
				const prioritizedActions =
					actionsRaw as AuditAiInsight["prioritizedActions"];

				const audit: AuditData = {
					url: String((json.lead as Record<string, unknown>)?.url ?? ""),
					trustScore: Number(scores.trustScore ?? 0),
					performance:
						scores.performance === null || scores.performance === undefined
							? null
							: Number(scores.performance),
					accessibility:
						scores.accessibility === null || scores.accessibility === undefined
							? null
							: Number(scores.accessibility),
					bestPractices:
						scores.bestPractices === null || scores.bestPractices === undefined
							? null
							: Number(scores.bestPractices),
					seo:
						scores.seo === null || scores.seo === undefined
							? null
							: Number(scores.seo),
					conversion: Number(scores.conversion ?? 0),
					metrics: {
						fcp: String(metrics.fcp ?? "—"),
						lcp: String(metrics.lcp ?? "—"),
						tbt: String(metrics.tbt ?? "—"),
						cls: String(metrics.cls ?? "—"),
					},
					psiDegradedReason:
						typeof json.psiDegradedReason === "string"
							? json.psiDegradedReason
							: null,
					aiInsight: {
						executiveSummary: String(ai.executiveSummary ?? ""),
						conversionScore: Number(ai.conversionScore ?? 0),
						strengths: Array.isArray(ai.strengths)
							? (ai.strengths as string[])
							: [],
						weaknesses: Array.isArray(ai.weaknesses)
							? (ai.weaknesses as string[])
							: [],
						prioritizedActions,
						copywritingAnalysis: String(ai.copywritingAnalysis ?? ""),
					},
					diagnostics: {
						failedAuditCount: Number(diag.failedAuditCount ?? 0),
						criticalIssue: String(diag.criticalIssue ?? ""),
					},
					sitewide: json.sitewide as AuditData["sitewide"],
					backlinks: json.backlinks as AuditData["backlinks"],
					indexCoverage: json.indexCoverage as AuditData["indexCoverage"],
					places: json.places as AuditData["places"],
					competitors: Array.isArray(json.competitors)
						? (json.competitors as AuditData["competitors"])
						: [],
				};

				if (!cancelled) setData(audit);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load report.");
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	if (!id) {
		return (
			<main className="min-h-screen bg-slate-950 p-8 text-white">
				<p>Invalid report link.</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="min-h-screen bg-slate-950 p-8 text-white">
				<p>{error}</p>
				<Link
					href="/lighthouse"
					className="mt-4 inline-block text-sky-400 underline"
				>
					Back to scanner
				</Link>
			</main>
		);
	}

	if (!data) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
				<p>Loading report…</p>
			</main>
		);
	}

	return (
		<main className="audit-print-root min-h-screen bg-slate-950 px-6 py-10 text-white print:bg-white print:text-slate-900 print:px-4 print:py-6">
			<div className="mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-4 print:hidden">
				<p className="text-sm text-white/60">
					Print or save as PDF from your browser.
				</p>
				<button
					type="button"
					onClick={() => window.print()}
					className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-sky-400"
				>
					Print / Save as PDF
				</button>
			</div>
			<div className="print-report-shell mx-auto max-w-4xl">
				<AuditResults data={data} reportId={id} onReset={() => {}} />
			</div>
		</main>
	);
}
