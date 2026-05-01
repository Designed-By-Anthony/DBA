import { isGmailConfigured, sendViaGmail } from "@dba/shared/lighthouse/lib/gmail";
import { Elysia } from "elysia";
import { z } from "zod";
import { tryInsertLead } from "@dba/shared/lib/d1Leads";
import {
	type PublicLeadIngestBody,
	parsePublicLeadIngestBody,
} from "@dba/shared/lib/lead-form-contract";
import { postLeadIngest } from "@dba/shared/lib/leadWebhook";
import {
	resolveEffectiveSecretKey,
	verifyTurnstileToken,
} from "@dba/shared/lib/turnstile";

/*
 * CORS for `/api/lead-email` is handled exclusively by the global
 * `@elysiajs/cors` plugin mounted in `apps/api/src/index.ts`. Setting
 * `Access-Control-Allow-Origin` here as well caused duplicate values in
 * the response header (e.g. "https://designedbyanthony.com,
 * https://designedbyanthony.com"), which browsers reject with:
 *   "The 'Access-Control-Allow-Origin' header contains multiple values
 *    'https://designedbyanthony.com, https://designedbyanthony.com',
 *    but only one is allowed."
 */

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function renderEmail(lead: PublicLeadIngestBody): {
	text: string;
	html: string;
} {
	const rows: Array<[string, string]> = [
		["Name", lead.name],
		["Email", lead.email],
		["Phone", lead.phone ?? ""],
		["Website", lead.website ?? ""],
		["What feels off", lead.message ?? ""],
		["Offer type", lead.offerType ?? ""],
		["Lead source", lead.leadSource ?? ""],
		["CTA source", lead.ctaSource ?? ""],
		["Page context", lead.pageContext ?? ""],
		["Page URL", lead.pageUrl ?? ""],
		["Referrer", lead.referrerUrl ?? ""],
		["Page title", lead.pageTitle ?? ""],
		["GA client id", lead.gaClientId ?? ""],
	].filter(([, value]) => value.length > 0) as Array<[string, string]>;

	const textLines = [
		"New lead from designedbyanthony.com",
		"",
		...rows.map(([label, value]) => `${label}: ${value}`),
		"",
		"— Interim lead-email bridge (dba-api /api/lead-email).",
	];

	const htmlRows = rows
		.map(
			([label, value]) =>
				`<tr><td style="padding:6px 14px 6px 0;color:#475569;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f172a;">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
		)
		.join("");

	const html = `<!doctype html><html><body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
<h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f172a;">New lead from designedbyanthony.com</h1>
<p style="margin:0 0 16px;font-size:13px;color:#64748b;">${escapeHtml(lead.leadSource || lead.offerType || "Website form")}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5;">${htmlRows}</table>
<hr style="margin:20px 0;border:0;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:12px;color:#94a3b8;">Interim lead-email bridge · replaced by The Vault lead ingest when tenant is live.</p>
</div></body></html>`;

	return { text: textLines.join("\n"), html };
}

export const leadEmailRoute = new Elysia({ aot: false }).post(
	"/api/lead-email",
	async ({ request, set }) => {
		const rawBody: unknown = await request.json().catch(() => null);
		if (rawBody == null || typeof rawBody !== "object") {
			set.status = 400;
			return { errors: [{ message: "Invalid request body." }] };
		}

		const turnstileSecret = resolveEffectiveSecretKey(
			process.env.TURNSTILE_SECRET_KEY?.trim(),
		);
		if (turnstileSecret) {
			const body = rawBody as Record<string, unknown>;
			const cfToken =
				typeof body.cf_turnstile_response === "string"
					? body.cf_turnstile_response.trim()
					: "";
			if (!cfToken) {
				set.status = 403;
				return {
					errors: [
						{
							message:
								"Security check required. Please complete the challenge and try again.",
						},
					],
				};
			}
			const verification = await verifyTurnstileToken(cfToken, turnstileSecret);
			if (!verification.success) {
				console.warn(
					"[lead-email] Turnstile verification failed:",
					verification.errorCodes,
				);
				set.status = 403;
				return {
					errors: [
						{
							message:
								"Security check failed. Please refresh the page and try again.",
						},
					],
				};
			}
		}

		let lead: PublicLeadIngestBody;
		try {
			lead = parsePublicLeadIngestBody(rawBody);
		} catch (err) {
			if (err instanceof z.ZodError) {
				set.status = 400;
				return {
					errors: err.issues.map((issue) => ({
						field: issue.path[0] ? String(issue.path[0]) : undefined,
						message: issue.message,
					})),
				};
			}
			set.status = 400;
			return { errors: [{ message: "Invalid request body." }] };
		}

		await tryInsertLead({
			id: crypto.randomUUID(),
			email: lead.email,
			company_name: lead.company ?? null,
			source: "Contact_Form",
			status: "New",
			turnstile_passed: turnstileSecret ? 1 : null,
			metadata: JSON.stringify({
				name: lead.name,
				phone: lead.phone,
				website: lead.website,
				message: lead.message,
				leadSource: lead.leadSource,
				offerType: lead.offerType,
				pageUrl: lead.pageUrl,
			}),
			created_at: Date.now(),
		});

		const leadWebhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();
		const resendApiKey = process.env.RESEND_API_KEY;
		const gmailReady = isGmailConfigured();

		if (!leadWebhookUrl && !gmailReady && !resendApiKey) {
			console.error(
				"[lead-email] No lead transport configured (LEAD_WEBHOOK_URL, GMAIL_SERVICE_ACCOUNT_KEY, RESEND_API_KEY all missing); rejecting lead",
			);
			set.status = 503;
			return {
				errors: [
					{
						message:
							"Lead ingest is not configured on this deployment. Please try again later.",
					},
				],
			};
		}

		if (leadWebhookUrl) {
			try {
				const hookRes = await postLeadIngest(leadWebhookUrl, {
					...lead,
					source: "marketing_site",
				});
				if (!hookRes.ok) {
					const errText = await hookRes.text().catch(() => "");
					console.error(
						"[lead-email] LEAD_WEBHOOK_URL rejected",
						hookRes.status,
						errText.slice(0, 500),
					);
					set.status = 502;
					return {
						errors: [
							{
								message: "Could not save your request. Please try again later.",
							},
						],
					};
				}
			} catch (err) {
				console.error(
					"[lead-email] LEAD_WEBHOOK_URL network error",
					err instanceof Error ? err.message : err,
				);
				set.status = 502;
				return {
					errors: [
						{
							message: "Could not save your request. Please try again later.",
						},
					],
				};
			}
		}

		if (!gmailReady && !resendApiKey) {
			return { ok: true };
		}

		const toEmail =
			process.env.LEAD_EMAIL_TO?.trim() || "anthony@designedbyanthony.com";

		const { text, html } = renderEmail(lead);
		const subject = `New lead · ${lead.name} · ${lead.leadSource || lead.offerType || "designedbyanthony.com"}`;

		// Prefer Gmail (Workspace domain-wide delegation, no third-party
		// rate limits, no extra MTA) and fall back to Resend only if Gmail
		// is unavailable or fails. The webhook ingest above already saved
		// the lead, so a notification failure here is non-fatal when
		// `leadWebhookUrl` succeeded.
		if (gmailReady) {
			try {
				await sendViaGmail(toEmail, subject, html, {
					replyTo: lead.email,
					// Notification already lands in Anthony's mailbox; a
					// self-BCC would just duplicate it.
					bcc: null,
				});
				return { ok: true };
			} catch (err) {
				console.error(
					"[lead-email] Gmail API send failed",
					err instanceof Error ? err.message : err,
				);
				if (!resendApiKey) {
					if (leadWebhookUrl) {
						return { ok: true, emailDelivered: false };
					}
					set.status = 502;
					return {
						errors: [
							{
								message:
									"Could not send your request right now. Please try again later.",
							},
						],
					};
				}
				// Fall through to Resend below.
			}
		}

		if (!resendApiKey) {
			// Either Gmail succeeded (already returned above) or there
			// is no fallback to attempt; the webhook persisted the lead.
			return { ok: true, emailDelivered: false };
		}

		const fromEmail =
			process.env.RESEND_FROM_EMAIL?.trim() || "outreach@designedbyanthony.com";

		try {
			const resendRes = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${resendApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					from: fromEmail,
					to: [toEmail],
					reply_to: lead.email,
					subject,
					text,
					html,
				}),
			});

			if (!resendRes.ok) {
				const body = (await resendRes.json().catch(() => ({}))) as {
					message?: string;
					name?: string;
				};
				console.error(
					"[lead-email] Resend API rejected send",
					resendRes.status,
					body,
				);
				if (leadWebhookUrl) {
					return { ok: true, emailDelivered: false };
				}
				set.status = 502;
				return {
					errors: [
						{
							message:
								"Could not send your request right now. Please try again later.",
						},
					],
				};
			}
		} catch (err) {
			console.error(
				"[lead-email] Resend network error",
				err instanceof Error ? err.message : err,
			);
			if (leadWebhookUrl) {
				return { ok: true, emailDelivered: false };
			}
			set.status = 502;
			return {
				errors: [
					{
						message:
							"Could not send your request right now. Please try again later.",
					},
				],
			};
		}

		return { ok: true };
	},
);
