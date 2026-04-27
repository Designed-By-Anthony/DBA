"use client";

import type { AuditData } from "@lh/auditReport";
import { buildAuditPdf } from "@lh/lib/auditReportPdf";
import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import { useCallback, useState } from "react";
import { ScoreRing } from "./ScoreRing";

export type { AuditAiInsight, AuditData } from "@lh/auditReport";

function formatStars(rating: number | null): string {
	if (rating == null) return "";
	return `${rating.toFixed(1)}★`;
}

export function AuditResults({
	data,
	reportId,
	onReset,
	contactEmail,
	contactName,
}: {
	data: AuditData;
	reportId?: string | null;
	onReset: () => void;
	/** For “Email summary” Resend delivery */
	contactEmail?: string;
	contactName?: string;
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

	const [emailStatus, setEmailStatus] = useState<
		"idle" | "sending" | "sent" | "error"
	>("idle");
	const [emailErr, setEmailErr] = useState("");
	const prefersReduced = useReducedMotion();

	const handleDownloadPdf = useCallback(async () => {
		const blob = buildAuditPdf(data, reportId ?? null);
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		const host = (() => {
			try {
				return new URL(data.url).hostname.replace(/^www\./, "") || "audit";
			} catch {
				return "audit";
			}
		})();
		a.download = `audit-${host}-${reportId ?? "report"}.pdf`;
		a.click();
		URL.revokeObjectURL(a.href);
	}, [data, reportId]);

	const handlePrintView = useCallback(() => {
		if (!reportId) return;
		window.open(
			`/lighthouse/report/${encodeURIComponent(reportId)}/print`,
			"_blank",
			"noopener,noreferrer",
		);
	}, [reportId]);

	const handleEmailSummary = useCallback(async () => {
		const to = contactEmail?.trim();
		if (!to) {
			setEmailErr("No email on this session.");
			setEmailStatus("error");
			return;
		}
		setEmailStatus("sending");
		setEmailErr("");
		try {
			const res = await fetch("/api/audit/email-summary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: to,
					name: contactName ?? "",
					reportId: reportId ?? null,
					url: data.url,
					trustScore: data.trustScore,
					performance: data.performance,
					accessibility: data.accessibility,
					bestPractices: data.bestPractices,
					seo: data.seo,
					psiDegradedReason: data.psiDegradedReason ?? null,
				}),
			});
			const j = (await res.json().catch(() => ({}))) as { error?: string };
			if (!res.ok) {
				throw new Error(j.error || "Could not send email.");
			}
			setEmailStatus("sent");
		} catch (e) {
			setEmailErr(e instanceof Error ? e.message : "Email failed.");
			setEmailStatus("error");
		}
	}, [contactEmail, contactName, data, reportId]);

	return (
		<MotionDiv
			className="w-full max-w-4xl md:mx-auto"
			initial={prefersReduced ? false : { opacity: 0, y: 28 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
		>
			{data.psiDegradedReason ? (
				<MotionDiv
					className="mb-8 rounded-[1.1rem] border border-amber-400/30 bg-gradient-to-br from-amber-950/50 to-[rgba(20,14,8,0.45)] px-5 py-5 text-sm leading-relaxed text-amber-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
					role="status"
					initial={prefersReduced ? false : { opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
						Heads up
					</p>
					<strong className="font-display text-base font-semibold text-amber-100">
						Partial report
					</strong>
					<p className="mt-2 text-amber-50/90">{data.psiDegradedReason}</p>
				</MotionDiv>
			) : null}

			<div className="lighthouse-results-hero mb-10 text-center">
				<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
					Scan complete
				</p>
				<h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-[2.1rem] md:leading-tight">
					Your results
				</h2>
				<p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
					Premium diagnostic snapshot — same craft as the rest of our site.
				</p>
				<a
					href={data.url}
					target="_blank"
					rel="noreferrer"
					className="mt-4 inline-block max-w-full break-all rounded-lg border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100/95 transition hover:border-sky-400/40 hover:bg-sky-500/15"
				>
					{data.url}
				</a>
				{reportId ? (
					<p className="mt-4 text-xs uppercase tracking-wider text-white/40">
						Report reference
					</p>
				) : null}
				{reportId ? (
					<p className="mt-1 font-mono text-sm text-white/75">{reportId}</p>
				) : null}
			</div>

			<MotionDiv
				className="lighthouse-actions-toolbar print:hidden mx-auto mb-10 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
				initial={prefersReduced ? false : { opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.12, duration: 0.45 }}
			>
				<MotionDiv
					whileTap={{ scale: 0.98 }}
					className="sm:flex-1 sm:min-w-[140px]"
				>
					<button
						type="button"
						onClick={handleDownloadPdf}
						className="lighthouse-btn-primary w-full"
					>
						Download PDF
					</button>
				</MotionDiv>
				<MotionDiv
					whileTap={{ scale: 0.98 }}
					className="sm:flex-1 sm:min-w-[140px]"
				>
					<button
						type="button"
						onClick={handlePrintView}
						disabled={!reportId}
						className="lighthouse-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-45"
					>
						Print / save as PDF
					</button>
				</MotionDiv>
				<MotionDiv
					whileTap={{ scale: 0.98 }}
					className="sm:flex-1 sm:min-w-[140px]"
				>
					<button
						type="button"
						onClick={handleEmailSummary}
						disabled={emailStatus === "sending" || !contactEmail?.trim()}
						className="lighthouse-btn-emerald w-full disabled:cursor-not-allowed disabled:opacity-45"
					>
						{emailStatus === "sending"
							? "Sending…"
							: emailStatus === "sent"
								? "Emailed ✓"
								: "Email summary"}
					</button>
				</MotionDiv>
			</MotionDiv>
			{emailStatus === "error" && emailErr ? (
				<p
					className="print:hidden mb-6 rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-center text-sm text-rose-100"
					role="alert"
				>
					{emailErr}
				</p>
			) : null}

			<MotionDiv
				className="mx-auto mb-10 grid max-w-lg grid-cols-2 gap-6 md:gap-8"
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
				}}
				initial={prefersReduced ? false : "hidden"}
				animate="show"
			>
				<MotionDiv
					variants={{
						hidden: { opacity: 0, y: 16 },
						show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
					}}
					className="lighthouse-score-card"
				>
					<ScoreRing score={data.trustScore} label="Trust score" />
				</MotionDiv>
				<MotionDiv
					variants={{
						hidden: { opacity: 0, y: 16 },
						show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
					}}
					className="lighthouse-score-card"
				>
					<ScoreRing score={data.conversion} label="Conversion" />
				</MotionDiv>
			</MotionDiv>

			<MotionDiv
				className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5"
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
				}}
				initial={prefersReduced ? false : "hidden"}
				animate="show"
			>
				{(
					[
						[data.performance, "Performance"],
						[data.accessibility, "Accessibility"],
						[data.bestPractices, "Best Practices"],
						[data.seo, "SEO"],
					] as const
				).map(([score, label]) => (
					<MotionDiv
						key={label}
						variants={{
							hidden: { opacity: 0, y: 20, scale: 0.94 },
							show: {
								opacity: 1,
								y: 0,
								scale: 1,
								transition: { type: "spring", stiffness: 260, damping: 22 },
							},
						}}
						className="lighthouse-score-card"
					>
						<ScoreRing score={score} label={label} />
					</MotionDiv>
				))}
			</MotionDiv>

			{data.aiInsight?.executiveSummary ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				>
					<p className="lighthouse-result-eyebrow">Executive readout</p>
					<h3 className="lighthouse-result-heading">Summary</h3>
					<p className="lighthouse-result-body whitespace-pre-wrap">
						{data.aiInsight.executiveSummary}
					</p>
				</MotionDiv>
			) : null}

			{actions.length > 0 ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, delay: 0.05 }}
				>
					<p className="lighthouse-result-eyebrow">What to fix first</p>
					<h3 className="lighthouse-result-heading">Priority actions</h3>
					<ol className="list-inside list-decimal space-y-4 lighthouse-result-body">
						{actions.map((item) => (
							<li
								key={`${item.priority}-${item.action}-${item.impact}-${item.effort}`}
								className="rounded-lg border border-white/[0.06] bg-white/[0.03] py-3 pl-4 pr-3 leading-relaxed"
							>
								<span className="font-semibold text-white/95">
									{item.action}
								</span>
								<span className="ml-2 text-sm lighthouse-result-muted">
									({item.impact} impact · {item.effort} effort)
								</span>
							</li>
						))}
					</ol>
				</MotionDiv>
			) : null}

			{places?.found &&
			(places.rating != null || places.userRatingCount > 0) ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-5"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Maps &amp; reputation</p>
					<h3 className="lighthouse-result-heading text-lg">
						Local listing signal
					</h3>
					<p className="lighthouse-result-body">
						{formatStars(places.rating)}
						{places.userRatingCount > 0
							? ` · ${places.userRatingCount} review${places.userRatingCount === 1 ? "" : "s"}`
							: ""}
						{places.primaryType ? ` · ${places.primaryType}` : ""}
					</p>
				</MotionDiv>
			) : null}

			{diag?.criticalIssue ? (
				<MotionDiv
					className="mb-8 rounded-xl border border-amber-500/35 bg-amber-950/25 p-4 text-sm text-[rgba(255,255,255,0.88)]"
					initial={prefersReduced ? false : { opacity: 0, x: -8 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4 }}
				>
					<span className="font-medium text-warning">Notable issue: </span>
					{diag.criticalIssue}
				</MotionDiv>
			) : null}

			{moz?.found ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 18 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.5 }}
				>
					<p className="lighthouse-result-eyebrow">Link profile</p>
					<h3 className="lighthouse-result-heading">
						Authority &amp; backlinks
					</h3>
					{moz.dataSource === "internal" ? (
						<p className="mb-4 text-xs leading-relaxed text-amber-200/90">
							{moz.authorityLabel ??
								"On-page estimate from your homepage crawl — not Moz Domain Authority or Ahrefs DR. Use for direction only."}
						</p>
					) : (
						<p className="mb-4 text-xs lighthouse-result-muted">
							Moz Link Explorer metrics for this domain.
						</p>
					)}
					<div className="grid grid-cols-2 gap-3 text-center text-sm md:grid-cols-4 md:gap-4">
						<div className="lighthouse-metric-tile">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-wider lighthouse-result-muted">
								{moz.dataSource === "internal"
									? "Authority estimate"
									: "Domain authority"}
							</p>
							<p className="font-display text-xl font-semibold text-white">
								{moz.domainAuthority ?? "—"}
							</p>
						</div>
						<div className="lighthouse-metric-tile">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-wider lighthouse-result-muted">
								{moz.dataSource === "internal"
									? "Page estimate"
									: "Page authority"}
							</p>
							<p className="font-display text-xl font-semibold text-white">
								{moz.pageAuthority ?? "—"}
							</p>
						</div>
						<div className="lighthouse-metric-tile">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-wider lighthouse-result-muted">
								Linking domains
							</p>
							<p className="font-display text-xl font-semibold text-white">
								{moz.linkingRootDomains ?? "—"}
							</p>
						</div>
						<div className="lighthouse-metric-tile">
							<p className="mb-1 text-[11px] font-semibold uppercase tracking-wider lighthouse-result-muted">
								Spam score
							</p>
							<p className="font-display text-xl font-semibold text-white">
								{moz.spamScore ?? "—"}
							</p>
						</div>
					</div>
				</MotionDiv>
			) : null}

			{index?.found && index.estimatedIndexedPages != null ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-5"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Search footprint</p>
					<h3 className="lighthouse-result-heading text-lg">
						Index coverage (estimate)
					</h3>
					<p className="lighthouse-result-body">
						~{index.estimatedIndexedPages.toLocaleString()} pages (
						{index.source})
					</p>
				</MotionDiv>
			) : null}

			{sitewide ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-5 text-sm"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Technical crawl</p>
					<h3 className="lighthouse-result-heading text-lg">
						Site crawl signals
					</h3>
					<ul className="space-y-2 lighthouse-result-body">
						<li className="flex flex-wrap gap-x-2 border-b border-white/[0.05] py-2 last:border-0">
							<span className="font-medium text-sky-200/85">robots.txt</span>
							<span className="lighthouse-result-muted">
								{sitewide.robotsTxt.exists
									? sitewide.robotsTxt.allowsCrawlers
										? "allows crawlers"
										: "may restrict crawlers"
									: "not found"}
							</span>
						</li>
						<li className="flex flex-wrap gap-x-2 border-b border-white/[0.05] py-2 last:border-0">
							<span className="font-medium text-sky-200/85">XML sitemap</span>
							<span className="lighthouse-result-muted">
								{sitewide.sitemap.exists
									? `${sitewide.sitemap.urlCount.toLocaleString()} URL${sitewide.sitemap.urlCount === 1 ? "" : "s"}`
									: "not found"}
							</span>
						</li>
						<li className="flex flex-wrap gap-x-2 py-2">
							<span className="font-medium text-sky-200/85">
								HTTPS / redirects
							</span>
							<span className="lighthouse-result-muted">
								{sitewide.redirectChain.httpToHttps
									? "HTTP→HTTPS"
									: "check mixed content"}
								{sitewide.redirectChain.chainLength > 1
									? ` · ${sitewide.redirectChain.chainLength} hops`
									: ""}
							</span>
						</li>
					</ul>
				</MotionDiv>
			) : null}

			{data.competitors && data.competitors.length > 0 ? (
				<MotionDiv
					className="lighthouse-result-panel mb-8 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<p className="lighthouse-result-eyebrow">Market context</p>
					<h3 className="lighthouse-result-heading">Competitive snapshot</h3>
					<ul className="space-y-2 text-sm">
						{data.competitors.slice(0, 4).map((c) => (
							<li
								key={`${c.name}-${c.reviewCount}-${c.rating ?? "na"}`}
								className="flex flex-col rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-baseline sm:gap-2"
							>
								<span className="font-semibold text-white/95">{c.name}</span>
								<span className="lighthouse-result-muted">
									{c.rating != null ? `${c.rating.toFixed(1)}★` : ""}
									{c.reviewCount > 0 ? ` · ${c.reviewCount} reviews` : ""}
								</span>
							</li>
						))}
					</ul>
				</MotionDiv>
			) : null}

			<MotionDiv
				className="lighthouse-result-panel mb-8 p-6 md:p-7"
				initial={prefersReduced ? false : { opacity: 0, y: 16 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<p className="lighthouse-result-eyebrow">Lab vitals</p>
				<h3 className="lighthouse-result-heading">Key lab metrics</h3>
				<div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4 md:gap-4">
					<div className="lighthouse-metric-tile">
						<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider lighthouse-result-muted">
							First Contentful Paint
						</p>
						<p className="font-display text-lg font-semibold text-white">
							{data.metrics.fcp || "—"}
						</p>
					</div>
					<div className="lighthouse-metric-tile">
						<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider lighthouse-result-muted">
							Largest Contentful Paint
						</p>
						<p className="font-display text-lg font-semibold text-white">
							{data.metrics.lcp || "—"}
						</p>
					</div>
					<div className="lighthouse-metric-tile">
						<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider lighthouse-result-muted">
							Total Blocking Time
						</p>
						<p className="font-display text-lg font-semibold text-white">
							{data.metrics.tbt || "—"}
						</p>
					</div>
					<div className="lighthouse-metric-tile">
						<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider lighthouse-result-muted">
							Cumulative Layout Shift
						</p>
						<p className="font-display text-lg font-semibold text-white">
							{data.metrics.cls || "—"}
						</p>
					</div>
				</div>
			</MotionDiv>

			<MotionDiv
				className="print:hidden relative mt-10 mb-6 overflow-hidden rounded-[1.2rem] border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-teal-900/25 to-cyan-950/35 p-6 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.25)] md:p-8"
				initial={prefersReduced ? false : { opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.55 }}
				whileHover={prefersReduced ? undefined : { scale: 1.01 }}
			>
				<div
					className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
					aria-hidden
				/>
				<p className="relative mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
					Next step
				</p>
				<h3 className="relative mb-3 font-display text-xl font-bold tracking-tight text-white md:text-2xl">
					Want help fixing the highest-impact items?
				</h3>
				<p className="relative mb-5 max-w-xl text-sm leading-relaxed text-white/70 md:text-[15px]">
					Book a 15-minute call with Anthony — we'll walk through your report
					together, prioritize what matters for revenue, and outline the fastest
					path to results.
				</p>
				<a
					href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
					target="_blank"
					rel="noopener"
					className="relative inline-block rounded-xl bg-emerald-400 px-7 py-3.5 text-sm font-bold tracking-tight text-slate-950 shadow-[0_20px_50px_-18px_rgba(52,211,153,0.55)] transition-[transform,background-color] hover:-translate-y-px hover:bg-emerald-300"
				>
					Book a 15-minute call →
				</a>
			</MotionDiv>

			<div className="mt-8 flex justify-center print:hidden">
				<button
					type="button"
					onClick={onReset}
					className="rounded-full border border-white/15 bg-white/[0.05] px-8 py-3 text-sm font-semibold text-white/85 transition-[background-color,transform] hover:bg-white/[0.1]"
				>
					Run another audit
				</button>
			</div>
		</MotionDiv>
	);
}
