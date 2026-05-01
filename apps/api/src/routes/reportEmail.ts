import {
	buildReceiptEmail,
	isGmailConfigured,
	sendViaGmail,
} from "@dba/shared/lighthouse/lib/gmail";
import {
	db,
	FieldValue,
	REPORTS_COLLECTION,
	Timestamp,
} from "@dba/shared/lighthouse/lib/report-store";
import { isValidReportId } from "@dba/shared/lighthouse/lib/reportId";
import { normalizeEmail } from "@dba/shared/lighthouse/lib/validation";
import { Elysia } from "elysia";

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
		if (!snap.exists) throw new ApiError(404, "Report not found");
		const data = snap.data();
		if (!data) throw new ApiError(500, "Report data unavailable");

		const sentCount = Number(data.emailSentCount ?? 0);
		if (sentCount >= MAX_SENDS_PER_REPORT)
			throw new ApiError(
				429,
				"This report has already been emailed the maximum number of times.",
			);

		const lastSentAt = (data.emailLastSentAt as TimestampLike | null) || null;
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

		const lockUntil = (data.emailSendLockUntil as TimestampLike | null) || null;
		if (lockUntil && lockUntil.toMillis() > Date.now()) {
			const waitSec = Math.ceil((lockUntil.toMillis() - Date.now()) / 1000);
			throw new ApiError(
				429,
				`This report email is already being processed. Please wait ${waitSec} seconds.`,
				{ "Retry-After": String(waitSec) },
			);
		}

		const lead = (data.lead as Record<string, unknown> | undefined) ?? {};
		const recipient = normalizeEmail(
			typeof lead.email === "string" ? lead.email : "",
		);
		if (!recipient)
			throw new ApiError(
				400,
				"No valid email address is on file for this report.",
			);

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

export const reportEmailRoute = new Elysia({ aot: false }).post(
	"/api/report/:id/email",
	async ({ params, set }) => {
		set.headers["Cache-Control"] = "no-store";
		const { id } = params;

		if (!isValidReportId(id)) {
			set.status = 400;
			return { error: "Invalid report ID format" };
		}

		if (!isGmailConfigured()) {
			set.status = 503;
			return { error: "Email delivery is not configured right now." };
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

			return { success: true, message: "Report emailed." };
		} catch (err) {
			if (lockReserved) {
				await ref
					.update({ emailSendLockUntil: FieldValue.delete() })
					.catch((unlockErr) => {
						console.error(
							"Report email lock release failed:",
							unlockErr instanceof Error ? unlockErr.message : unlockErr,
						);
					});
			}
			if (err instanceof ApiError) {
				set.status = err.status;
				if (err.headers) {
					for (const [k, v] of Object.entries(err.headers)) set.headers[k] = v;
				}
				return { error: err.message };
			}
			console.error(
				"Report email send failed:",
				err instanceof Error ? err.message : err,
			);
			set.status = 500;
			return { error: "Failed to send email" };
		}
	},
);
