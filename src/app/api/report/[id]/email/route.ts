import {
	buildReceiptEmail,
	isGmailConfigured,
	sendViaGmail,
} from "@lh/lib/gmail";
import { buildCorsHeaders } from "@lh/lib/http";
import {
	db,
	FieldValue,
	REPORTS_COLLECTION,
	Timestamp,
} from "@lh/lib/report-store";
import { isValidReportId } from "@lh/lib/reportId";
import { normalizeEmail } from "@lh/lib/validation";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SENDS_PER_REPORT = 3;
const MIN_INTERVAL_MS = 60_000;
const SEND_LOCK_WINDOW_MS = 30_000;

class ApiError extends Error {
	status: number;
	headers?: Record<string, string>;

	constructor(
		status: number,
		message: string,
		headers?: Record<string, string>,
	) {
		super(message);
		this.status = status;
		this.headers = headers;
	}
}

type DocRef = ReturnType<ReturnType<typeof db.collection>["doc"]>;
type TimestampLike = ReturnType<typeof Timestamp.now>;

async function reserveEmailSend(ref: DocRef) {
	return db.runTransaction(async (transaction) => {
		const snap = await transaction.get(ref);

		if (!snap.exists) {
			throw new ApiError(404, "Report not found");
		}

		const data = snap.data();
		if (!data) {
			throw new ApiError(500, "Report data unavailable");
		}
		const sentCount = Number(data.emailSentCount ?? 0);
		if (sentCount >= MAX_SENDS_PER_REPORT) {
			throw new ApiError(
				429,
				"This report has already been emailed the maximum number of times.",
			);
		}

		const lastSentAt: TimestampLike | null =
			(data.emailLastSentAt as TimestampLike | null) || null;
		if (lastSentAt) {
			const elapsed = Date.now() - lastSentAt.toMillis();
			if (elapsed < MIN_INTERVAL_MS) {
				const waitSec = Math.ceil((MIN_INTERVAL_MS - elapsed) / 1000);
				throw new ApiError(
					429,
					`Please wait ${waitSec} seconds before requesting another copy.`,
					{ "Retry-After": String(waitSec) },
				);
			}
		}

		const lockUntil: TimestampLike | null =
			(data.emailSendLockUntil as TimestampLike | null) || null;
		if (lockUntil && lockUntil.toMillis() > Date.now()) {
			const waitSec = Math.ceil((lockUntil.toMillis() - Date.now()) / 1000);
			throw new ApiError(
				429,
				`This report email is already being processed. Please wait ${waitSec} seconds and try again.`,
				{ "Retry-After": String(waitSec) },
			);
		}

		const lead = (data.lead as Record<string, unknown> | undefined) ?? {};
		const recipient = normalizeEmail(
			typeof lead.email === "string" ? lead.email : "",
		);
		if (!recipient) {
			throw new ApiError(
				400,
				"No valid email address is on file for this report.",
			);
		}

		const scores = (data.scores as Record<string, unknown> | undefined) ?? {};
		transaction.update(ref, {
			emailSendLockUntil: Timestamp.fromMillis(
				Date.now() + SEND_LOCK_WINDOW_MS,
			),
		});

		return {
			recipient,
			firstName: lead.name ? String(lead.name).split(" ")[0] : "",
			url: String(lead.url || ""),
			trustScore: Number(scores.trustScore ?? 0),
			performance: Number(scores.performance ?? 0),
			accessibility: Number(scores.accessibility ?? 0),
			bestPractices: Number(scores.bestPractices ?? 0),
			seo: Number(scores.seo ?? 0),
		};
	});
}

/**
 * POST /api/report/[id]/email
 *
 * Sends the short transactional receipt email to the address stored on the
 * report's lead record. Triggered by the "Email me a copy" button on the
 * report page.
 *
 * Rate-limited: max 3 sends per report, min 60s between sends.
 */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const corsHeaders = buildCorsHeaders(
		request,
		"POST, OPTIONS",
		"Content-Type",
	);
	const responseHeaders = { ...corsHeaders, "Cache-Control": "no-store" };
	const { id } = await params;

	if (!isValidReportId(id)) {
		return NextResponse.json(
			{ error: "Invalid report ID format" },
			{ status: 400, headers: responseHeaders },
		);
	}

	if (!isGmailConfigured()) {
		return NextResponse.json(
			{ error: "Email delivery is not configured right now." },
			{ status: 503, headers: responseHeaders },
		);
	}

	const ref = db.collection(REPORTS_COLLECTION).doc(id);
	let lockReserved = false;

	try {
		const reserved = await reserveEmailSend(ref);
		lockReserved = true;

		const { subject, html } = buildReceiptEmail({
			firstName: reserved.firstName,
			url: reserved.url,
			reportId: id,
			trustScore: reserved.trustScore,
			performance: reserved.performance,
			accessibility: reserved.accessibility,
			bestPractices: reserved.bestPractices,
			seo: reserved.seo,
		});

		await sendViaGmail(reserved.recipient, subject, html);

		await ref.update({
			emailSentCount: FieldValue.increment(1),
			emailLastSentAt: Timestamp.now(),
			emailSendLockUntil: FieldValue.delete(),
		});

		return NextResponse.json(
			{ success: true, message: "Report emailed." },
			{ headers: responseHeaders },
		);
	} catch (err) {
		if (lockReserved) {
			await ref
				.update({
					emailSendLockUntil: FieldValue.delete(),
				})
				.catch((unlockErr) => {
					console.error(
						"Report email lock release failed:",
						unlockErr instanceof Error ? unlockErr.message : unlockErr,
					);
				});
		}

		if (err instanceof ApiError) {
			return NextResponse.json(
				{ error: err.message },
				{
					status: err.status,
					headers: {
						...responseHeaders,
						...err.headers,
					},
				},
			);
		}

		console.error(
			"Report email send failed:",
			err instanceof Error ? err.message : err,
		);
		return NextResponse.json(
			{ error: "Failed to send email" },
			{ status: 500, headers: responseHeaders },
		);
	}
}

export async function OPTIONS(request: Request) {
	const corsHeaders = buildCorsHeaders(
		request,
		"POST, OPTIONS",
		"Content-Type",
	);
	return new Response(null, { status: 204, headers: corsHeaders });
}
