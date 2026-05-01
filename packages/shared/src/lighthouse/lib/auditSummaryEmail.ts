import { escapeHtml } from "./validation";

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

	const subject = `Your site report is ready — ${displayDomain}`;
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
		"— ANTHONY.",
	].filter(Boolean);

	const safeUrl = escapeHtml(params.url);
	const safeNote = params.psiNote ? escapeHtml(params.psiNote) : "";
	const safeReport = escapeHtml(reportPath);
	const safePrint = printPath ? escapeHtml(printPath) : "";

	const row = (label: string, value: number | null) => {
		const v =
			value == null
				? '<span style="color:#9d8870;font-weight:500;">—</span>'
				: `<span style="font-size:22px;font-weight:700;color:#171008;letter-spacing:-0.02em;">${value}</span><span style="font-size:12px;color:#8b6a38;font-weight:600;">/100</span>`;
		return `<tr><td style="padding:14px 0;border-bottom:1px solid #e8dcc6;font-size:13px;font-weight:600;color:#6f6658;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(label)}</td><td style="padding:14px 0;border-bottom:1px solid #e8dcc6;text-align:right;">${v}</td></tr>`;
	};

	const html = `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#f7f3ea;">
  <tr><td style="padding:28px 24px 8px;">
    <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#8b6a38;">ANTHONY.</p>
    <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#171008;line-height:1.25;">Lighthouse Scanner</h1>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.55;color:#3d362d;">${escapeHtml(greeting)} Your scan for <strong style="color:#171008;">${safeUrl}</strong> is ready.</p>
  </td></tr>
  <tr><td style="padding:0 24px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf8;border-radius:14px;border:1px solid #e8dcc6;overflow:hidden;box-shadow:0 12px 40px -20px rgba(23,16,8,0.14);">
      <tr><td style="height:3px;background:linear-gradient(90deg,#D4AF37,#8b6a38,#D4AF37);"></td></tr>
      <tr><td style="padding:22px 24px 8px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8b6a38;">Scores</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${row("Trust score", params.trustScore)}
          ${row("Performance", params.performance)}
          ${row("Accessibility", params.accessibility)}
          ${row("Best practices", params.bestPractices)}
          ${row("SEO", params.seo)}
        </table>
      </td></tr>
      ${safeNote ? `<tr><td style="padding:0 24px 20px;"><div style="background:#fff8df;border:1px solid #D4AF37;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.5;color:#6c4b16;"><strong>Partial report.</strong> ${safeNote}</div></td></tr>` : ""}
      <tr><td style="padding:8px 24px 24px;">
        <a href="${safeReport}" style="display:inline-block;background:linear-gradient(165deg,#D4AF37,#8b6a38);color:#171008;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;box-shadow:0 8px 24px -8px rgba(212,175,55,0.55);">View your report →</a>
        ${printPath ? `<a href="${safePrint}" style="display:inline-block;margin-left:10px;color:#8b6a38;font-weight:600;font-size:14px;text-decoration:none;border:1px solid #D4AF37;padding:11px 20px;border-radius:10px;background:#fdf8f0;">Print / PDF</a>` : ""}
      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:12px;color:#9d8870;text-align:center;">ANTHONY. · Central NY &amp; remote</p>
  </td></tr>
</table>`.trim();

	return { subject, text: lines.join("\n"), html };
}
