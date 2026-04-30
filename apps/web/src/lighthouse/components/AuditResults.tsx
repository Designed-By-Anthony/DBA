"use client";

import type { AuditData } from "@lh/auditReport";
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

	const [pdfStatus, setPdfStatus] = useState<"idle" | "generating" | "error">(
		"idle",
	);

	const handleDownloadPdf = useCallback(async () => {
		if (!reportId) return;
		setPdfStatus("generating");
		try {
			const res = await fetch(
				buildPublicApiUrl(`/api/report/${encodeURIComponent(reportId)}/pdf`),
			);
			if (!res.ok) {
				throw new Error("PDF generation failed");
			}
			const blob = await res.blob();
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			const host = (() => {
				try {
					return new URL(data.url).hostname.replace(/^www\./, "") || "audit";
				} catch {
					return "audit";
				}
			})();
			a.download = `audit-${host}-${reportId}.pdf`;
			a.click();
			URL.revokeObjectURL(a.href);
			setPdfStatus("idle");
		} catch {
			setPdfStatus("error");
		}
	}, [data.url, reportId]);

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
		<div className="lh-report-output">
			{/* Degraded report warning */}
			{data.psiDegradedReason ? (
				<div className="lh-alert lh-alert--amber" role="status">
					<p className="lh-alert-kicker">Heads up</p>
					<strong className="lh-alert-title">Partial report</strong>
					<p className="lh-alert-body">{data.psiDegradedReason}</p>
				</div>
			) : null}

			{/* ── Hero ── */}
			<div className="lighthouse-results-hero lh-report-cover">
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
							<p className="lh-report-meta-label lh-report-meta-label--spaced">
								Report reference
							</p>
							<p className="lh-report-id">{reportId}</p>
						</>
					) : null}
				</div>
			</div>

			{/* ── Action toolbar ── */}
			<div className="lighthouse-actions-toolbar">
				<div className="lighthouse-action-item">
					<button
						type="button"
						onClick={handleDownloadPdf}
						disabled={!reportId || pdfStatus === "generating"}
						className="lighthouse-btn-primary"
					>
						{pdfStatus === "generating"
							? "Generating…"
							: pdfStatus === "error"
								? "Retry PDF"
								: "Download PDF"}
					</button>
				</div>
				<div className="lighthouse-action-item">
					<button
						type="button"
						onClick={handlePrintView}
						disabled={!reportId}
						className="lighthouse-btn-secondary"
					>
						Print / save as PDF
					</button>
				</div>
				<div className="lighthouse-action-item">
					<button
						type="button"
						onClick={handleEmailSummary}
						disabled={emailStatus === "sending" || !contactEmail?.trim()}
						className="lighthouse-btn-emerald"
					>
						{emailStatus === "sending"
							? "Sending…"
							: emailStatus === "sent"
								? "Emailed"
								: "Email summary"}
					</button>
				</div>
			</div>

			{emailStatus === "error" && emailErr ? (
				<p className="lh-error print:hidden" role="alert">
					{emailErr}
				</p>
			) : null}

			{/* ── Score grid — all 6 in a unified 3-column grid ── */}
			<div className="lh-section-label-wrap">
				<p className="lh-section-label">How your site scored</p>
			</div>
			<div className="lh-score-grid">
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
					<div key={label}>
						<ScoreRing score={score} label={label} />
					</div>
				))}
			</div>

			{/* ── Executive summary ── */}
			{data.aiInsight?.executiveSummary ? (
				<div className="lighthouse-result-panel lh-panel--sky">
					<p className="lighthouse-result-eyebrow">Executive readout</p>
					<h3 className="lighthouse-result-heading">Summary</h3>
					<ExecutiveSummaryBody text={data.aiInsight.executiveSummary} />
				</div>
			) : null}

			{/* ── Priority actions ── */}
			{actions.length > 0 ? (
				<div className="lighthouse-result-panel lh-panel--amber">
					<p className="lighthouse-result-eyebrow">What to fix first</p>
					<h3 className="lighthouse-result-heading">Priority actions</h3>
					<ol className="lh-action-list">
						{actions.map((item, idx) => (
							<li
								key={`${item.priority}-${item.action}`}
								className="lh-action-item"
							>
								<span className="lh-action-number">{idx + 1}</span>
								<div className="lh-action-copy">
									<p className="lh-action-title">{item.action}</p>
									<div className="lh-chip-row">
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
				</div>
			) : null}

			{/* ── Strengths & weaknesses ── */}
			{(data.aiInsight?.strengths?.length ?? 0) > 0 ||
			(data.aiInsight?.weaknesses?.length ?? 0) > 0 ? (
				<div className="lh-two-grid">
					{(data.aiInsight?.strengths?.length ?? 0) > 0 ? (
						<div className="lighthouse-result-panel lh-panel--emerald">
							<p className="lighthouse-result-eyebrow">What&apos;s working</p>
							<h3 className="lighthouse-result-heading">Strengths</h3>
							<ul className="lh-bullet-list">
								{data.aiInsight?.strengths?.map((s) => (
									<li key={s} className="lh-bullet-item">
										<span
											className="lh-bullet-icon lh-bullet-icon--green"
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
						<div className="lighthouse-result-panel lh-panel--amber">
							<p className="lighthouse-result-eyebrow">What needs work</p>
							<h3 className="lighthouse-result-heading">Gaps found</h3>
							<ul className="lh-bullet-list">
								{data.aiInsight?.weaknesses?.map((w) => (
									<li key={w} className="lh-bullet-item">
										<span
											className="lh-bullet-icon lh-bullet-icon--amber"
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
				</div>
			) : null}

			{/* ── Local listing ── */}
			{places?.found &&
			(places.rating != null || places.userRatingCount > 0) ? (
				<div className="lighthouse-result-panel lh-panel--violet">
					<p className="lighthouse-result-eyebrow">Maps &amp; reputation</p>
					<h3 className="lighthouse-result-heading">Local listing signal</h3>
					<p className="lighthouse-result-body">
						{formatStars(places.rating)}
						{places.userRatingCount > 0
							? ` · ${places.userRatingCount} review${places.userRatingCount === 1 ? "" : "s"}`
							: ""}
						{places.primaryType ? ` · ${places.primaryType}` : ""}
					</p>
				</div>
			) : null}

			{/* ── Notable issue ── */}
			{diag?.criticalIssue ? (
				<div className="lh-alert lh-alert--amber">
					<span className="lh-alert-title">Notable issue: </span>
					{diag.criticalIssue}
				</div>
			) : null}

			{/* ── Authority & backlinks ── */}
			{moz?.found ? (
				<div className="lighthouse-result-panel lh-panel--sky">
					<p className="lighthouse-result-eyebrow">Link profile</p>
					<h3 className="lighthouse-result-heading">
						Authority &amp; backlinks
					</h3>
					{moz.dataSource === "internal" ? (
						<p className="lh-report-note lh-report-note--amber">
							{moz.authorityLabel ??
								"On-page estimate from your homepage crawl — not Moz Domain Authority or Ahrefs DR. Use for direction only."}
						</p>
					) : (
						<p className="lh-report-note lighthouse-result-muted">
							Moz Link Explorer metrics for this domain.
						</p>
					)}
					<div className="lh-metric-grid">
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
							<div key={String(metricLabel)} className="lighthouse-metric-tile">
								<p className="lighthouse-metric-label">{metricLabel}</p>
								<p className="lighthouse-metric-value">{metricVal ?? "—"}</p>
							</div>
						))}
					</div>
				</div>
			) : null}

			{/* ── Index coverage ── */}
			{index?.found && index.estimatedIndexedPages != null ? (
				<div className="lighthouse-result-panel lh-panel--emerald">
					<p className="lighthouse-result-eyebrow">Search footprint</p>
					<h3 className="lighthouse-result-heading">Index coverage</h3>
					<p className="lighthouse-result-body">
						~{index.estimatedIndexedPages.toLocaleString()} pages in Google's
						index ({index.source})
					</p>
				</div>
			) : null}

			{/* ── Copywriting analysis ── */}
			{data.aiInsight?.copywritingAnalysis ? (
				<div className="lighthouse-result-panel lh-panel--violet">
					<p className="lighthouse-result-eyebrow">Messaging &amp; copy</p>
					<h3 className="lighthouse-result-heading">Copywriting analysis</h3>
					<ExecutiveSummaryBody text={data.aiInsight.copywritingAnalysis} />
				</div>
			) : null}

			{/* ── Site crawl signals ── */}
			{sitewide ? (
				<div className="lighthouse-result-panel lh-panel--sky">
					<p className="lighthouse-result-eyebrow">Technical crawl</p>
					<h3 className="lighthouse-result-heading">Site crawl signals</h3>
					<ul className="lighthouse-result-body lh-signal-list">
						<li className="lh-signal-row">
							<span className="lh-signal-label">robots.txt</span>
							<span className="lighthouse-result-muted">
								{sitewide.robotsTxt.exists
									? sitewide.robotsTxt.allowsCrawlers
										? "allows crawlers"
										: "may restrict crawlers"
									: "not found"}
							</span>
						</li>
						<li className="lh-signal-row">
							<span className="lh-signal-label">XML sitemap</span>
							<span className="lighthouse-result-muted">
								{sitewide.sitemap.exists
									? `${sitewide.sitemap.urlCount.toLocaleString()} URL${sitewide.sitemap.urlCount === 1 ? "" : "s"}`
									: "not found"}
							</span>
						</li>
						<li className="lh-signal-row">
							<span className="lh-signal-label">HTTPS / redirects</span>
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
				</div>
			) : null}

			{/* ── Competitive snapshot ── */}
			{data.competitors && data.competitors.length > 0 ? (
				<div className="lighthouse-result-panel lh-panel--violet">
					<p className="lighthouse-result-eyebrow">Market context</p>
					<h3 className="lighthouse-result-heading">Competitive snapshot</h3>
					<ul className="lh-bullet-list">
						{data.competitors.slice(0, 4).map((c) => (
							<li
								key={`${c.name}-${c.reviewCount}`}
								className="lh-competitor-row"
							>
								<span className="lh-competitor-name">{c.name}</span>
								<span className="lighthouse-result-muted">
									{c.rating != null ? `${c.rating.toFixed(1)}★` : ""}
									{c.reviewCount > 0 ? ` · ${c.reviewCount} reviews` : ""}
								</span>
							</li>
						))}
					</ul>
				</div>
			) : null}

			{/* ── Lab vitals ── */}
			<div className="lighthouse-result-panel lh-panel--sky">
				<p className="lighthouse-result-eyebrow">Lab vitals</p>
				<h3 className="lighthouse-result-heading">Core Web Vitals</h3>
				<div className="lh-metric-grid">
					{[
						["First Contentful Paint", data.metrics.fcp],
						["Largest Contentful Paint", data.metrics.lcp],
						["Total Blocking Time", data.metrics.tbt],
						["Cumulative Layout Shift", data.metrics.cls],
					].map(([metricLabel, metricVal]) => (
						<div key={String(metricLabel)} className="lighthouse-metric-tile">
							<p className="lighthouse-metric-label">{metricLabel}</p>
							<p className="lighthouse-metric-value">{metricVal || "—"}</p>
						</div>
					))}
				</div>
			</div>

			{/* ── CTA ── */}
			{/* Phase-3 #5: standalone, high-contrast bronze CTA so the contact
			    action no longer blends into the surrounding card text. */}
			<div className="lh-report-cta print:hidden">
				<p className="lighthouse-result-eyebrow">Next step</p>
				<h3 className="lighthouse-result-heading">
					Want help fixing the highest-impact items?
				</h3>
				<p className="lighthouse-result-body">
					Book a 15-minute call with Anthony — we'll walk through your report
					together, prioritize what matters for revenue, and outline the fastest
					path to results.
				</p>
				<div className="lh-cta-actions">
					<a
						href="https://calendly.com/anthony-designedbyanthony/web-design-consult"
						target="_blank"
						rel="noopener"
						className="btn btn-primary-book"
					>
						Book a 15-minute call →
					</a>
					<a href="/contact" className="btn btn-secondary-proof">
						Or send a message
					</a>
				</div>
			</div>

			{/* ── Reset ── */}
			<div className="lh-reset-row print:hidden">
				<button type="button" onClick={onReset} className="btn btn-outline">
					Run another audit
				</button>
			</div>
		</div>
	);
}
