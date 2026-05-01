import { buildAuditSummaryEmail } from "@dba/shared/lighthouse/lib/auditSummaryEmail";
import { checkLocalRateLimit, getClientAddress } from "@dba/shared/lighthouse/lib/http";
import {
	isResendConfigured,
	sendTransactionalEmail,
} from "@dba/shared/lighthouse/lib/transactionalResend";
import { normalizeEmail, normalizeText } from "@dba/shared/lighthouse/lib/validation";
import { Elysia } from "elysia";
import { z } from "zod";

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

export const auditEmailSummaryRoute = new Elysia({ aot: false }).post(
	"/api/audit/email-summary",
	async ({ request, set }) => {
		set.headers["Cache-Control"] = "no-store";

		try {
			const retryAfter = checkLocalRateLimit(
				`audit-email-summary:${getClientAddress(request)}`,
				RATE_LIMIT,
				RATE_WINDOW_MS,
			);
			if (retryAfter) {
				set.status = 429;
				set.headers["Retry-After"] = String(retryAfter);
				return { error: "Too many email requests. Please try again later." };
			}

			let raw: unknown;
			try {
				raw = await request.json();
			} catch {
				set.status = 400;
				return { error: "Invalid JSON body." };
			}

			const parsed = bodySchema.safeParse(raw);
			if (!parsed.success) {
				set.status = 400;
				return { error: "Invalid request." };
			}

			const body = parsed.data;
			const email = normalizeEmail(body.email);
			if (!email) {
				set.status = 400;
				return { error: "Invalid email." };
			}

			if (!isResendConfigured()) {
				set.status = 503;
				return { error: "Email delivery is not configured." };
			}

			const reportPublicBase = (
				process.env.REPORT_PUBLIC_BASE_URL || "https://designedbyanthony.com"
			).replace(/\/$/, "");

			const firstName =
				normalizeText(body.name ?? "", 120).split(/\s+/)[0] ?? "";
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

			await sendTransactionalEmail({ to: email, subject, html, text });

			return { ok: true };
		} catch (err) {
			console.error(
				"audit email-summary:",
				err instanceof Error ? err.message : err,
			);
			set.status = 502;
			return { error: "Could not send email right now. Try again shortly." };
		}
	},
);
