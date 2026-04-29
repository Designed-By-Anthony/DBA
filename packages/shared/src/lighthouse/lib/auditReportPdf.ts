import { jsPDF } from "jspdf";
import type { AuditData } from "../auditReport";

const MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;
const MAX_W = PAGE_W - MARGIN * 2;
const BODY_LINE = 6;
const COL2 = MARGIN + MAX_W / 2 + 4;

/* ── Palette ── */
const C_BG = [247, 243, 234] as const;
const C_PANEL = [255, 253, 248] as const;
const C_SLATE_900 = [23, 16, 8] as const;
const C_SLATE_700 = [61, 54, 45] as const;
const C_SLATE_500 = [111, 102, 88] as const;
const C_SLATE_200 = [232, 220, 198] as const;
const C_BRONZE = [201, 168, 108] as const;
const C_BRONZE_DARK = [139, 106, 56] as const;
const C_BRONZE_LIGHT = [252, 240, 210] as const;
const C_AMBER_700 = [180, 83, 9] as const;
const C_AMBER_50 = [255, 251, 235] as const;
const C_GREEN_700 = [21, 128, 61] as const;
const C_GREEN_100 = [220, 252, 231] as const;
const C_RED_700 = [185, 28, 28] as const;
const C_RED_100 = [254, 226, 226] as const;

/* ── Utilities ── */
function addPage(doc: jsPDF): number {
	doc.addPage();
	doc.setFillColor(...C_BG);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");
	return MARGIN;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
	if (y + need > PAGE_H - MARGIN - 10) return addPage(doc);
	return y;
}

function wrapped(
	doc: jsPDF,
	text: string,
	x: number,
	y: number,
	maxW: number,
	lineH: number,
): number {
	const lines = doc.splitTextToSize(text, maxW);
	doc.text(lines, x, y);
	return y + lines.length * lineH;
}

function sectionHeader(
	doc: jsPDF,
	y: number,
	eyebrow: string,
	title: string,
	accentRgb: readonly [number, number, number] = C_BRONZE,
): number {
	y = ensureSpace(doc, y, 20);

	// Accent bar
	doc.setFillColor(...accentRgb);
	doc.rect(MARGIN, y, 3, 16, "F");

	// Eyebrow
	doc.setFont("helvetica", "normal");
	doc.setFontSize(7);
	doc.setTextColor(...accentRgb);
	doc.text(eyebrow.toUpperCase(), MARGIN + 7, y + 5);

	// Title
	doc.setFont("helvetica", "bold");
	doc.setFontSize(12.5);
	doc.setTextColor(...C_SLATE_900);
	doc.text(title, MARGIN + 7, y + 12.5);

	return y + 20;
}

function divider(doc: jsPDF, y: number): number {
	doc.setDrawColor(...C_SLATE_200);
	doc.setLineWidth(0.25);
	doc.line(MARGIN, y, MARGIN + MAX_W, y);
	return y + 4;
}

/* ── Score cell ── */
function scoreColor(score: number | null): {
	bg: readonly [number, number, number];
	fg: readonly [number, number, number];
	ring: readonly [number, number, number];
} {
	if (score == null) return { bg: C_BG, fg: C_SLATE_500, ring: C_SLATE_200 };
	if (score >= 90)
		return { bg: C_GREEN_100, fg: C_GREEN_700, ring: [134, 239, 172] };
	if (score >= 50)
		return { bg: C_AMBER_50, fg: C_AMBER_700, ring: [252, 211, 77] };
	return { bg: C_RED_100, fg: C_RED_700, ring: [252, 165, 165] };
}

function scoreBox(
	doc: jsPDF,
	x: number,
	y: number,
	w: number,
	h: number,
	score: number | null,
	label: string,
) {
	const { bg, fg, ring } = scoreColor(score);
	doc.setFillColor(...bg);
	doc.setDrawColor(...ring);
	doc.setLineWidth(0.5);
	doc.roundedRect(x, y, w, h, 2, 2, "FD");

	doc.setFont("helvetica", "bold");
	doc.setFontSize(16);
	doc.setTextColor(...fg);
	const scoreStr = score == null ? "—" : String(score);
	const sw = doc.getTextWidth(scoreStr);
	doc.text(scoreStr, x + w / 2 - sw / 2, y + h / 2 + 1);

	doc.setFont("helvetica", "normal");
	doc.setFontSize(6.5);
	doc.setTextColor(...fg);
	const lw = doc.getTextWidth(label.toUpperCase());
	doc.text(label.toUpperCase(), x + w / 2 - lw / 2, y + h - 3.5);
}

/* ── Main export ── */
export function buildAuditPdf(data: AuditData, reportId: string | null): Blob {
	const doc = new jsPDF({ unit: "mm", format: "a4" });
	doc.setProperties({
		title: `Executive audit report — ${data.url}`,
		subject: "Designed by Anthony — Lighthouse Scanner",
		author: "Designed by Anthony",
		keywords: "SEO audit, PageSpeed, Core Web Vitals, Designed by Anthony",
	});

	// Background
	doc.setFillColor(...C_BG);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");

	let y = MARGIN;

	/* ── Cover header ── */
	doc.setFillColor(...C_SLATE_900);
	doc.roundedRect(MARGIN, y, MAX_W, 32, 2.5, 2.5, "F");

	// Accent strip
	doc.setFillColor(...C_BRONZE);
	doc.rect(MARGIN, y + 30, MAX_W, 2, "F");

	// Brand
	doc.setTextColor(...C_BRONZE_LIGHT);
	doc.setFontSize(7.5);
	doc.setFont("helvetica", "bold");
	doc.text("DESIGNED BY ANTHONY  ·  EXECUTIVE AUDIT REPORT", MARGIN + 5, y + 7);

	// Report title
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(17);
	doc.setFont("helvetica", "bold");
	doc.text("Website Audit Report", MARGIN + 5, y + 18);

	// Date (right-aligned)
	const dateStr = new Date().toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	doc.setFontSize(8);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(...C_BRONZE_LIGHT);
	const dw = doc.getTextWidth(dateStr);
	doc.text(dateStr, MARGIN + MAX_W - dw - 5, y + 7);

	y += 36;

	/* URL & Report ID */
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(...C_SLATE_500);
	doc.text("Scanned URL", MARGIN, y + 4);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(10);
	doc.setTextColor(...C_SLATE_900);
	y = wrapped(doc, data.url, MARGIN, y + 10, MAX_W, BODY_LINE);

	if (reportId) {
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		doc.setTextColor(...C_SLATE_500);
		doc.text(`Report ID: ${reportId}`, MARGIN, y + 4);
		y += 8;
	}

	y += 4;
	y = divider(doc, y);

	/* ── Degraded note ── */
	if (data.psiDegradedReason) {
		y = ensureSpace(doc, y, 22);
		doc.setFillColor(...C_AMBER_50);
		doc.setDrawColor(252, 211, 77);
		doc.roundedRect(MARGIN, y, MAX_W, 18, 2, 2, "FD");
		doc.setFont("helvetica", "bold");
		doc.setFontSize(8.5);
		doc.setTextColor(...C_AMBER_700);
		doc.text("Partial report.", MARGIN + 3.5, y + 6.5);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8);
		y = wrapped(
			doc,
			data.psiDegradedReason,
			MARGIN + 3.5,
			y + 12,
			MAX_W - 7,
			5,
		);
		y += 6;
	}

	/* ── Score grid (3×2) ── */
	y = ensureSpace(doc, y, 42);
	const boxW = (MAX_W - 10) / 3;
	const boxH = 18;
	const boxGap = 5;

	const scores: [number | null, string][] = [
		[data.trustScore, "Trust score"],
		[data.conversion, "Conversion"],
		[data.performance, "Performance"],
		[data.accessibility, "Accessibility"],
		[data.bestPractices, "Best practices"],
		[data.seo, "SEO"],
	];

	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 3; col++) {
			const idx = row * 3 + col;
			const bx = MARGIN + col * (boxW + boxGap);
			scoreBox(
				doc,
				bx,
				y + row * (boxH + boxGap),
				boxW,
				boxH,
				scores[idx][0],
				scores[idx][1],
			);
		}
	}
	y += 2 * boxH + boxGap + 8;

	/* ── Core Web Vitals ── */
	if (data.metrics) {
		y = sectionHeader(doc, y, "Lab vitals", "Core Web Vitals", C_BRONZE);
		const vw = (MAX_W - 6) / 4;
		const vitals = [
			["FCP", data.metrics.fcp],
			["LCP", data.metrics.lcp],
			["TBT", data.metrics.tbt],
			["CLS", data.metrics.cls],
		] as const;
		y = ensureSpace(doc, y, 16);
		for (let i = 0; i < vitals.length; i++) {
			const [abbr, val] = vitals[i];
			const bx = MARGIN + i * (vw + 2);
			doc.setFillColor(...C_PANEL);
			doc.setDrawColor(...C_SLATE_200);
			doc.roundedRect(bx, y, vw, 14, 1.5, 1.5, "FD");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(9.5);
			doc.setTextColor(...C_SLATE_900);
			const vw2 = doc.getTextWidth(String(val || "—"));
			doc.text(String(val || "—"), bx + vw / 2 - vw2 / 2, y + 7.5);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(6.5);
			doc.setTextColor(...C_SLATE_500);
			const aw = doc.getTextWidth(abbr);
			doc.text(abbr, bx + vw / 2 - aw / 2, y + 12.5);
		}
		y += 18;
		y = divider(doc, y);
	}

	/* ── Executive summary ── */
	if (data.aiInsight?.executiveSummary) {
		const plain = data.aiInsight.executiveSummary
			.replace(/<p>/gi, "")
			.replace(/<\/p>/gi, "\n")
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/&amp;/gi, "&")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">")
			.replace(/&nbsp;/gi, " ")
			.trim();

		y = sectionHeader(doc, y, "Executive readout", "Summary", C_BRONZE);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...C_SLATE_700);
		y = wrapped(doc, plain, MARGIN + 7, y, MAX_W - 7, BODY_LINE + 0.5);
		y += 6;
	}

	/* ── Priority actions ── */
	const actions = (data.aiInsight?.prioritizedActions ?? [])
		.slice()
		.sort((a, b) => a.priority - b.priority)
		.slice(0, 5);

	if (actions.length > 0) {
		y = sectionHeader(
			doc,
			y,
			"What to fix first",
			"Priority actions",
			C_BRONZE_DARK,
		);
		doc.setFontSize(9.5);
		for (const a of actions) {
			y = ensureSpace(doc, y, BODY_LINE + 3);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...C_SLATE_900);
			doc.text(`${a.priority}.`, MARGIN + 7, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...C_SLATE_700);
			y = wrapped(doc, a.action, MARGIN + 14, y, MAX_W - 21, BODY_LINE);
			doc.setFontSize(8);
			doc.setTextColor(...C_SLATE_500);
			doc.text(`${a.impact} impact  ·  ${a.effort} effort`, MARGIN + 14, y);
			doc.setFontSize(9.5);
			y += BODY_LINE + 1;
		}
		y += 4;
	}

	/* ── Strengths & weaknesses ── */
	const strengths = data.aiInsight?.strengths ?? [];
	const weaknesses = data.aiInsight?.weaknesses ?? [];
	if (strengths.length > 0 || weaknesses.length > 0) {
		y = sectionHeader(doc, y, "AI analysis", "Strengths & gaps", C_BRONZE);
		doc.setFontSize(9.5);
		if (strengths.length > 0) {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(8.5);
			doc.setTextColor(...C_GREEN_700);
			doc.text("What\u2019s working", MARGIN + 7, y);
			y += 5;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9);
			doc.setTextColor(...C_SLATE_700);
			for (const s of strengths) {
				y = ensureSpace(doc, y, BODY_LINE + 1);
				y = wrapped(doc, `\u2714  ${s}`, MARGIN + 10, y, MAX_W - 17, BODY_LINE);
				y += 1;
			}
			y += 3;
		}
		if (weaknesses.length > 0) {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(8.5);
			doc.setTextColor(...C_AMBER_700);
			doc.text("Gaps found", MARGIN + 7, y);
			y += 5;
			doc.setFont("helvetica", "normal");
			doc.setFontSize(9);
			doc.setTextColor(...C_SLATE_700);
			for (const w of weaknesses) {
				y = ensureSpace(doc, y, BODY_LINE + 1);
				y = wrapped(doc, `\u2192  ${w}`, MARGIN + 10, y, MAX_W - 17, BODY_LINE);
				y += 1;
			}
			y += 4;
		}
	}

	/* ── Authority & backlinks ── */
	if (data.backlinks?.found) {
		const moz = data.backlinks;
		y = sectionHeader(
			doc,
			y,
			"Link profile",
			"Authority & backlinks",
			C_BRONZE,
		);

		if (moz.dataSource === "internal") {
			doc.setFont("helvetica", "normal");
			doc.setFontSize(8);
			doc.setTextColor(...C_AMBER_700);
			y = wrapped(
				doc,
				moz.authorityLabel ??
					"On-page estimate — not Moz DA. Use for direction only.",
				MARGIN + 7,
				y,
				MAX_W - 7,
				5,
			);
			y += 3;
		}

		const metrics: [string, number | string | undefined][] = [
			[
				moz.dataSource === "internal" ? "Authority est." : "Domain authority",
				moz.domainAuthority ?? undefined,
			],
			[
				moz.dataSource === "internal" ? "Page est." : "Page authority",
				moz.pageAuthority ?? undefined,
			],
			["Linking domains", moz.linkingRootDomains ?? undefined],
			["Spam score", moz.spamScore ?? undefined],
		];

		y = ensureSpace(doc, y, 16);
		const mw = (MAX_W - 6) / 4;
		for (let i = 0; i < metrics.length; i++) {
			const [ml, mv] = metrics[i];
			const bx = MARGIN + i * (mw + 2);
			doc.setFillColor(...C_BG);
			doc.setDrawColor(...C_SLATE_200);
			doc.roundedRect(bx, y, mw, 14, 1.5, 1.5, "FD");
			doc.setFont("helvetica", "bold");
			doc.setFontSize(10);
			doc.setTextColor(...C_SLATE_900);
			const vs = String(mv ?? "—");
			const vw3 = doc.getTextWidth(vs);
			doc.text(vs, bx + mw / 2 - vw3 / 2, y + 7.5);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(6);
			doc.setTextColor(...C_SLATE_500);
			const lw2 = doc.getTextWidth(ml.toUpperCase());
			doc.text(ml.toUpperCase(), bx + mw / 2 - lw2 / 2, y + 12.5);
		}
		y += 18;
		y = divider(doc, y);
	}

	/* ── Local listing ── */
	if (
		data.places?.found &&
		(data.places.rating != null || data.places.userRatingCount > 0)
	) {
		const pl = data.places;
		y = sectionHeader(doc, y, "Maps & reputation", "Local listing", C_BRONZE);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...C_SLATE_700);
		const plParts: string[] = [];
		if (pl.rating != null) plParts.push(`${pl.rating.toFixed(1)}\u2605`);
		if (pl.userRatingCount > 0)
			plParts.push(
				`${pl.userRatingCount} review${pl.userRatingCount === 1 ? "" : "s"}`,
			);
		if (pl.primaryType) plParts.push(pl.primaryType);
		y = wrapped(
			doc,
			plParts.join("  \u00b7  "),
			MARGIN + 7,
			y,
			MAX_W - 7,
			BODY_LINE,
		);
		y += 6;
		y = divider(doc, y);
	}

	/* ── Competitors ── */
	if (data.competitors && data.competitors.length > 0) {
		y = sectionHeader(
			doc,
			y,
			"Market context",
			"Competitive snapshot",
			C_BRONZE,
		);
		doc.setFontSize(9.5);
		for (const c of data.competitors.slice(0, 4)) {
			y = ensureSpace(doc, y, BODY_LINE + 2);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...C_SLATE_900);
			doc.text(c.name, MARGIN + 7, y);
			const parts: string[] = [];
			if (c.rating != null) parts.push(`${c.rating.toFixed(1)}\u2605`);
			if (c.reviewCount > 0) parts.push(`${c.reviewCount} reviews`);
			if (parts.length > 0) {
				const detail = parts.join("  \u00b7  ");
				doc.setFont("helvetica", "normal");
				doc.setTextColor(...C_SLATE_500);
				doc.text(detail, COL2, y);
			}
			y += BODY_LINE + 1;
		}
		y += 4;
		y = divider(doc, y);
	}

	/* ── Index coverage ── */
	if (
		data.indexCoverage?.found &&
		data.indexCoverage.estimatedIndexedPages != null
	) {
		y = sectionHeader(doc, y, "Search footprint", "Index coverage", C_BRONZE);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...C_SLATE_700);
		y = wrapped(
			doc,
			`~${data.indexCoverage.estimatedIndexedPages.toLocaleString()} pages in Google\u2019s index (${data.indexCoverage.source})`,
			MARGIN + 7,
			y,
			MAX_W - 7,
			BODY_LINE,
		);
		y += 6;
		y = divider(doc, y);
	}

	/* ── Site crawl ── */
	if (data.sitewide) {
		const sw = data.sitewide;
		y = sectionHeader(
			doc,
			y,
			"Technical crawl",
			"Site crawl signals",
			C_BRONZE,
		);
		const crawlRows: [string, string][] = [
			[
				"robots.txt",
				sw.robotsTxt.exists
					? sw.robotsTxt.allowsCrawlers
						? "Found — allows crawlers"
						: "Found — may restrict crawlers"
					: "Not found",
			],
			[
				"XML sitemap",
				sw.sitemap.exists
					? `${sw.sitemap.urlCount.toLocaleString()} URLs`
					: "Not found",
			],
			[
				"HTTPS / redirects",
				`${sw.redirectChain.httpToHttps ? "HTTP\u2192HTTPS present" : "Check mixed content"}${sw.redirectChain.chainLength > 1 ? ` \u00b7 ${sw.redirectChain.chainLength} hops` : ""}`,
			],
		];
		doc.setFontSize(9.5);
		for (const [k, v] of crawlRows) {
			y = ensureSpace(doc, y, BODY_LINE + 2);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...C_BRONZE_DARK);
			doc.text(k, MARGIN + 7, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...C_SLATE_700);
			doc.text(v, COL2, y);
			y += BODY_LINE + 1;
		}
		y += 4;
	}

	/* ── Footer (every page) ── */
	const totalPages = (
		doc.internal as unknown as { getNumberOfPages: () => number }
	).getNumberOfPages();
	for (let pg = 1; pg <= totalPages; pg++) {
		doc.setPage(pg);
		doc.setFontSize(7.5);
		doc.setTextColor(...C_SLATE_500);
		doc.setFont("helvetica", "normal");
		doc.text(
			"Designed by Anthony · designedbyanthony.com · Lighthouse Scanner v2",
			MARGIN,
			PAGE_H - 7,
		);
		doc.text(`Page ${pg} of ${totalPages}`, MARGIN + MAX_W, PAGE_H - 7, {
			align: "right",
		});
		doc.setDrawColor(...C_SLATE_200);
		doc.setLineWidth(0.25);
		doc.line(MARGIN, PAGE_H - 10, MARGIN + MAX_W, PAGE_H - 10);
	}

	return doc.output("blob");
}
