import type { AuditData } from "@lh/auditReport";
import { jsPDF } from "jspdf";

const MARGIN = 18;
const LINE = 6.5;
const PAGE_W = 210;
const PAGE_H = 297;
const MAX_W = PAGE_W - MARGIN * 2;

/** Brand-aligned PDF: deep slate + sky accent (reads well on screen & print). */
const C_BG = [248, 250, 252] as const;
const C_SLATE = [15, 23, 42] as const;
const C_MUTED = [71, 85, 105] as const;
const C_SKY = [14, 165, 233] as const;
const C_SKY_SOFT = [224, 242, 254] as const;
const C_AMBER = [180, 83, 9] as const;
const C_AMBER_BG = [255, 251, 235] as const;

function addWrapped(
	doc: jsPDF,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
): number {
	const lines = doc.splitTextToSize(text, maxWidth);
	doc.text(lines, x, y);
	return y + lines.length * lineHeight;
}

function ensureSpace(doc: jsPDF, y: number, needMm: number): number {
	if (y + needMm > PAGE_H - MARGIN - 12) {
		doc.addPage();
		doc.setFillColor(...C_BG);
		doc.rect(0, 0, PAGE_W, PAGE_H, "F");
		return MARGIN;
	}
	return y;
}

export function buildAuditPdf(data: AuditData, reportId: string | null): Blob {
	const doc = new jsPDF({ unit: "mm", format: "a4" });
	doc.setProperties({
		title: `Website audit — ${data.url}`,
		subject: "Designed by Anthony — Lighthouse Scanner",
		author: "Designed by Anthony",
		keywords: "SEO audit, PageSpeed, Core Web Vitals, Designed by Anthony",
	});

	doc.setFillColor(...C_BG);
	doc.rect(0, 0, PAGE_W, PAGE_H, "F");

	let y = MARGIN;

	/* Header band */
	doc.setFillColor(...C_SLATE);
	doc.roundedRect(MARGIN, y, MAX_W, 28, 2, 2, "F");
	doc.setDrawColor(...C_SKY);
	doc.setLineWidth(0.6);
	doc.line(MARGIN, y + 28, MARGIN + MAX_W, y + 28);

	doc.setTextColor(255, 255, 255);
	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.text("LIGHTHOUSE SCANNER · DESIGNED BY ANTHONY", MARGIN + 4, y + 7);

	doc.setFontSize(16);
	doc.setFont("helvetica", "bold");
	doc.text("Website audit report", MARGIN + 4, y + 17);

	doc.setFontSize(8);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(200, 210, 225);
	const dateStr = new Date().toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	doc.text(dateStr, MARGIN + MAX_W - 4 - doc.getTextWidth(dateStr), y + 7);

	y += 34;

	doc.setTextColor(...C_SLATE);
	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	y = addWrapped(doc, `Scanned URL`, MARGIN, y, MAX_W, LINE) - LINE + 2;
	doc.setFont("helvetica", "bold");
	y = addWrapped(doc, data.url, MARGIN, y, MAX_W, LINE + 1) + 3;
	doc.setFont("helvetica", "normal");

	if (reportId) {
		doc.setTextColor(...C_MUTED);
		doc.setFontSize(9);
		y = addWrapped(doc, `Report ID · ${reportId}`, MARGIN, y, MAX_W, LINE) + 4;
		doc.setFontSize(10);
		doc.setTextColor(...C_SLATE);
	}

	if (data.psiDegradedReason) {
		y = ensureSpace(doc, y, 24);
		doc.setFillColor(...C_AMBER_BG);
		doc.roundedRect(MARGIN, y, MAX_W, 18, 1.5, 1.5, "F");
		doc.setDrawColor(253, 230, 138);
		doc.roundedRect(MARGIN, y, MAX_W, 18, 1.5, 1.5, "S");
		doc.setTextColor(...C_AMBER);
		doc.setFont("helvetica", "bold");
		doc.text("Partial report", MARGIN + 3, y + 6);
		doc.setFont("helvetica", "normal");
		doc.setFontSize(8.5);
		const noteY = addWrapped(
			doc,
			data.psiDegradedReason,
			MARGIN + 3,
			y + 10,
			MAX_W - 6,
			5.5,
		);
		y = noteY + 6;
		doc.setFontSize(10);
		doc.setTextColor(...C_SLATE);
	}

	y += 6;
	y = ensureSpace(doc, y, 40);

	/* Scores section */
	doc.setFillColor(...C_SKY_SOFT);
	doc.roundedRect(MARGIN, y, MAX_W, 52, 2, 2, "F");
	doc.setDrawColor(186, 230, 253);
	doc.roundedRect(MARGIN, y, MAX_W, 52, 2, 2, "S");

	doc.setTextColor(...C_SLATE);
	doc.setFont("helvetica", "bold");
	doc.setFontSize(11);
	doc.text("Scores at a glance", MARGIN + 4, y + 8);

	const scoreLine = (label: string, v: number | null) =>
		`${label}: ${v == null ? "—" : `${v}/100`}`;

	doc.setFont("helvetica", "normal");
	doc.setFontSize(9.5);
	const leftX = MARGIN + 4;
	const rightX = MARGIN + 4 + MAX_W / 2 - 4;
	const row1 = y + 14;
	doc.text(scoreLine("Trust score", data.trustScore), leftX, row1);
	doc.text(scoreLine("Conversion", data.conversion), rightX, row1);
	const row2 = row1 + LINE + 2;
	doc.text(scoreLine("Performance", data.performance), leftX, row2);
	doc.text(scoreLine("Accessibility", data.accessibility), rightX, row2);
	const row3 = row2 + LINE + 2;
	doc.text(scoreLine("Best practices", data.bestPractices), leftX, row3);
	doc.text(scoreLine("SEO", data.seo), rightX, row3);
	y += 56;

	if (data.metrics) {
		y = ensureSpace(doc, y, 36);
		doc.setTextColor(...C_SLATE);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		y = addWrapped(doc, "Core Web Vitals (lab)", MARGIN, y, MAX_W, LINE) + 3;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...C_MUTED);
		const m = [
			["First Contentful Paint", data.metrics.fcp],
			["Largest Contentful Paint", data.metrics.lcp],
			["Total Blocking Time", data.metrics.tbt],
			["Cumulative Layout Shift", data.metrics.cls],
		] as const;
		for (const [k, v] of m) {
			y = ensureSpace(doc, y, LINE + 2);
			doc.text(`${k}: `, MARGIN, y);
			const w = doc.getTextWidth(`${k}: `);
			doc.setFont("helvetica", "bold");
			doc.setTextColor(...C_SLATE);
			doc.text(String(v || "—"), MARGIN + w, y);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(...C_MUTED);
			y += LINE + 1;
		}
		y += 4;
		doc.setTextColor(...C_SLATE);
	}

	if (data.aiInsight?.executiveSummary) {
		y = ensureSpace(doc, y, 30);
		doc.setDrawColor(...C_SKY);
		doc.setLineWidth(0.35);
		doc.line(MARGIN, y, MARGIN + 24, y);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		y =
			addWrapped(
				doc,
				"Executive summary",
				MARGIN + 28,
				y - 1,
				MAX_W - 28,
				LINE,
			) + 6;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.setTextColor(...C_MUTED);
		y =
			addWrapped(
				doc,
				data.aiInsight.executiveSummary,
				MARGIN,
				y,
				MAX_W,
				LINE + 0.5,
			) + 8;
		doc.setTextColor(...C_SLATE);
	}

	const actions = (data.aiInsight?.prioritizedActions ?? []).slice(0, 8);
	if (actions.length > 0) {
		y = ensureSpace(doc, y, 28);
		doc.setDrawColor(...C_SKY);
		doc.line(MARGIN, y, MARGIN + 24, y);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(11);
		y =
			addWrapped(
				doc,
				"Prioritized actions",
				MARGIN + 28,
				y - 1,
				MAX_W - 28,
				LINE,
			) + 5;
		doc.setFont("helvetica", "normal");
		doc.setFontSize(9.5);
		doc.setTextColor(...C_MUTED);
		for (const a of actions) {
			const block = `${a.priority}. ${a.action}  (${a.impact} impact · ${a.effort} effort)`;
			y = ensureSpace(doc, y, LINE + 2);
			y = addWrapped(doc, block, MARGIN, y, MAX_W, LINE) + 2;
		}
		y += 4;
		doc.setTextColor(...C_SLATE);
	}

	doc.setFontSize(8);
	doc.setTextColor(148, 163, 184);
	y = ensureSpace(doc, y, 12);
	addWrapped(
		doc,
		"Designed by Anthony · designedbyanthony.com · Lighthouse Scanner v2",
		MARGIN,
		PAGE_H - MARGIN - 2,
		MAX_W,
		LINE,
	);

	return doc.output("blob");
}
