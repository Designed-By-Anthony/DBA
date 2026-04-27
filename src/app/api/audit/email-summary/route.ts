import { buildAuditSummaryEmail } from "@lh/lib/auditSummaryEmail";
import {
	buildCorsHeaders,
	checkLocalRateLimit,
	getClientAddress,
} from "@lh/lib/http";
import {
	isResendConfigured,
	sendTransactionalEmail,
} from "@lh/lib/transactionalResend";
import { normalizeEmail, normalizeText } from "@lh/lib/validation";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60 * 60_000;

const bodySchema = z.object({
	email: z.string().email(),
	name: z.string().max(120).optional(),
	reportId: z.string().max(64).nullable().optional(),
	url: z.string().url(),
	trustScore: z.number().int().min(0).max(100),
	performance: z.number().int().min(0).max(100).nullable(),
	accessibility: z.number().int().min(0).max(100).nullable(),
	bestPractices: z.number().int().min(0).max(100).nullable(),
	seo: z.number().int().min(0).max(100).nullable(),
	psiDegradedReason: z.string().max(2000).nullable().optional(),
});

export async function POST(request: Request) {
	const corsHeaders = buildCorsHeaders(request, "POST, OPTIONS");
	const responseHeaders = { ...corsHeaders, "Cache-Control": "no-store" };

	try {
		const retryAfter = checkLocalRateLimit(
			`audit-email-summary:${getClientAddress(request)}`,
			RATE_LIMIT,
			RATE_WINDOW_MS,
		);
		if (retryAfter) {
			return NextResponse.json(
				{ error: "Too many email requests. Please try again later." },
				{
					status: 429,
					headers: { ...responseHeaders, "Retry-After": String(retryAfter) },
				},
			);
		}

		let raw: unknown;
		try {
			raw = await request.json();
		} catch {
			return NextResponse.json(
				{ error: "Invalid JSON body." },
				{ status: 400, headers: responseHeaders },
			);
		}

		const parsed = bodySchema.safeParse(raw);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid request." },
				{ status: 400, headers: responseHeaders },
			);
		}

		const body = parsed.data;
		const email = normalizeEmail(body.email);
		if (!email) {
			return NextResponse.json(
				{ error: "Invalid email." },
				{ status: 400, headers: responseHeaders },
			);
		}

		if (!isResendConfigured()) {
			return NextResponse.json(
				{ error: "Email delivery is not configured." },
				{ status: 503, headers: responseHeaders },
			);
		}

		const reportPublicBase = (
			process.env.REPORT_PUBLIC_BASE_URL || "https://designedbyanthony.com"
		).replace(/\/$/, "");

		const firstName = normalizeText(body.name ?? "", 120).split(/\s+/)[0] ?? "";
		const { subject, text, html } = buildAuditSummaryEmail({
			firstName,
			url: body.url,
			reportId: body.reportId ?? null,
			trustScore: body.trustScore,
			performance: body.performance,
			accessibility: body.accessibility,
			bestPractices: body.bestPractices,
			seo: body.seo,
			psiNote: body.psiDegradedReason ?? null,
			reportPublicBase,
		});

		await sendTransactionalEmail({
			to: email,
			subject,
			html,
			text,
		});

		return NextResponse.json({ ok: true }, { headers: responseHeaders });
	} catch (err) {
		console.error(
			"audit email-summary:",
			err instanceof Error ? err.message : err,
		);
		return NextResponse.json(
			{ error: "Could not send email right now. Try again shortly." },
			{ status: 502, headers: responseHeaders },
		);
	}
}

export async function OPTIONS(request: Request) {
	const corsHeaders = buildCorsHeaders(request, "POST, OPTIONS");
	return new Response(null, { status: 204, headers: corsHeaders });
}
