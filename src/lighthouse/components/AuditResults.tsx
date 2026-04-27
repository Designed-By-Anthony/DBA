import type { IndexCheckResult } from "@lh/lib/indexCheck";
import type { MozMetrics } from "@lh/lib/mozAnalysis";
import type { Competitor, PlacesResult } from "@lh/lib/places";
import type { SitewideScanResult } from "@lh/lib/sitewideScan";
import React from "react";
import { ScoreRing } from "./ScoreRing";

export interface AuditAiInsight {
	executiveSummary: string;
	conversionScore: number;
	strengths: string[];
	weaknesses: string[];
	prioritizedActions: Array<{
		priority: number;
		action: string;
		impact: "high" | "medium" | "low";
		effort: "high" | "medium" | "low";
	}>;
	copywritingAnalysis: string;
}

export interface AuditData {
	url: string;
	trustScore: number;
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
	conversion: number;
	metrics: {
		fcp: string;
		lcp: string;
		tbt: string;
		cls: string;
	};
	aiInsight?: AuditAiInsight;
	diagnostics?: { failedAuditCount: number; criticalIssue: string };
	sitewide?: SitewideScanResult;
	backlinks?: MozMetrics;
	indexCoverage?: IndexCheckResult;
	places?: PlacesResult;
	competitors?: Competitor[];
}

function formatStars(rating: number | null): string {
	if (rating == null) return "";
	return `${rating.toFixed(1)}★`;
}

export function AuditResults({
	data,
	reportId,
	onReset,
}: {
	data: AuditData;
	reportId?: string | null;
	onReset: () => void;
}) {
	const actions = (data.aiInsight?.prioritizedActions ?? [])
		.slice()
		.sort((a, b) => a.priority - b.priority)
		.slice(0, 5);

	const places = data.places;
	const moz = data.backlinks;
	const index = data.indexCoverage;
	const sitewide = data.sitewide;
	const diag = data.diagnostics;

	return (
		<div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
			<div className="text-center mb-10 border-b border-white/10 pb-8">
				<h2 className="text-3xl font-display font-medium mb-2">
					Audit Complete
				</h2>
				<a
					href={data.url}
					target="_blank"
					rel="noreferrer"
					className="text-primary hover:text-blue-400 transition-colors break-all"
				>
					{data.url}
				</a>
				{reportId ? (
					<p className="mt-3 text-sm text-[rgba(255,255,255,0.55)]">
						Report reference:{" "}
						<span className="font-mono text-[rgba(255,255,255,0.78)]">
							{reportId}
						</span>
					</p>
				) : null}
			</div>

			<div className="grid grid-cols-2 gap-8 mb-10 max-w-md mx-auto">
				<ScoreRing score={data.trustScore} label="Trust score" />
				<ScoreRing score={data.conversion} label="Conversion" />
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
				<ScoreRing score={data.performance} label="Performance" />
				<ScoreRing score={data.accessibility} label="Accessibility" />
				<ScoreRing score={data.bestPractices} label="Best Practices" />
				<ScoreRing score={data.seo} label="SEO" />
			</div>

			{data.aiInsight?.executiveSummary ? (
				<div className="bg-[#0d1117] rounded-xl p-6 mb-8 border border-white/10">
					<h3 className="text-xl font-display mb-4">Summary</h3>
					<p className="text-[rgba(255,255,255,0.88)] leading-relaxed whitespace-pre-wrap">
						{data.aiInsight.executiveSummary}
					</p>
				</div>
			) : null}

			{actions.length > 0 ? (
				<div className="bg-[#0d1117] rounded-xl p-6 mb-8 border border-white/10">
					<h3 className="text-xl font-display mb-4">Priority actions</h3>
					<ol className="space-y-3 list-decimal list-inside text-[rgba(255,255,255,0.88)]">
						{actions.map((item) => (
							<li
								key={`${item.priority}-${item.action}-${item.impact}-${item.effort}`}
								className="leading-relaxed pl-1"
							>
								<span className="font-medium">{item.action}</span>
								<span className="text-slate-500 text-sm ml-2">
									({item.impact} impact · {item.effort} effort)
								</span>
							</li>
						))}
					</ol>
				</div>
			) : null}

			{places?.found &&
			(places.rating != null || places.userRatingCount > 0) ? (
				<div className="rounded-xl p-4 mb-8 border border-white/10 bg-white/[0.03]">
					<h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
						Local listing signal
					</h3>
					<p className="text-[rgba(255,255,255,0.88)]">
						{formatStars(places.rating)}
						{places.userRatingCount > 0
							? ` · ${places.userRatingCount} review${places.userRatingCount === 1 ? "" : "s"}`
							: ""}
						{places.primaryType ? ` · ${places.primaryType}` : ""}
					</p>
				</div>
			) : null}

			{diag?.criticalIssue ? (
				<div className="rounded-xl p-4 mb-8 border border-warning/30 bg-warning/5 text-sm text-[rgba(255,255,255,0.85)]">
					<span className="font-medium text-warning">Notable issue: </span>
					{diag.criticalIssue}
				</div>
			) : null}

			{moz?.found ? (
				<div className="bg-[#0d1117] rounded-xl p-6 mb-8 border border-white/10">
					<h3 className="text-xl font-display mb-4">
						Authority &amp; backlinks
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
						<div>
							<p className="text-slate-400 mb-1">Domain authority</p>
							<p className="font-medium text-lg">
								{moz.domainAuthority ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-slate-400 mb-1">Page authority</p>
							<p className="font-medium text-lg">{moz.pageAuthority ?? "—"}</p>
						</div>
						<div>
							<p className="text-slate-400 mb-1">Linking domains</p>
							<p className="font-medium text-lg">
								{moz.linkingRootDomains ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-slate-400 mb-1">Spam score</p>
							<p className="font-medium text-lg">{moz.spamScore ?? "—"}</p>
						</div>
					</div>
				</div>
			) : null}

			{index?.found && index.estimatedIndexedPages != null ? (
				<div className="rounded-xl p-4 mb-8 border border-white/10 bg-white/[0.03]">
					<h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
						Index coverage (estimate)
					</h3>
					<p className="text-[rgba(255,255,255,0.88)]">
						~{index.estimatedIndexedPages.toLocaleString()} pages (
						{index.source})
					</p>
				</div>
			) : null}

			{sitewide ? (
				<div className="rounded-xl p-4 mb-8 border border-white/10 bg-white/[0.03] text-sm">
					<h3 className="font-semibold text-slate-400 uppercase tracking-wider mb-2">
						Site crawl signals
					</h3>
					<ul className="space-y-1 text-[rgba(255,255,255,0.78)]">
						<li>
							robots.txt:{" "}
							{sitewide.robotsTxt.exists
								? sitewide.robotsTxt.allowsCrawlers
									? "allows crawlers"
									: "may restrict crawlers"
								: "not found"}
						</li>
						<li>
							XML sitemap:{" "}
							{sitewide.sitemap.exists
								? `${sitewide.sitemap.urlCount.toLocaleString()} URL${sitewide.sitemap.urlCount === 1 ? "" : "s"}`
								: "not found"}
						</li>
						<li>
							HTTPS / redirects:{" "}
							{sitewide.redirectChain.httpToHttps
								? "HTTP→HTTPS"
								: "check mixed content"}
							{sitewide.redirectChain.chainLength > 1
								? ` · ${sitewide.redirectChain.chainLength} hops`
								: ""}
						</li>
					</ul>
				</div>
			) : null}

			{data.competitors && data.competitors.length > 0 ? (
				<div className="bg-[#0d1117] rounded-xl p-6 mb-8 border border-white/10">
					<h3 className="text-xl font-display mb-4">Competitive snapshot</h3>
					<ul className="space-y-2 text-sm text-[rgba(255,255,255,0.85)]">
						{data.competitors.slice(0, 4).map((c) => (
							<li
								key={`${c.name}-${c.reviewCount}-${c.rating ?? "na"}`}
								className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 border-b border-white/5 pb-2 last:border-0"
							>
								<span className="font-medium">{c.name}</span>
								<span className="text-slate-500">
									{c.rating != null ? `${c.rating.toFixed(1)}★` : ""}
									{c.reviewCount > 0 ? ` · ${c.reviewCount} reviews` : ""}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}

			<div className="bg-[#0d1117] rounded-xl p-6 mb-8 border border-white/10">
				<h3 className="text-xl font-display mb-6">Key lab metrics</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<p className="text-slate-400 text-sm mb-1">
							First Contentful Paint
						</p>
						<p className="font-medium text-lg">{data.metrics.fcp || "-"}</p>
					</div>
					<div>
						<p className="text-slate-400 text-sm mb-1">
							Largest Contentful Paint
						</p>
						<p className="font-medium text-lg">{data.metrics.lcp || "-"}</p>
					</div>
					<div>
						<p className="text-slate-400 text-sm mb-1">Total Blocking Time</p>
						<p className="font-medium text-lg">{data.metrics.tbt || "-"}</p>
					</div>
					<div>
						<p className="text-slate-400 text-sm mb-1">
							Cumulative Layout Shift
						</p>
						<p className="font-medium text-lg">{data.metrics.cls || "-"}</p>
					</div>
				</div>
			</div>

			<div className="flex justify-center mt-10">
				<button
					type="button"
					onClick={onReset}
					className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full transition-all border border-white/10"
				>
					Run Another Audit
				</button>
			</div>
		</div>
	);
}
