"use client";

import type { AuditAiInsight, AuditData } from "@lh/auditReport";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buildPublicApiUrl } from "@/lib/publicApi";

/* ─── Helpers ─── */
function sanitizeHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/\son\w+="[^"]*"/gi, "")
		.replace(/\son\w+='[^']*'/gi, "");
}

const PRINT_PAPER = "#f7f3ea";
const PRINT_PANEL = "#fffdf8";
const PRINT_INK = "#171008";
const PRINT_MUTED = "#6f6658";
const PRINT_BORDER = "#e8dcc6";
const PRINT_BRONZE = "#D4AF37";
const PRINT_BRONZE_DARK = "#8b6a38";

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
	const isNull = score == null;
	let bg = "#fee2e2";
	let fg = "#991b1b";
	let ring = "#fca5a5";
	if (isNull) {
		bg = "#f9f4eb";
		fg = PRINT_MUTED;
		ring = PRINT_BORDER;
	} else if (score >= 90) {
		bg = "#dcfce7";
		fg = "#166534";
		ring = "#86efac";
	} else if (score >= 50) {
		bg = "#fef3c7";
		fg = "#92400e";
		ring = "#fcd34d";
	}

	return (
		<div
			style={{
				background: bg,
				border: `1.5px solid ${ring}`,
				borderRadius: "0.625rem",
				padding: "0.75rem 0.5rem",
				textAlign: "center",
			}}
		>
			<div
				style={{
					fontSize: "1.5rem",
					fontWeight: 700,
					letterSpacing: "-0.02em",
					color: fg,
					lineHeight: 1,
					marginBottom: "0.35rem",
				}}
			>
				{isNull ? "—" : score}
			</div>
			<div
				style={{
					fontSize: "0.6rem",
					fontWeight: 700,
					textTransform: "uppercase",
					letterSpacing: "0.14em",
					color: fg,
					opacity: 0.75,
				}}
			>
				{label}
			</div>
		</div>
	);
}

function SectionCard({
	eyebrow,
	title,
	children,
	accent = PRINT_BRONZE,
}: {
	eyebrow: string;
	title: string;
	children: React.ReactNode;
	accent?: string;
}) {
	return (
		<div
			style={{
				border: `1px solid ${PRINT_BORDER}`,
				borderRadius: "0.85rem",
				overflow: "hidden",
				marginBottom: "1.25rem",
				pageBreakInside: "avoid",
				breakInside: "avoid",
				background: PRINT_PANEL,
			}}
		>
			<div
				style={{
					height: "3px",
					background: `linear-gradient(90deg, ${accent}, transparent)`,
				}}
			/>
			<div style={{ padding: "1.25rem 1.5rem 1.25rem 2rem" }}>
				<p
					style={{
						fontSize: "0.6rem",
						fontWeight: 700,
						textTransform: "uppercase",
						letterSpacing: "0.2em",
						color: accent,
						marginBottom: "0.3rem",
					}}
				>
					{eyebrow}
				</p>
				<h2
					style={{
						fontSize: "1.05rem",
						fontWeight: 700,
						letterSpacing: "-0.02em",
						color: PRINT_INK,
						marginBottom: "0.875rem",
						lineHeight: 1.3,
					}}
				>
					{title}
				</h2>
				{children}
			</div>
		</div>
	);
}

function PrintReport({
	data,
	reportId,
}: {
	data: AuditData;
	reportId: string;
}) {
	const actions = (data.aiInsight?.prioritizedActions ?? [])
		.slice()
		.sort((a, b) => a.priority - b.priority)
		.slice(0, 5);

	const dateStr = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	const bodyText: React.CSSProperties = {
		fontSize: "0.875rem",
		lineHeight: 1.7,
		color: "#3d362d",
	};

	const mutedText: React.CSSProperties = {
		color: PRINT_MUTED,
	};

	return (
		<div
			style={{
				fontFamily:
					'"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				color: PRINT_INK,
				background: PRINT_PAPER,
				minHeight: "100vh",
				padding: "2.5rem 3rem 4rem",
			}}
		>
			{/* Header */}
			<div
				style={{
					position: "relative",
					overflow: "hidden",
					background: "linear-gradient(145deg, #171008 0%, #080a0f 100%)",
					border: `1px solid ${PRINT_BRONZE}`,
					borderRadius: "1rem",
					boxShadow: "0 18px 44px rgba(23,16,8,0.16)",
					padding: "1.4rem 1.5rem",
					display: "flex",
					alignItems: "flex-end",
					justifyContent: "space-between",
					gap: "1.5rem",
					marginBottom: "1rem",
				}}
			>
				<div
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						height: "3px",
						background: `linear-gradient(90deg, transparent, ${PRINT_BRONZE}, transparent)`,
					}}
				/>
				<div>
					<p
						style={{
							fontSize: "0.6rem",
							fontWeight: 700,
							textTransform: "uppercase",
							letterSpacing: "0.2em",
							color: PRINT_BRONZE,
							marginBottom: "0.3rem",
						}}
					>
						ANTHONY.
					</p>
					<h1
						style={{
							fontSize: "1.6rem",
							fontWeight: 700,
							letterSpacing: "-0.03em",
							color: "#fffdf8",
							margin: 0,
							lineHeight: 1.1,
						}}
					>
						Executive audit report
					</h1>
				</div>
				<div style={{ textAlign: "right" }}>
					<p style={{ fontSize: "0.75rem", color: "#e8d5a8", margin: 0 }}>
						{dateStr}
					</p>
					{reportId && (
						<p
							style={{
								fontSize: "0.65rem",
								fontFamily: "monospace",
								color: "rgba(255,253,248,0.62)",
								marginTop: "0.2rem",
							}}
						>
							{reportId}
						</p>
					)}
				</div>
			</div>

			{/* Scanned URL */}
			<div style={{ marginBottom: "1.5rem", paddingTop: "0.25rem" }}>
				<span style={{ fontSize: "0.75rem", color: PRINT_MUTED }}>
					Scanned:{" "}
				</span>
				<a
					href={data.url}
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						color: PRINT_BRONZE_DARK,
						wordBreak: "break-all",
					}}
				>
					{data.url}
				</a>
			</div>

			{/* Degraded note */}
			{data.psiDegradedReason && (
				<div
					style={{
						background: "#fff8df",
						border: `1px solid ${PRINT_BRONZE}`,
						borderRadius: "0.75rem",
						padding: "0.875rem 1rem",
						marginBottom: "1.25rem",
						...bodyText,
						color: "#6c4b16",
					}}
				>
					<strong>Partial report.</strong> {data.psiDegradedReason}
				</div>
			)}

			{/* Score grid */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "0.625rem",
					marginBottom: "1.75rem",
				}}
			>
				<ScoreBadge score={data.trustScore} label="Trust score" />
				<ScoreBadge score={data.conversion} label="Conversion" />
				<ScoreBadge score={data.performance} label="Performance" />
				<ScoreBadge score={data.accessibility} label="Accessibility" />
				<ScoreBadge score={data.bestPractices} label="Best practices" />
				<ScoreBadge score={data.seo} label="SEO" />
			</div>

			{/* Core Web Vitals */}
			<SectionCard
				eyebrow="Lab vitals"
				title="Core Web Vitals"
				accent={PRINT_BRONZE}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "0.625rem",
					}}
				>
					{[
						["First Contentful Paint", data.metrics.fcp],
						["Largest Contentful Paint", data.metrics.lcp],
						["Total Blocking Time", data.metrics.tbt],
						["Cumulative Layout Shift", data.metrics.cls],
					].map(([k, v]) => (
						<div
							key={String(k)}
							style={{
								background: "#f9f4eb",
								border: `1px solid ${PRINT_BORDER}`,
								borderRadius: "0.5rem",
								padding: "0.625rem 0.75rem",
							}}
						>
							<p
								style={{
									fontSize: "0.65rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.1em",
									color: PRINT_MUTED,
									marginBottom: "0.25rem",
								}}
							>
								{k}
							</p>
							<p
								style={{
									fontSize: "1rem",
									fontWeight: 700,
									color: PRINT_INK,
									margin: 0,
								}}
							>
								{String(v || "—")}
							</p>
						</div>
					))}
				</div>
			</SectionCard>

			{/* Executive summary */}
			{data.aiInsight?.executiveSummary && (
				<SectionCard
					eyebrow="Executive readout"
					title="Summary"
					accent={PRINT_BRONZE}
				>
					{/<[a-z][\s\S]*>/i.test(data.aiInsight.executiveSummary) ? (
						<div
							style={{ ...bodyText, lineHeight: 1.75 }}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: intentional sanitized HTML from trusted AI summary pipeline
							dangerouslySetInnerHTML={{
								__html: sanitizeHtml(data.aiInsight.executiveSummary),
							}}
						/>
					) : (
						<div style={bodyText}>
							{data.aiInsight.executiveSummary
								.split(/\n\n+/)
								.filter(Boolean)
								.map((p, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: static order
									<p key={i} style={{ marginBottom: "0.75em" }}>
										{p}
									</p>
								))}
						</div>
					)}
				</SectionCard>
			)}

			{/* Priority actions */}
			{actions.length > 0 && (
				<SectionCard
					eyebrow="What to fix first"
					title="Priority actions"
					accent={PRINT_BRONZE}
				>
					<ol style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
						{actions.map((item, idx) => (
							<li
								key={`${item.priority}-${item.action}`}
								style={{
									display: "flex",
									gap: "0.75rem",
									alignItems: "flex-start",
									paddingTop: "0.6rem",
									paddingBottom: "0.6rem",
									borderBottom:
										idx < actions.length - 1
											? `1px solid ${PRINT_BORDER}`
											: "none",
								}}
							>
								<span
									style={{
										fontWeight: 700,
										color: PRINT_BRONZE_DARK,
										fontSize: "0.8rem",
										minWidth: "1.2rem",
										paddingTop: "0.1rem",
									}}
								>
									{idx + 1}.
								</span>
								<div>
									<p
										style={{
											...bodyText,
											fontWeight: 600,
											color: PRINT_INK,
											margin: 0,
										}}
									>
										{item.action}
									</p>
									<p
										style={{
											fontSize: "0.7rem",
											color: PRINT_MUTED,
											marginTop: "0.2rem",
										}}
									>
										{item.impact} impact · {item.effort} effort
									</p>
								</div>
							</li>
						))}
					</ol>
				</SectionCard>
			)}

			{/* Backlinks */}
			{data.backlinks?.found && (
				<SectionCard
					eyebrow="Link profile"
					title="Authority & backlinks"
					accent={PRINT_BRONZE}
				>
					{data.backlinks.dataSource === "internal" && (
						<p
							style={{
								...bodyText,
								...mutedText,
								fontSize: "0.75rem",
								marginBottom: "0.75rem",
							}}
						>
							{data.backlinks.authorityLabel ??
								"On-page estimate — not Moz DA or Ahrefs DR. Use for direction only."}
						</p>
					)}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(4, 1fr)",
							gap: "0.5rem",
						}}
					>
						{[
							[
								data.backlinks.dataSource === "internal"
									? "Authority est."
									: "Domain auth.",
								data.backlinks.domainAuthority,
							],
							[
								data.backlinks.dataSource === "internal"
									? "Page est."
									: "Page auth.",
								data.backlinks.pageAuthority,
							],
							["Linking domains", data.backlinks.linkingRootDomains],
							["Spam score", data.backlinks.spamScore],
						].map(([k, v]) => (
							<div
								key={String(k)}
								style={{
									background: "#f8fafc",
									border: `1px solid ${PRINT_BORDER}`,
									borderRadius: "0.5rem",
									padding: "0.625rem 0.5rem",
									textAlign: "center",
								}}
							>
								<p
									style={{
										fontSize: "0.6rem",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.12em",
										color: PRINT_MUTED,
										marginBottom: "0.35rem",
									}}
								>
									{k}
								</p>
								<p
									style={{
										fontSize: "1.1rem",
										fontWeight: 700,
										color: PRINT_INK,
										margin: 0,
									}}
								>
									{String(v ?? "—")}
								</p>
							</div>
						))}
					</div>
				</SectionCard>
			)}

			{/* Site crawl */}
			{data.sitewide && (
				<SectionCard
					eyebrow="Technical crawl"
					title="Site crawl signals"
					accent={PRINT_BRONZE}
				>
					<table
						style={{ width: "100%", borderCollapse: "collapse", ...bodyText }}
					>
						<tbody>
							{[
								[
									"robots.txt",
									data.sitewide.robotsTxt.exists
										? data.sitewide.robotsTxt.allowsCrawlers
											? "Found — allows crawlers"
											: "Found — may restrict crawlers"
										: "Not found",
								],
								[
									"XML sitemap",
									data.sitewide.sitemap.exists
										? `${data.sitewide.sitemap.urlCount.toLocaleString()} URLs indexed`
										: "Not found",
								],
								[
									"HTTPS / redirects",
									`${data.sitewide.redirectChain.httpToHttps ? "HTTP→HTTPS redirect present" : "Check mixed content"}${data.sitewide.redirectChain.chainLength > 1 ? ` · ${data.sitewide.redirectChain.chainLength} hops` : ""}`,
								],
							].map(([k, v]) => (
								<tr
									key={String(k)}
									style={{ borderBottom: `1px solid ${PRINT_BORDER}` }}
								>
									<td
										style={{
											padding: "0.5rem 0",
											fontWeight: 600,
											color: PRINT_BRONZE_DARK,
											width: "38%",
											paddingRight: "1rem",
										}}
									>
										{k}
									</td>
									<td style={{ padding: "0.5rem 0", ...mutedText }}>{v}</td>
								</tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			)}

			{/* Local listing */}
			{data.places?.found &&
				(data.places.rating != null || data.places.userRatingCount > 0) && (
					<SectionCard
						eyebrow="Maps & reputation"
						title="Local listing signal"
						accent={PRINT_BRONZE}
					>
						<p style={bodyText}>
							{data.places.rating != null
								? `${data.places.rating.toFixed(1)}★`
								: ""}
							{data.places.userRatingCount > 0
								? ` · ${data.places.userRatingCount} review${data.places.userRatingCount === 1 ? "" : "s"}`
								: ""}
							{data.places.primaryType ? ` · ${data.places.primaryType}` : ""}
						</p>
					</SectionCard>
				)}

			{/* Strengths & weaknesses */}
			{((data.aiInsight?.strengths?.length ?? 0) > 0 ||
				(data.aiInsight?.weaknesses?.length ?? 0) > 0) && (
				<SectionCard
					eyebrow="AI analysis"
					title="Strengths & gaps"
					accent={PRINT_BRONZE}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns:
								(data.aiInsight?.strengths?.length ?? 0) > 0 &&
								(data.aiInsight?.weaknesses?.length ?? 0) > 0
									? "1fr 1fr"
									: "1fr",
							gap: "1.25rem",
						}}
					>
						{(data.aiInsight?.strengths?.length ?? 0) > 0 && (
							<div>
								<p
									style={{
										fontSize: "0.65rem",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.12em",
										color: "#166534",
										marginBottom: "0.5rem",
									}}
								>
									What&apos;s working
								</p>
								<ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
									{data.aiInsight?.strengths?.map((s) => (
										<li
											key={s}
											style={{
												...bodyText,
												display: "flex",
												gap: "0.45rem",
												alignItems: "flex-start",
												marginBottom: "0.35rem",
											}}
										>
											<span style={{ color: "#166534", flexShrink: 0 }}>✓</span>
											{s}
										</li>
									))}
								</ul>
							</div>
						)}
						{(data.aiInsight?.weaknesses?.length ?? 0) > 0 && (
							<div>
								<p
									style={{
										fontSize: "0.65rem",
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: "0.12em",
										color: "#92400e",
										marginBottom: "0.5rem",
									}}
								>
									Gaps found
								</p>
								<ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
									{data.aiInsight?.weaknesses?.map((w) => (
										<li
											key={w}
											style={{
												...bodyText,
												display: "flex",
												gap: "0.45rem",
												alignItems: "flex-start",
												marginBottom: "0.35rem",
											}}
										>
											<span style={{ color: "#92400e", flexShrink: 0 }}>→</span>
											{w}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</SectionCard>
			)}

			{/* Competitors */}
			{data.competitors && data.competitors.length > 0 && (
				<SectionCard
					eyebrow="Market context"
					title="Competitive snapshot"
					accent={PRINT_BRONZE}
				>
					<table
						style={{ width: "100%", borderCollapse: "collapse", ...bodyText }}
					>
						<tbody>
							{data.competitors.slice(0, 4).map((c) => (
								<tr
									key={`${c.name}-${c.reviewCount}`}
									style={{ borderBottom: `1px solid ${PRINT_BORDER}` }}
								>
									<td
										style={{
											padding: "0.45rem 0",
											fontWeight: 600,
											color: PRINT_INK,
											width: "50%",
											paddingRight: "1rem",
										}}
									>
										{c.name}
									</td>
									<td style={{ padding: "0.45rem 0", ...mutedText }}>
										{c.rating != null ? `${c.rating.toFixed(1)}★` : ""}
										{c.reviewCount > 0 ? ` · ${c.reviewCount} reviews` : ""}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</SectionCard>
			)}

			{/* Index coverage */}
			{data.indexCoverage?.found &&
				data.indexCoverage.estimatedIndexedPages != null && (
					<SectionCard
						eyebrow="Search footprint"
						title="Index coverage"
						accent={PRINT_BRONZE}
					>
						<p style={bodyText}>
							~{data.indexCoverage.estimatedIndexedPages.toLocaleString()} pages
							in Google&apos;s index ({data.indexCoverage.source})
						</p>
					</SectionCard>
				)}

			{/* Notable issue */}
			{data.diagnostics?.criticalIssue ? (
				<div
					style={{
						background: "#fffbeb",
						border: `1px solid ${PRINT_BRONZE}`,
						borderRadius: "0.75rem",
						padding: "0.875rem 1rem",
						marginBottom: "1.25rem",
					}}
				>
					<p
						style={{
							fontSize: "0.6rem",
							fontWeight: 700,
							textTransform: "uppercase",
							letterSpacing: "0.14em",
							color: "#92400e",
							marginBottom: "0.3rem",
						}}
					>
						Notable issue
					</p>
					<p style={{ ...bodyText, color: "#6c4b16", margin: 0 }}>
						{data.diagnostics.criticalIssue}
					</p>
				</div>
			) : null}

			{/* Copywriting analysis */}
			{data.aiInsight?.copywritingAnalysis ? (
				<SectionCard
					eyebrow="Messaging & copy"
					title="Copywriting analysis"
					accent={PRINT_BRONZE}
				>
					<p style={bodyText}>{data.aiInsight.copywritingAnalysis}</p>
				</SectionCard>
			) : null}

			{/* Footer */}
			<div
				style={{
					borderTop: `1px solid ${PRINT_BORDER}`,
					paddingTop: "0.75rem",
					marginTop: "1.5rem",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					gap: "0.5rem",
				}}
			>
				<p style={{ fontSize: "0.7rem", color: PRINT_MUTED, margin: 0 }}>
					designedbyanthony.com · Lighthouse Scanner v2
				</p>
			</div>
		</div>
	);
}

/* ─── Page ─── */
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
				const res = await fetch(
					buildPublicApiUrl(`/api/report/${encodeURIComponent(id)}`),
					{
						cache: "no-store",
					},
				);
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
						scores.performance == null ? null : Number(scores.performance),
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
			<main className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
				<p className="text-white/60">Invalid report link.</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-8">
				<p className="text-white/70">{error}</p>
				<Link
					href="/lighthouse"
					className="text-sm text-sky-400 underline underline-offset-4"
				>
					Back to scanner
				</Link>
			</main>
		);
	}

	if (!data) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-slate-950">
				<p className="text-white/50 text-sm">Loading report…</p>
			</main>
		);
	}

	return (
		<>
			{/* Screen-only toolbar */}
			<div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-b border-[rgb(var(--accent-bronze-rgb)/0.18)] bg-[rgba(6,10,18,0.94)] backdrop-blur-xl px-5 py-3.5 md:px-8">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--accent-bronze-muted)">
						ANTHONY.
					</p>
					<p className="text-sm font-semibold text-white/80">
						Executive audit report
					</p>
				</div>
				<button
					type="button"
					onClick={() => window.print()}
					className="rounded-xl border border-[rgb(var(--accent-bronze-rgb)/0.62)] bg-(--accent-bronze-light) px-5 py-2.5 text-sm font-bold text-[#171008] shadow-[0_8px_24px_-8px_var(--accent-bronze-glow)] transition hover:-translate-y-px hover:bg-white"
				>
					Print / Save as PDF
				</button>
			</div>

			{/* Report body — padded below fixed toolbar on screen */}
			<div className="print:pt-0 pt-[64px]">
				<div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
					<PrintReport data={data} reportId={id} />
				</div>
			</div>
		</>
	);
}
