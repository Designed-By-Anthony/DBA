import { google } from "googleapis";
import { escapeHtml, normalizeEmail } from "@/lib/validation";

const GMAIL_SENDER = "anthony@designedbyanthony.com";

function sanitizeHeaderValue(value: string): string {
	return value.replace(/[\r\n]+/g, " ").trim();
}

export function isGmailConfigured(): boolean {
	return Boolean(process.env.GMAIL_SERVICE_ACCOUNT_KEY);
}

/**
 * Test-fire mode for Lighthouse: record sends in-memory instead of hitting
 * the Gmail API. Enabled when `EMAIL_TEST_MODE=true`, `NEXT_PUBLIC_IS_TEST=true`,
 * or when running under Playwright.
 */
export function isGmailTestMode(): boolean {
	if (process.env.EMAIL_TEST_MODE === "true") return true;
	if (process.env.NEXT_PUBLIC_IS_TEST === "true") return true;
	if (process.env.PLAYWRIGHT_TEST_BASE_URL) return true;
	return false;
}

export type GmailCapturedEmail = {
	id: string;
	firedAt: string;
	to: string;
	subject: string;
	html: string;
};

type GmailMailerGlobal = { outbox: GmailCapturedEmail[]; counter: number };
const gmailGlobalKey = "__DBA_LIGHTHOUSE_GMAIL_OUTBOX__" as const;
const gmailG = globalThis as unknown as Record<
	typeof gmailGlobalKey,
	GmailMailerGlobal | undefined
>;

function getGmailStore(): GmailMailerGlobal {
	if (!gmailG[gmailGlobalKey]) {
		gmailG[gmailGlobalKey] = { outbox: [], counter: 0 };
	}
	return gmailG[gmailGlobalKey]!;
}

export function getGmailTestOutbox(): GmailCapturedEmail[] {
	return [...getGmailStore().outbox];
}

export function clearGmailTestOutbox(): void {
	const s = getGmailStore();
	s.outbox = [];
	s.counter = 0;
}

/**
 * Sends an HTML email via the Gmail API using domain-wide delegation.
 *
 * Requires GMAIL_SERVICE_ACCOUNT_KEY env var containing the JSON of a service
 * account that has been granted domain-wide delegation with the
 * `https://www.googleapis.com/auth/gmail.send` scope in Google Workspace admin,
 * and GMAIL_SENDER must be a real user in that workspace.
 */
export async function sendViaGmail(
	to: string,
	subject: string,
	html: string,
): Promise<void> {
	const recipient = normalizeEmail(to);
	if (!recipient) {
		throw new Error("Invalid recipient email address.");
	}

	if (isGmailTestMode()) {
		const store = getGmailStore();
		store.counter += 1;
		store.outbox.push({
			id: `gmail-test-fire-${store.counter}-${Date.now()}`,
			firedAt: new Date().toISOString(),
			to: recipient,
			subject,
			html,
		});
		return;
	}

	const keyJson = process.env.GMAIL_SERVICE_ACCOUNT_KEY;
	if (!keyJson) {
		throw new Error("Email delivery is not configured.");
	}

	let key: { client_email: string; private_key: string };
	try {
		key = JSON.parse(keyJson);
	} catch {
		throw new Error("Email delivery credentials are invalid.");
	}

	const auth = new google.auth.JWT({
		email: key.client_email,
		key: key.private_key,
		scopes: ["https://www.googleapis.com/auth/gmail.send"],
		subject: GMAIL_SENDER,
	});

	const gmail = google.gmail({ version: "v1", auth });

	// RFC 2047 encode the subject for non-ASCII safety
	const encodedSubject = `=?UTF-8?B?${Buffer.from(sanitizeHeaderValue(subject)).toString("base64")}?=`;

	const messageParts = [
		`From: Anthony <${GMAIL_SENDER}>`,
		`To: ${recipient}`,
		`Bcc: ${GMAIL_SENDER}`,
		`Subject: ${encodedSubject}`,
		"MIME-Version: 1.0",
		'Content-Type: text/html; charset="UTF-8"',
		"",
		html,
	];
	const raw = Buffer.from(messageParts.join("\r\n"))
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");

	await gmail.users.messages.send({
		userId: "me",
		requestBody: { raw },
	});
	if (process.env.NODE_ENV === "development") {
		console.info(`Email sent to ${recipient} via Gmail API`);
	}
}

export function buildReceiptEmail(params: {
	firstName: string;
	url: string;
	reportId: string;
	trustScore: number;
	performance: number;
	accessibility: number;
	bestPractices: number;
	seo: number;
}): { subject: string; html: string } {
	const {
		firstName,
		url,
		reportId,
		trustScore,
		performance,
		accessibility,
		bestPractices,
		seo,
	} = params;
	const safeFirstName = escapeHtml(firstName);
	const safeUrl = escapeHtml(url);
	const safeReportId = escapeHtml(reportId);
	const greeting = safeFirstName ? `Hi ${safeFirstName}` : "Hey there";
	const reportUrl = `https://designedbyanthony.com/report/${reportId}?utm_source=receipt_email&utm_medium=email&utm_campaign=audit_report`;
	const calendarUrl = `https://calendar.app.google/c1CaLZJQkbTAs9abA?custom_url=designedbyanthony.com/report/${reportId}`;

	const displayDomain = (() => {
		try {
			return new URL(url).hostname.replace(/^www\./, "");
		} catch {
			return url;
		}
	})();
	const subject = `Your site audit for ${displayDomain}`;

	const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; line-height: 1.6; font-size: 15px; max-width: 560px;">
    <p>${greeting} &mdash;</p>

    <p>Your Local Digital Presence Audit for <strong>${safeUrl}</strong> is ready and saved here:</p>

    <p style="margin: 20px 0;">
      <a href="${reportUrl}" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">View your report &rarr;</a>
    </p>

    <p>Your overall <strong>Local Trust Score</strong> came out to <strong>${trustScore}/100</strong>.</p>
    
    <p>Quick technical scores: <strong>${performance}</strong> / <strong>${accessibility}</strong> / <strong>${bestPractices}</strong> / <strong>${seo}</strong> (Performance / Accessibility / Best Practices / SEO). The full breakdown, my AI's analysis of your copywriting, and a print-ready version are all at the link above.</p>

    <p style="color: #6b7280; font-size: 13px;">Audit run: ${new Date().toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} ET</p>

    <p>If anything looks off or you want to walk through it together, just reply to this email &mdash; or grab 15 minutes on my calendar: <a href="${calendarUrl}" style="color: #111;">${calendarUrl.split("?")[0]}</a>.</p>

    <p style="margin-top: 28px;">Best,<br><strong>Anthony</strong><br><span style="color: #666; font-size: 14px;">Designed by Anthony</span></p>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
      Report ID: ${safeReportId} &middot; This is a one-time transactional receipt for the audit you requested.
    </p>
  </div>
  `;

	return { subject, html };
}

/**
 * Builds a formatted internal alert email sent to Anthony
 * whenever a new lead comes in from any form.
 */
export function buildInternalLeadAlert(params: {
	source: "audit" | "contact";
	projectCode: string;
	name: string;
	email: string;
	company: string;
	url: string;
	location?: string;
	phone?: string;
	message?: string;
	sheetUrl?: string | null;
	// Audit-specific
	trustScore?: number;
	performance?: number;
	accessibility?: number;
	bestPractices?: number;
	seo?: number;
	conversion?: number;
	rating?: number | null;
	criticalIssue?: string;
}): { subject: string; html: string } {
	const isAudit = params.source === "audit";
	const safeCompany = escapeHtml(params.company);
	const safeName = escapeHtml(params.name);
	const safeEmail = escapeHtml(params.email);
	const safeUrl = escapeHtml(params.url);

	const subject = isAudit
		? `🔔 New Audit Lead: ${params.company} (${params.projectCode})`
		: `🔔 New Contact Lead: ${params.name}`;

	const reportLink = isAudit
		? `https://designedbyanthony.com/report/${params.projectCode}`
		: "";

	let scoresBlock = "";
	if (isAudit) {
		scoresBlock = `
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Trust Score</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0; font-size:18px; font-weight:800;">${params.trustScore ?? "N/A"}/100</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Performance</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.performance ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Accessibility</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.accessibility ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Best Practices</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.bestPractices ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">SEO</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.seo ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Conversion</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.conversion ?? "N/A"}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; background:#f1f5f9; font-weight:700; border:1px solid #e2e8f0;">Google Rating</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0;">${params.rating != null ? `${params.rating}/5.0` : "Not listed"}</td>
      </tr>
      ${
				params.criticalIssue
					? `<tr>
        <td style="padding:8px 12px; background:#fef2f2; font-weight:700; border:1px solid #e2e8f0; color:#991b1b;">Critical Issue</td>
        <td style="padding:8px 12px; border:1px solid #e2e8f0; color:#991b1b;">${escapeHtml(params.criticalIssue)}</td>
      </tr>`
					: ""
			}
    </table>`;
	}

	const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; line-height: 1.6; font-size: 15px; max-width: 600px;">
    <div style="background:#0f172a; color:#fff; padding:16px 20px; border-radius:8px 8px 0 0;">
      <strong style="font-size:16px;">${isAudit ? "📊 New Audit Lead" : "📬 New Contact Lead"}</strong>
      <span style="float:right; font-size:13px; opacity:0.7;">${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}</span>
    </div>

    <div style="padding:20px; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 8px 8px;">
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p><strong>Company:</strong> ${safeCompany}</p>
      <p><strong>Website:</strong> <a href="${safeUrl}">${safeUrl}</a></p>
      ${params.location ? `<p><strong>Location:</strong> ${escapeHtml(params.location)}</p>` : ""}
      ${params.phone ? `<p><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>` : ""}
      ${params.message ? `<p><strong>Message:</strong><br>${escapeHtml(params.message)}</p>` : ""}

      ${scoresBlock}

      ${reportLink ? `<p><a href="${reportLink}" style="display:inline-block; background:#111; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; font-weight:600; margin-top:8px;">View Report →</a></p>` : ""}

      ${params.sheetUrl ? `<p style="margin-top:12px;"><a href="${params.sheetUrl}" style="display:inline-block; background:#16a34a; color:#fff; padding:10px 18px; text-decoration:none; border-radius:6px; font-weight:600;">Open Project Sheet →</a></p>` : ""}

      <p style="color:#9ca3af; font-size:12px; margin-top:24px; border-top:1px solid #e5e7eb; padding-top:12px;">
        Project Code: ${escapeHtml(params.projectCode)} · This is an internal DBA lead alert.
      </p>
    </div>
  </div>
  `;

	return { subject, html };
}
