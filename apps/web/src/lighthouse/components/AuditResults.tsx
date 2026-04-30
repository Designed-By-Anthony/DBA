"use client";

import type { AuditData } from "@lh/auditReport";
import { buildAuditPdf } from "@lh/lib/auditReportPdf";
import { useReducedMotion } from "framer-motion";
import { div as MotionDiv } from "framer-motion/client";
import { useCallback, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";
import { ScoreRing } from "./ScoreRing";

export type { AuditAiInsight, AuditData } from "@lh/auditReport";

function formatStars(rating: number | null): string {
	if (rating == null) return "";
	return `${rating.toFixed(1)}★`;
}

function sanitizeHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/\son\w+="[^"]*"/gi, "")
		.replace(/\son\w+='[^']*'/gi, "");
}

function ExecutiveSummaryBody({ text }: { text: string }) {
	const isHtml = /<[a-z][\s\S]*>/i.test(text);
	if (isHtml) {
		return (
			<div
				className="lighthouse-result-body lighthouse-prose"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional sanitized HTML from trusted AI summary pipeline
				dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
			/>
		);
	}
	return (
		<div className="lighthouse-result-body space-y-3">
			{text
				.split(/\n\n+/)
				.filter(Boolean)
				.map((para, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: paragraph index is stable
					<p key={i}>{para}</p>
				))}
		</div>
	);
}

type ImpactLevel = "high" | "medium" | "low";

function impactChipClass(level: ImpactLevel): string {
	return level === "high"
		? "lh-chip lh-chip--high-impact"
		: level === "medium"
			? "lh-chip lh-chip--medium-impact"
			: "lh-chip lh-chip--low-impact";
}

function effortChipClass(level: ImpactLevel): string {
	return level === "high"
		? "lh-chip lh-chip--high-effort"
		: level === "medium"
			? "lh-chip lh-chip--medium-effort"
			: "lh-chip lh-chip--low-effort";
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
			const res = await fetch(buildPublicApiUrl("/api/audit/email-summary"), {
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
			className="lh-report-output w-full"
			initial={prefersReduced ? false : { opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
		>
			{/* Degraded report warning */}
			{data.psiDegradedReason ? (
				<MotionDiv
					className="mb-8 rounded-[1.1rem] border border-amber-400/28 bg-linear-to-br from-amber-950/45 to-[rgba(20,14,8,0.4)] px-5 py-5 text-sm leading-relaxed text-amber-50/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
					role="status"
					initial={prefersReduced ? false : { opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/85">
						Heads up
					</p>
					<strong className="font-display text-base font-semibold text-amber-100">
						Partial report
					</strong>
					<p className="mt-2 text-amber-50/88">{data.psiDegradedReason}</p>
				</MotionDiv>
			) : null}

			{/* ── Hero ── */}
			<div className="lighthouse-results-hero lh-report-cover mb-10">
				<div className="lh-report-cover-copy">
					<p className="lh-report-kicker">Report ready</p>
					<h2 className="lh-report-title">Your site audit</h2>
					<p className="lh-report-subtitle">
						Speed, SEO, accessibility, and trust — scored and ranked by what
						matters most for your business.
					</p>
				</div>
				<div className="lh-report-meta-card">
					<p className="lh-report-meta-label">Scanned URL</p>
					<a
						href={data.url}
						target="_blank"
						rel="noreferrer"
						className="lh-report-url"
					>
						{data.url}
					</a>
					{reportId ? (
						<>
							<p className="lh-report-meta-label mt-4">Report reference</p>
							<p className="lh-report-id">{reportId}</p>
						</>
					) : null}
				</div>
			</div>

			{/* ── Action toolbar ── */}
			<MotionDiv
				className="lighthouse-actions-toolbar print:hidden mx-auto mb-10 flex max-w-3xl flex-col gap-4 sm:flex-row sm:justify-center"
				initial={prefersReduced ? false : { opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1, duration: 0.45 }}
			>
				<MotionDiv
					whileTap={{ scale: 0.97 }}
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
					whileTap={{ scale: 0.97 }}
					className="sm:flex-1 sm:min-w-[140px]"
				>
					<button
						type="button"
						onClick={handlePrintView}
						disabled={!reportId}
						className="lighthouse-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-40"
					>
						Print / save as PDF
					</button>
				</MotionDiv>
				<MotionDiv
					whileTap={{ scale: 0.97 }}
					className="sm:flex-1 sm:min-w-[140px]"
				>
					<button
						type="button"
						onClick={handleEmailSummary}
						disabled={emailStatus === "sending" || !contactEmail?.trim()}
						className="lighthouse-btn-emerald w-full disabled:cursor-not-allowed disabled:opacity-40"
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
					className="print:hidden mb-6 rounded-lg border border-rose-500/28 bg-rose-950/38 px-4 py-3 text-center text-sm text-rose-100"
					role="alert"
				>
					{emailErr}
				</p>
			) : null}

			{/* ── Score grid — all 6 in a unified 3-column grid ── */}
			<div className="mb-3">
				<p className="lh-section-label text-center">How your site scored</p>
			</div>
			<MotionDiv
				className="mb-12 grid grid-cols-3 gap-3 md:gap-4"
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
				}}
				initial={prefersReduced ? false : "hidden"}
				animate="show"
			>
				{(
					[
						[data.trustScore, "Trust score"],
						[data.conversion, "Conversion"],
						[data.performance, "Performance"],
						[data.accessibility, "Accessibility"],
						[data.bestPractices, "Best practices"],
						[data.seo, "SEO"],
					] as const
				).map(([score, label]) => (
					<MotionDiv
						key={label}
						variants={{
							hidden: { opacity: 0, y: 18, scale: 0.93 },
							show: {
								opacity: 1,
								y: 0,
								scale: 1,
								transition: { type: "spring", stiffness: 260, damping: 22 },
							},
						}}
					>
						<ScoreRing score={score} label={label} />
					</MotionDiv>
				))}
			</MotionDiv>

			{/* ── Executive summary ── */}
			{data.aiInsight?.executiveSummary ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--sky mb-6 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				>
					<p className="lighthouse-result-eyebrow">Executive readout</p>
					<h3 className="lighthouse-result-heading">Summary</h3>
					<ExecutiveSummaryBody text={data.aiInsight.executiveSummary} />
				</MotionDiv>
			) : null}

			{/* ── Priority actions ── */}
			{actions.length > 0 ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--amber mb-6 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.5, delay: 0.05 }}
				>
					<p className="lighthouse-result-eyebrow">What to fix first</p>
					<h3 className="lighthouse-result-heading">Priority actions</h3>
					<ol className="space-y-3">
						{actions.map((item, idx) => (
							<li
								key={`${item.priority}-${item.action}`}
								className="flex flex-col gap-2 rounded-xl border border-white/6 bg-white/2.5 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4"
							>
								<span className="shrink-0 font-display text-[13px] font-bold text-amber-300/60 sm:w-5 sm:text-right">
									{idx + 1}
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-[14px] font-semibold leading-snug text-white/94">
										{item.action}
									</p>
									<div className="mt-1.5 flex flex-wrap gap-1.5">
										<span className={impactChipClass(item.impact)}>
											{item.impact} impact
										</span>
										<span className={effortChipClass(item.effort)}>
											{item.effort} effort
										</span>
									</div>
								</div>
							</li>
						))}
					</ol>
				</MotionDiv>
			) : null}

			{/* ── Strengths & weaknesses ── */}
			{(data.aiInsight?.strengths?.length ?? 0) > 0 ||
			(data.aiInsight?.weaknesses?.length ?? 0) > 0 ? (
				<MotionDiv
					className="mb-6 grid gap-4 sm:grid-cols-2"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{ duration: 0.48 }}
				>
					{(data.aiInsight?.strengths?.length ?? 0) > 0 ? (
						<div className="lighthouse-result-panel lh-panel--emerald p-5 md:p-6">
							<p className="lighthouse-result-eyebrow">What&apos;s working</p>
							<h3 className="lighthouse-result-heading text-lg">Strengths</h3>
							<ul className="space-y-2">
								{data.aiInsight?.strengths?.map((s) => (
									<li
										key={s}
										className="flex items-start gap-2 text-[13.5px] leading-snug text-white/82"
									>
										<span
											className="mt-0.5 shrink-0 text-emerald-400"
											aria-hidden
										>
											✓
										</span>
										{s}
									</li>
								))}
							</ul>
						</div>
					) : null}
					{(data.aiInsight?.weaknesses?.length ?? 0) > 0 ? (
						<div className="lighthouse-result-panel lh-panel--amber p-5 md:p-6">
							<p className="lighthouse-result-eyebrow">What needs work</p>
							<h3 className="lighthouse-result-heading text-lg">Gaps found</h3>
							<ul className="space-y-2">
								{data.aiInsight?.weaknesses?.map((w) => (
									<li
										key={w}
										className="flex items-start gap-2 text-[13.5px] leading-snug text-white/82"
									>
										<span
											className="mt-0.5 shrink-0 text-amber-400/80"
											aria-hidden
										>
											→
										</span>
										{w}
									</li>
								))}
							</ul>
						</div>
					) : null}
				</MotionDiv>
			) : null}

			{/* ── Local listing ── */}
			{places?.found &&
			(places.rating != null || places.userRatingCount > 0) ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--violet mb-6 p-5 md:p-6"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-40px" }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Maps &amp; reputation</p>
					<h3 className="lighthouse-result-heading text-lg">
						Local listing signal
					</h3>
					<p className="lighthouse-result-body text-white/80">
						{formatStars(places.rating)}
						{places.userRatingCount > 0
							? ` · ${places.userRatingCount} review${places.userRatingCount === 1 ? "" : "s"}`
							: ""}
						{places.primaryType ? ` · ${places.primaryType}` : ""}
					</p>
				</MotionDiv>
			) : null}

			{/* ── Notable issue ── */}
			{diag?.criticalIssue ? (
				<MotionDiv
					className="mb-6 rounded-xl border border-amber-500/32 bg-amber-950/22 p-4 text-[13px] text-white/86"
					initial={prefersReduced ? false : { opacity: 0, x: -8 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4 }}
				>
					<span className="font-semibold text-amber-300/90">
						Notable issue:{" "}
					</span>
					{diag.criticalIssue}
				</MotionDiv>
			) : null}

			{/* ── Authority & backlinks ── */}
			{moz?.found ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--sky mb-6 p-6 md:p-7"
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
						<p className="mb-4 text-[12px] leading-relaxed text-amber-200/85">
							{moz.authorityLabel ??
								"On-page estimate from your homepage crawl — not Moz Domain Authority or Ahrefs DR. Use for direction only."}
						</p>
					) : (
						<p className="mb-4 text-[12px] lighthouse-result-muted">
							Moz Link Explorer metrics for this domain.
						</p>
					)}
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
						{[
							[
								moz.dataSource === "internal"
									? "Authority est."
									: "Domain authority",
								moz.domainAuthority,
							],
							[
								moz.dataSource === "internal" ? "Page est." : "Page authority",
								moz.pageAuthority,
							],
							["Linking domains", moz.linkingRootDomains],
							["Spam score", moz.spamScore],
						].map(([metricLabel, metricVal]) => (
							<div
								key={String(metricLabel)}
								className="lighthouse-metric-tile text-center"
							>
								<p className="mb-2 text-[10px] font-bold uppercase tracking-wider lighthouse-result-muted">
									{metricLabel}
								</p>
								<p className="font-display text-xl font-semibold text-white">
									{metricVal ?? "—"}
								</p>
							</div>
						))}
					</div>
				</MotionDiv>
			) : null}

			{/* ── Index coverage ── */}
			{index?.found && index.estimatedIndexedPages != null ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--emerald mb-6 p-5 md:p-6"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Search footprint</p>
					<h3 className="lighthouse-result-heading text-lg">Index coverage</h3>
					<p className="lighthouse-result-body">
						~{index.estimatedIndexedPages.toLocaleString()} pages in Google's
						index ({index.source})
					</p>
				</MotionDiv>
			) : null}

			{/* ── Copywriting analysis ── */}
			{data.aiInsight?.copywritingAnalysis ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--violet mb-6 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Messaging &amp; copy</p>
					<h3 className="lighthouse-result-heading">Copywriting analysis</h3>
					<ExecutiveSummaryBody text={data.aiInsight.copywritingAnalysis} />
				</MotionDiv>
			) : null}

			{/* ── Site crawl signals ── */}
			{sitewide ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--sky mb-6 p-5 md:p-6 text-[13px]"
					initial={prefersReduced ? false : { opacity: 0, y: 14 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.45 }}
				>
					<p className="lighthouse-result-eyebrow">Technical crawl</p>
					<h3 className="lighthouse-result-heading text-lg">
						Site crawl signals
					</h3>
					<ul className="space-y-0 lighthouse-result-body divide-y divide-white/5">
						<li className="flex flex-wrap gap-x-2 py-2.5">
							<span className="font-semibold text-sky-200/82">robots.txt</span>
							<span className="lighthouse-result-muted">
								{sitewide.robotsTxt.exists
									? sitewide.robotsTxt.allowsCrawlers
										? "allows crawlers"
										: "may restrict crawlers"
									: "not found"}
							</span>
						</li>
						<li className="flex flex-wrap gap-x-2 py-2.5">
							<span className="font-semibold text-sky-200/82">XML sitemap</span>
							<span className="lighthouse-result-muted">
								{sitewide.sitemap.exists
									? `${sitewide.sitemap.urlCount.toLocaleString()} URL${sitewide.sitemap.urlCount === 1 ? "" : "s"}`
									: "not found"}
							</span>
						</li>
						<li className="flex flex-wrap gap-x-2 py-2.5">
							<span className="font-semibold text-sky-200/82">
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

			{/* ── Competitive snapshot ── */}
			{data.competitors && data.competitors.length > 0 ? (
				<MotionDiv
					className="lighthouse-result-panel lh-panel--violet mb-6 p-6 md:p-7"
					initial={prefersReduced ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<p className="lighthouse-result-eyebrow">Market context</p>
					<h3 className="lighthouse-result-heading">Competitive snapshot</h3>
					<ul className="space-y-2 text-[13px]">
						{data.competitors.slice(0, 4).map((c) => (
							<li
								key={`${c.name}-${c.reviewCount}`}
								className="flex flex-col rounded-lg border border-white/5.5 bg-white/2.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-2"
							>
								<span className="font-semibold text-white/94">{c.name}</span>
								<span className="lighthouse-result-muted">
									{c.rating != null ? `${c.rating.toFixed(1)}★` : ""}
									{c.reviewCount > 0 ? ` · ${c.reviewCount} reviews` : ""}
								</span>
							</li>
						))}
					</ul>
				</MotionDiv>
			) : null}

			{/* ── Lab vitals ── */}
			<MotionDiv
				className="lighthouse-result-panel lh-panel--sky mb-6 p-6 md:p-7"
				initial={prefersReduced ? false : { opacity: 0, y: 16 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<p className="lighthouse-result-eyebrow">Lab vitals</p>
				<h3 className="lighthouse-result-heading">Core Web Vitals</h3>
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
					{[
						["First Contentful Paint", data.metrics.fcp],
						["Largest Contentful Paint", data.metrics.lcp],
						["Total Blocking Time", data.metrics.tbt],
						["Cumulative Layout Shift", data.metrics.cls],
					].map(([metricLabel, metricVal]) => (
						<div
							key={String(metricLabel)}
							className="lighthouse-metric-tile text-center"
						>
							<p className="mb-2 text-[10px] font-bold uppercase tracking-wider lighthouse-result-muted leading-tight">
								{metricLabel}
							</p>
							<p className="font-display text-lg font-semibold text-white">
								{metricVal || "—"}
							</p>
						</div>
					))}
				</div>
			</MotionDiv>

			{/* ── CTA ── */}
			<MotionDiv
				className="lh-report-cta print:hidden relative mt-10 mb-6 overflow-hidden rounded-[1.25rem] p-6 md:p-8"
				initial={prefersReduced ? false : { opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.55 }}
			>
				<div
					className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[rgb(var(--accent-bronze-rgb)/0.12)] blur-3xl"
					aria-hidden
				/>
				<p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-(--accent-bronze-muted)">
					Next step
				</p>
				<h3 className="relative mb-3 font-display text-xl font-bold tracking-tight text-white md:text-2xl">
					Want help fixing the highest-impact items?
				</h3>
				<p className="relative mb-5 max-w-xl text-[14px] leading-relaxed text-white/66 md:text-[15px]">
					Book a 15-minute call with Anthony — we'll walk through your report
					together, prioritize what matters for revenue, and outline the fastest
					path to results.
				</p>
				<a
					href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
					target="_blank"
					rel="noopener"
					className="lh-report-cta__button relative inline-block rounded-xl bg-white px-7 py-3.5 text-[14px] font-bold tracking-tight text-[#0f1218] shadow-[0_20px_50px_-18px_rgba(255,252,245,0.35)] ring-1 ring-white/40 transition-[transform,background-color,box-shadow] hover:-translate-y-px hover:bg-[var(--accent-bronze-light)] hover:shadow-[0_24px_56px_-16px_var(--accent-bronze-glow)]"
				>
					Book a 15-minute call →
				</a>
			</MotionDiv>

			{/* ── Reset ── */}
			<div className="mt-8 flex justify-center print:hidden">
				<button
					type="button"
					onClick={onReset}
					className="rounded-full border border-white/12 bg-white/4.5 px-8 py-3 text-[13px] font-semibold text-white/80 transition-[background-color,border-color] hover:border-white/20 hover:bg-white/8"
				>
					Run another audit
				</button>
			</div>
		</MotionDiv>
	);
}
