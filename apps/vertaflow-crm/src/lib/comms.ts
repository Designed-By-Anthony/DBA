/**
 * Augusta Communication Engine
 *
 * One module for every outbound notification — Resend (email) + Twilio (SMS).
 *
 * Why centralize:
 *   - Today Resend is `new Resend(...)` in 6+ files. Each call site does its
 *     own try/catch + tagging. Engineers forget to tag, IDs drift, logs get
 *     noisy. The Augusta blueprint wants ONE engine that the Automation
 *     Engine, ticket replies, lead webhooks, and cron jobs all call.
 *   - Twilio (SMS) is part of the Phase 1 chassis. It ships here as an HTTP
 *     transport (no SDK) so the build stays hermetic and so the Service Pro
 *     "speed-to-lead SMS" automation has a turnkey hook.
 *
 * Behavior:
 *   - When the underlying credential is missing the transport returns
 *     `{ ok: false, skipped: "no_credentials" }` instead of throwing — the
 *     caller (Automation Engine, lead intake) keeps running.
 *   - All sends accept a `tenantId` so logs / future SQL audit rows are
 *     tenant-scoped (Zero-Trust Multi-Tenancy guardrail).
 */
import { Resend } from "resend";
import { z } from "zod";
import { complianceConfig } from "@/lib/theme.config";

// ────────────────────────────────────────────────────────────────────────────
// Types + Zod
// ────────────────────────────────────────────────────────────────────────────

const e164 = z
	.string()
	.regex(/^\+[1-9]\d{6,14}$/, "Phone must be E.164 (+15555550100)");

export const sendEmailInputSchema = z
	.object({
		tenantId: z.string().min(1, "tenantId is required"),
		to: z.string().email().or(z.array(z.string().email()).min(1)),
		subject: z.string().min(1).max(998),
		html: z.string().min(1),
		text: z.string().optional(),
		from: z.string().optional(),
		replyTo: z.string().email().optional(),
		/** Free-form tags that show up in Resend + future SQL comm-log table. */
		tags: z.record(z.string(), z.string()).optional(),
	})
	.strict();

export type SendEmailInput = z.infer<typeof sendEmailInputSchema>;

export const sendSmsInputSchema = z
	.object({
		tenantId: z.string().min(1, "tenantId is required"),
		to: e164,
		body: z.string().min(1).max(1600),
		from: e164.optional(),
	})
	.strict();

export type SendSmsInput = z.infer<typeof sendSmsInputSchema>;

export type CommResult =
	| { ok: true; channel: "email" | "sms"; id: string; tenantId: string }
	| {
			ok: false;
			channel: "email" | "sms";
			tenantId: string;
			skipped?: "no_credentials" | "disabled";
			error?: string;
	  };

// ────────────────────────────────────────────────────────────────────────────
// Lazy transports (singletons)
// ────────────────────────────────────────────────────────────────────────────

let _resend: Resend | null = null;
function resendClient(): Resend | null {
	if (_resend) return _resend;
	const key = process.env.RESEND_API_KEY?.trim();
	if (!key) return null;
	_resend = new Resend(key);
	return _resend;
}

function twilioCreds() {
	const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
	const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
	const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
	if (!accountSid || !authToken || !fromNumber) return null;
	return { accountSid, authToken, fromNumber };
}

// ────────────────────────────────────────────────────────────────────────────
// Email
// ────────────────────────────────────────────────────────────────────────────

export async function sendEmail(rawInput: SendEmailInput): Promise<CommResult> {
	const input = sendEmailInputSchema.parse(rawInput);
	const tenantId = input.tenantId;

	if (process.env.COMMS_EMAIL_DISABLED === "true") {
		return { ok: false, channel: "email", tenantId, skipped: "disabled" };
	}

	const client = resendClient();
	if (!client) {
		return { ok: false, channel: "email", tenantId, skipped: "no_credentials" };
	}

	const from =
		input.from ||
		`${complianceConfig.fromName} <${complianceConfig.fromEmail}>`;
	const replyTo = input.replyTo || complianceConfig.replyTo;

	try {
		const { data, error } = await client.emails.send({
			from,
			to: input.to,
			subject: input.subject,
			html: input.html,
			text: input.text,
			replyTo,
			tags: tagsToResend({ tenantId, ...input.tags }),
		});

		if (error) {
			console.error("[comms] Resend rejected", { tenantId, error });
			return { ok: false, channel: "email", tenantId, error: error.message };
		}
		return { ok: true, channel: "email", id: data?.id ?? "", tenantId };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "send_failed";
		console.error("[comms] Resend send failed", { tenantId, error: msg });
		return { ok: false, channel: "email", tenantId, error: msg };
	}
}

function tagsToResend(tags: Record<string, string | undefined>) {
	return Object.entries(tags)
		.filter(([, v]) => typeof v === "string" && v.length > 0)
		.map(([name, value]) => ({ name, value: String(value) }));
}

// ────────────────────────────────────────────────────────────────────────────
// SMS — Twilio HTTP REST (no SDK; keeps the bundle hermetic)
// ────────────────────────────────────────────────────────────────────────────

export async function sendSms(rawInput: SendSmsInput): Promise<CommResult> {
	const input = sendSmsInputSchema.parse(rawInput);
	const tenantId = input.tenantId;

	if (process.env.COMMS_SMS_DISABLED === "true") {
		return { ok: false, channel: "sms", tenantId, skipped: "disabled" };
	}

	const creds = twilioCreds();
	if (!creds) {
		return { ok: false, channel: "sms", tenantId, skipped: "no_credentials" };
	}

	const from = input.from || creds.fromNumber;
	const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(creds.accountSid)}/Messages.json`;
	const body = new URLSearchParams({
		To: input.to,
		From: from,
		Body: input.body,
	});
	const auth = Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString(
		"base64",
	);

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: body.toString(),
		});
		const json = (await res.json().catch(() => ({}))) as {
			sid?: string;
			message?: string;
			code?: number;
		};
		if (!res.ok) {
			const error = json.message || `twilio_http_${res.status}`;
			console.error("[comms] Twilio rejected", {
				tenantId,
				status: res.status,
				error,
			});
			return { ok: false, channel: "sms", tenantId, error };
		}
		return { ok: true, channel: "sms", id: json.sid ?? "", tenantId };
	} catch (err) {
		const msg = err instanceof Error ? err.message : "send_failed";
		console.error("[comms] Twilio send failed", { tenantId, error: msg });
		return { ok: false, channel: "sms", tenantId, error: msg };
	}
}

// ────────────────────────────────────────────────────────────────────────────
// Multi-channel convenience
// ────────────────────────────────────────────────────────────────────────────

export type NotifyInput = {
	tenantId: string;
	email?: Omit<SendEmailInput, "tenantId">;
	sms?: Omit<SendSmsInput, "tenantId">;
};

/**
 * Fire email + SMS in parallel. Results are returned per-channel so callers
 * can log partial successes without short-circuiting.
 */
export async function notify(input: NotifyInput): Promise<{
	email?: CommResult;
	sms?: CommResult;
}> {
	const out: { email?: CommResult; sms?: CommResult } = {};
	const tasks: Promise<void>[] = [];
	if (input.email) {
		tasks.push(
			sendEmail({ ...input.email, tenantId: input.tenantId }).then((r) => {
				out.email = r;
			}),
		);
	}
	if (input.sms) {
		tasks.push(
			sendSms({ ...input.sms, tenantId: input.tenantId }).then((r) => {
				out.sms = r;
			}),
		);
	}
	await Promise.all(tasks);
	return out;
}
