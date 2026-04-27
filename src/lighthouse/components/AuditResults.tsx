import type { IndexCheckResult } from "@lh/lib/indexCheck";
import type { MozMetrics } from "@lh/lib/mozAnalysis";
import type { Competitor, PlacesResult } from "@lh/lib/places";
import type { SitewideScanResult } from "@lh/lib/sitewideScan";
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
		<div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 md:mx-auto">
			<div className="mb-10 border-b border-white/[0.08] pb-8 text-center">
				<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/85">
					Scan complete
				</p>
				<h2 className="mb-2 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
					Your results
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

			<div className="mx-auto mb-10 grid max-w-lg grid-cols-2 gap-8">
				<ScoreRing score={data.trustScore} label="Trust score" />
				<ScoreRing score={data.conversion} label="Conversion" />
			</div>

			<div className="mb-12 grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
				<ScoreRing score={data.performance} label="Performance" />
				<ScoreRing score={data.accessibility} label="Accessibility" />
				<ScoreRing score={data.bestPractices} label="Best Practices" />
				<ScoreRing score={data.seo} label="SEO" />
			</div>

			{data.aiInsight?.executiveSummary ? (
				<div className="lighthouse-result-panel mb-8 p-6 md:p-7">
					<h3 className="mb-4 font-display text-xl font-semibold text-white">
						Summary
					</h3>
					<p className="text-[rgba(255,255,255,0.88)] leading-relaxed whitespace-pre-wrap">
						{data.aiInsight.executiveSummary}
					</p>
				</div>
			) : null}

			{actions.length > 0 ? (
				<div className="lighthouse-result-panel mb-8 p-6 md:p-7">
					<h3 className="mb-4 font-display text-xl font-semibold text-white">
						Priority actions
					</h3>
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
				<div className="lighthouse-result-panel mb-8 p-5">
					<h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-200/70">
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
				<div className="mb-8 rounded-xl border border-amber-500/35 bg-amber-950/25 p-4 text-sm text-[rgba(255,255,255,0.88)]">
					<span className="font-medium text-warning">Notable issue: </span>
					{diag.criticalIssue}
				</div>
			) : null}

			{moz?.found ? (
				<div className="lighthouse-result-panel mb-8 p-6 md:p-7">
					<h3 className="mb-1 font-display text-xl font-semibold text-white">
						Authority &amp; backlinks
					</h3>
					{moz.dataSource === "internal" ? (
						<p className="mb-4 text-xs leading-relaxed text-amber-200/85">
							{moz.authorityLabel ??
								"On-page estimate from your homepage crawl — not Moz Domain Authority or Ahrefs DR. Use for direction only."}
						</p>
					) : (
						<p className="mb-4 text-xs text-slate-500">
							Moz Link Explorer metrics for this domain.
						</p>
					)}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
						<div>
							<p className="text-slate-400 mb-1">
								{moz.dataSource === "internal"
									? "Authority estimate"
									: "Domain authority"}
							</p>
							<p className="font-medium text-lg">
								{moz.domainAuthority ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-slate-400 mb-1">
								{moz.dataSource === "internal"
									? "Page estimate"
									: "Page authority"}
							</p>
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
				<div className="lighthouse-result-panel mb-8 p-5">
					<h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-sky-200/70">
						Index coverage (estimate)
					</h3>
					<p className="text-[rgba(255,255,255,0.88)]">
						~{index.estimatedIndexedPages.toLocaleString()} pages (
						{index.source})
					</p>
				</div>
			) : null}

			{sitewide ? (
				<div className="lighthouse-result-panel mb-8 p-5 text-sm">
					<h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-200/70">
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
				<div className="lighthouse-result-panel mb-8 p-6 md:p-7">
					<h3 className="mb-4 font-display text-xl font-semibold text-white">
						Competitive snapshot
					</h3>
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

			<div className="lighthouse-result-panel mb-8 p-6 md:p-7">
				<h3 className="mb-6 font-display text-xl font-semibold text-white">
					Key lab metrics
				</h3>
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

			<div className="mt-10 mb-6 rounded-[1.15rem] border border-emerald-400/35 bg-gradient-to-br from-emerald-500/18 via-teal-500/8 to-cyan-900/20 p-6 md:p-7">
				<h3 className="mb-2 font-display text-xl font-semibold text-white">
					Want help fixing the highest-impact items?
				</h3>
				<p className="mb-4 text-sm leading-relaxed text-white/65 md:text-[15px]">
					Book a 15-minute call with Anthony — we'll walk through your report
					together, prioritize what matters for revenue, and outline the fastest
					path to results.
				</p>
				<a
					href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
					target="_blank"
					rel="noopener"
					className="inline-block rounded-full bg-emerald-400 px-6 py-3 font-semibold text-slate-950 shadow-[0_16px_40px_-20px_rgba(52,211,153,0.65)] transition-[transform,background-color] hover:-translate-y-px hover:bg-emerald-300"
				>
					Book a 15-minute call →
				</a>
			</div>

			<div className="mt-6 flex justify-center">
				<button
					type="button"
					onClick={onReset}
					className="rounded-full border border-white/12 bg-white/[0.06] px-6 py-3 font-medium text-white/90 transition-[background-color,transform] hover:bg-white/10"
				>
					Run another audit
				</button>
			</div>
		</div>
	);
}
