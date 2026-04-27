import { escapeHtml } from "@lh/lib/validation";

export type AuditSummaryEmailParams = {
	firstName: string;
	url: string;
	reportId: string | null;
	trustScore: number;
	performance: number | null;
	accessibility: number | null;
	bestPractices: number | null;
	seo: number | null;
	psiNote?: string | null;
	reportPublicBase: string;
};

function scoreLine(label: string, value: number | null): string {
	if (value == null) return `${label}: not available (partial report)`;
	return `${label}: ${value}/100`;
}

/**
 * Plain-text + branded HTML summary for "Email summary" from the results screen.
 */
export function buildAuditSummaryEmail(params: AuditSummaryEmailParams): {
	subject: string;
	text: string;
	html: string;
} {
	const displayDomain = (() => {
		try {
			return new URL(params.url).hostname.replace(/^www\./, "");
		} catch {
			return params.url;
		}
	})();

	const subject = `Your audit summary — ${displayDomain}`;
	const base = params.reportPublicBase.replace(/\/$/, "");
	const reportPath = params.reportId
		? `${base}/report/${params.reportId}`
		: `${base}/lighthouse`;
	const printPath = params.reportId
		? `${base}/lighthouse/report/${params.reportId}/print`
		: null;

	const greeting = params.firstName.trim()
		? `Hi ${params.firstName.trim()},`
		: "Hi,";

	const lines = [
		greeting,
		"",
		`We finished a scan for ${params.url}.`,
		"",
		scoreLine("Trust score", params.trustScore),
		scoreLine("Performance", params.performance),
		scoreLine("Accessibility", params.accessibility),
		scoreLine("Best practices", params.bestPractices),
		scoreLine("SEO", params.seo),
		"",
		params.psiNote ? `Note: ${params.psiNote}` : "",
		params.psiNote ? "" : "",
		`View or print the full report: ${reportPath}`,
		printPath ? `Print-optimized page: ${printPath}` : "",
		"",
		"— Designed by Anthony",
	].filter(Boolean);

	const safeUrl = escapeHtml(params.url);
	const safeNote = params.psiNote ? escapeHtml(params.psiNote) : "";
	const safeReport = escapeHtml(reportPath);
	const safePrint = printPath ? escapeHtml(printPath) : "";

	const row = (label: string, value: number | null) => {
		const v =
			value == null
				? '<span style="color:#94a3b8;font-weight:500;">—</span>'
				: `<span style="font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${value}</span><span style="font-size:12px;color:#64748b;font-weight:600;">/100</span>`;
		return `<tr><td style="padding:14px 0;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(label)}</td><td style="padding:14px 0;border-bottom:1px solid #e2e8f0;text-align:right;">${v}</td></tr>`;
	};

	const html = `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#f8fafc;">
  <tr><td style="padding:28px 24px 8px;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#0369a1;">Designed by Anthony</p>
    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;line-height:1.25;">Lighthouse Scanner</h1>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#475569;">${escapeHtml(greeting)} Your scan for <strong style="color:#0f172a;">${safeUrl}</strong> is ready.</p>
  </td></tr>
  <tr><td style="padding:0 24px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 12px 40px -20px rgba(15,23,42,0.12);">
      <tr><td style="height:3px;background:linear-gradient(90deg,#0ea5e9,#6366f1,#d4b878);"></td></tr>
      <tr><td style="padding:22px 24px 8px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Scores</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${row("Trust score", params.trustScore)}
          ${row("Performance", params.performance)}
          ${row("Accessibility", params.accessibility)}
          ${row("Best practices", params.bestPractices)}
          ${row("SEO", params.seo)}
        </table>
      </td></tr>
      ${safeNote ? `<tr><td style="padding:0 24px 20px;"><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.5;color:#92400e;"><strong>Partial report.</strong> ${safeNote}</div></td></tr>` : ""}
      <tr><td style="padding:8px 24px 24px;">
        <a href="${safeReport}" style="display:inline-block;background:linear-gradient(165deg,#0ea5e9,#1d4ed8);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;box-shadow:0 8px 24px -8px rgba(14,165,233,0.45);">Open full report →</a>
        ${printPath ? `<a href="${safePrint}" style="display:inline-block;margin-left:10px;color:#0369a1;font-weight:600;font-size:14px;text-decoration:none;border:1px solid #bae6fd;padding:11px 20px;border-radius:10px;background:#f0f9ff;">Print / PDF</a>` : ""}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center;">Designed by Anthony · Central NY &amp; remote</p>
  </td></tr>
</table>`.trim();

	return { subject, text: lines.join("\n"), html };
}
