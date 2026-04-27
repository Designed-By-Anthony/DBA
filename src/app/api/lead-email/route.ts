/**
 * Interim lead-email handler for the Designed by Anthony marketing forms.
 *
 * Accepts the same JSON payload the marketing AuditForm already posts (see
 * `src/scripts/audit-forms.ts` — it converts FormData to a
 * canonical `PublicLeadIngestBody` via `buildPublicLeadPayloadFromFormData`
 * and sends it with `Content-Type: application/json`) and, instead of
 * forwarding to a CRM, composes a transactional email via Resend and
 * delivers it to `LEAD_EMAIL_TO` (defaults to Anthony's inbox).
 *
 * This route is a **bridge** while the VertaFlow CRM tenant is still being
 * provisioned. When the CRM is ready, flip `PUBLIC_INGEST_URL` on the
 * marketing Vercel project back to the VertaFlow ingest URL and this route
 * stops receiving traffic — no code change needed to retire it.
 *
 * Contract match: responds with the same shape `AuditForm` already handles.
 *   - Success: 200 `{ ok: true }`
 *   - Validation: 400 `{ errors: [{ field?, message }] }`
 *   - Turnstile fail: 403 `{ errors: [{ message }] }`
 *   - Resend/config fail: 502/503 `{ errors: [{ message }] }`
 */

import { verifyTurnstileToken } from "@lh/lib/turnstile";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
	type PublicLeadIngestBody,
	parsePublicLeadIngestBody,
} from "@/lib/lead-form-contract";

const APEX_SUBDOMAIN_PATTERN =
	/^https:\/\/([a-z0-9-]+\.)*designedbyanthony\.com$/i;
const LOCAL_ORIGINS = new Set<string>([
	"http://localhost:4321",
	"http://127.0.0.1:4321",
	"http://localhost:3000", // pragma: allowlist secret
	"http://127.0.0.1:3000", // pragma: allowlist secret
	"http://localhost:3100", // pragma: allowlist secret
	"http://127.0.0.1:3100", // pragma: allowlist secret
]);

function buildCorsHeaders(origin: string | null): Record<string, string> {
	const isAllowed =
		!!origin &&
		(APEX_SUBDOMAIN_PATTERN.test(origin) || LOCAL_ORIGINS.has(origin));
	const allow = isAllowed && origin ? origin : "https://designedbyanthony.com";
	return {
		"Access-Control-Allow-Origin": allow,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		Vary: "Origin",
	};
}

export async function OPTIONS(request: Request) {
	return NextResponse.json(
		{},
		{ headers: buildCorsHeaders(request.headers.get("origin")) },
	);
}

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
		`New lead from designedbyanthony.com`,
		``,
		...rows.map(([label, value]) => `${label}: ${value}`),
		``,
		`— Interim lead-email bridge (lighthouse /api/lead-email).`,
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
<p style="margin:0;font-size:12px;color:#94a3b8;">Interim lead-email bridge · replaced by VertaFlow CRM ingest when tenant is live.</p>
</div></body></html>`;

	return { text: textLines.join("\n"), html };
}

export async function POST(request: Request) {
	const corsHeaders = buildCorsHeaders(request.headers.get("origin"));

	const rawBody: unknown = await request.json().catch(() => null);
	if (rawBody == null || typeof rawBody !== "object") {
		return NextResponse.json(
			{ errors: [{ message: "Invalid request body." }] },
			{ status: 400, headers: corsHeaders },
		);
	}

	// Honeypot — silent success for bots to avoid advertising the filter.
	const honeypot = (rawBody as Record<string, unknown>)._hp;
	if (typeof honeypot === "string" && honeypot.trim().length > 0) {
		return NextResponse.json(
			{ ok: true },
			{ status: 200, headers: corsHeaders },
		);
	}

	let lead: PublicLeadIngestBody;
	try {
		lead = parsePublicLeadIngestBody(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = err.issues.map((issue) => ({
				field: issue.path[0] ? String(issue.path[0]) : undefined,
				message: issue.message,
			}));
			return NextResponse.json(
				{ errors },
				{ status: 400, headers: corsHeaders },
			);
		}
		return NextResponse.json(
			{ errors: [{ message: "Invalid request body." }] },
			{ status: 400, headers: corsHeaders },
		);
	}

	const turnstileToken = lead.cfTurnstileResponse ?? "";
	const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
	if (turnstileSecret) {
		if (!turnstileToken) {
			return NextResponse.json(
				{ errors: [{ message: "Security verification is required." }] },
				{ status: 403, headers: corsHeaders },
			);
		}
		const verifyRes = await verifyTurnstileToken(turnstileToken);
		if (!verifyRes.success) {
			return NextResponse.json(
				{
					errors: [
						{
							message: "Bot verification failed. Please refresh and try again.",
						},
					],
				},
				{ status: 403, headers: corsHeaders },
			);
		}
	}

	const resendApiKey = process.env.RESEND_API_KEY;
	const fromEmail =
		process.env.RESEND_FROM_EMAIL?.trim() || "outreach@designedbyanthony.com";
	const toEmail = process.env.LEAD_EMAIL_TO || "anthony@designedbyanthony.com";

	if (!resendApiKey) {
		console.error(
			"[lead-email] RESEND_API_KEY is not configured on the lighthouse project; rejecting lead",
		);
		return NextResponse.json(
			{
				errors: [
					{
						message:
							"Lead email bridge is not configured on this deployment. Please try again later.",
					},
				],
			},
			{ status: 503, headers: corsHeaders },
		);
	}

	const { text, html } = renderEmail(lead);
	const subject = `New lead · ${lead.name} · ${lead.leadSource || lead.offerType || "designedbyanthony.com"}`;

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
			return NextResponse.json(
				{
					errors: [
						{
							message:
								"Could not send your request right now. Please try again later.",
						},
					],
				},
				{ status: 502, headers: corsHeaders },
			);
		}
	} catch (err) {
		console.error(
			"[lead-email] Resend network error",
			err instanceof Error ? err.message : err,
		);
		return NextResponse.json(
			{
				errors: [
					{
						message:
							"Could not send your request right now. Please try again later.",
					},
				],
			},
			{ status: 502, headers: corsHeaders },
		);
	}

	return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
}
