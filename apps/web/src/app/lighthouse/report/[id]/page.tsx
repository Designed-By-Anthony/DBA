"use client";

/**
 * Lighthouse magic-link report viewer.
 *
 * Phase-3 #8: emails sent from `auditSummaryEmail.ts` link customers to
 * `/report/{id}`, which middleware redirects 308 to `/lighthouse/report/{id}`.
 * Before this page existed the redirect destination was a 404 — the user saw
 * the branded not-found page (Anthony reported it as "redirects to home").
 *
 * This page fetches the persisted report from the API and reuses the same
 * `AuditResults` UI that runs immediately after a fresh scan. The "Print /
 * Save as PDF" CTA in that toolbar already points to the dedicated
 * `/print` sub-route (phase-3 #10).
 */

import type { AuditAiInsight, AuditData } from "@lh/auditReport";
import { AuditResults } from "@lh/components/AuditResults";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toAuditData(json: Record<string, unknown>): AuditData {
	const scores = (json.scores as Record<string, unknown>) ?? {};
	const metrics = (json.metrics as Record<string, unknown>) ?? {};
	const lead = (json.lead as Record<string, unknown>) ?? {};

	/* Only synthesize aiInsight / diagnostics when the API actually returned
	   them — `AuditData` declares both as optional, and `AuditResults` uses
	   optional chaining to hide the corresponding sections when absent. */
	let aiInsight: AuditAiInsight | undefined;
	if (isObject(json.aiInsight)) {
		const ai = json.aiInsight;
		aiInsight = {
			executiveSummary: String(ai.executiveSummary ?? ""),
			conversionScore: Number(ai.conversionScore ?? 0),
			strengths: Array.isArray(ai.strengths) ? (ai.strengths as string[]) : [],
			weaknesses: Array.isArray(ai.weaknesses)
				? (ai.weaknesses as string[])
				: [],
			prioritizedActions: Array.isArray(ai.prioritizedActions)
				? (ai.prioritizedActions as AuditAiInsight["prioritizedActions"])
				: [],
			copywritingAnalysis: String(ai.copywritingAnalysis ?? ""),
		};
	}

	let diagnostics: AuditData["diagnostics"];
	if (isObject(json.diagnostics)) {
		const diag = json.diagnostics;
		diagnostics = {
			failedAuditCount: Number(diag.failedAuditCount ?? 0),
			criticalIssue: String(diag.criticalIssue ?? ""),
		};
	}

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
			typeof json.psiDegradedReason === "string"
				? json.psiDegradedReason
				: null,
		aiInsight,
		diagnostics,
		/* The report API returns `data.sitewide || {}` for legacy reports,
		   and AuditResults dereferences `sitewide.robotsTxt.exists` without
		   optional chaining once the outer truthiness check passes. Only
		   pass sitewide through when it actually has the expected shape. */
		sitewide:
			isObject(json.sitewide) &&
			isObject((json.sitewide as Record<string, unknown>).robotsTxt)
				? (json.sitewide as unknown as AuditData["sitewide"])
				: undefined,
		backlinks: isObject(json.backlinks)
			? (json.backlinks as unknown as AuditData["backlinks"])
			: undefined,
		indexCoverage: isObject(json.indexCoverage)
			? (json.indexCoverage as unknown as AuditData["indexCoverage"])
			: undefined,
		places: isObject(json.places)
			? (json.places as unknown as AuditData["places"])
			: undefined,
		competitors: Array.isArray(json.competitors)
			? (json.competitors as AuditData["competitors"])
			: [],
	};
}

export default function LighthouseReportViewerPage() {
	const params = useParams();
	const router = useRouter();
	const id = typeof params?.id === "string" ? params.id : "";
	const [data, setData] = useState<AuditData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(
					buildPublicApiUrl(`/api/report/${encodeURIComponent(id)}`),
					{ cache: "no-store" },
				);
				/* Defend against non-JSON error responses (e.g. proxy HTML 502s)
				   so the user never sees a raw `Unexpected token '<'` parser
				   message. Mirrors the pattern in AuditForm.tsx. */
				let json: Record<string, unknown> = {};
				try {
					json = (await res.json()) as Record<string, unknown>;
				} catch {
					/* leave json empty; res.ok branch will surface a friendly error */
				}
				if (!res.ok) {
					throw new Error(
						typeof json.error === "string" ? json.error : "Report not found.",
					);
				}
				if (!cancelled) setData(toAuditData(json));
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
			<main className="lh-report-viewer-state">
				<p>Invalid report link.</p>
				<Link href="/lighthouse" className="lh-report-viewer-back">
					Back to scanner
				</Link>
			</main>
		);
	}

	if (error) {
		return (
			<main className="lh-report-viewer-state">
				<p className="lh-report-viewer-error">{error}</p>
				<p className="lh-report-viewer-help">
					Reports expire after 90 days. If you saved this email link, please
					request a fresh scan to view the latest version.
				</p>
				<Link href="/lighthouse" className="lh-report-viewer-back">
					Run a new scan
				</Link>
			</main>
		);
	}

	if (!data) {
		return (
			<main className="lh-report-viewer-state">
				<p className="lh-report-viewer-loading">Loading your report…</p>
			</main>
		);
	}

	return (
		<main
			id="main-content"
			className="lighthouse-main lh-audit-stage w-full px-5 pt-6 pb-16 md:px-8 md:pb-20 lg:pt-10"
		>
			<div className="lh-audit-panel mx-auto w-full max-w-5xl">
				<AuditResults
					data={data}
					reportId={id}
					onReset={() => router.push("/lighthouse")}
				/>
			</div>
		</main>
	);
}
