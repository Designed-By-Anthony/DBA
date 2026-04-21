/**
 * Centralized email transport for Agency OS.
 *
 * Routes ALL outbound email through one function so that:
 *   - Real sends go through Resend in production / development.
 *   - Test-fire sends are recorded in-memory during Playwright runs instead of
 *     hitting Resend, so engineers don't receive 40 emails per test run.
 *
 * Test mode is enabled when ANY of the following is true:
 *   - `EMAIL_TEST_MODE=true`
 *   - `NEXT_PUBLIC_IS_TEST=true`
 *   - Process is running under Playwright (`PLAYWRIGHT_TEST_BASE_URL` set)
 *   - `RESEND_API_KEY` is missing (failsafe — never silently "succeed" in prod)
 *
 * Call sites must NEVER instantiate `new Resend(...)` directly — use `sendMail`.
 */
import { Resend } from "resend";

export type SendMailParams = {
	from: string;
	to: string | string[];
	subject: string;
	html: string;
	replyTo?: string;
	reply_to?: string;
	scheduledAt?: string;
};

export type CapturedEmail = {
	id: string;
	firedAt: string;
	from: string;
	to: string[];
	subject: string;
	html: string;
	replyTo?: string;
	scheduledAt?: string;
};

type MailerGlobal = {
	outbox: CapturedEmail[];
	counter: number;
};

const globalKey = "__DBA_MAILER_OUTBOX__" as const;
const g = globalThis as unknown as Record<
	typeof globalKey,
	MailerGlobal | undefined
>;

function getOutboxStore(): MailerGlobal {
	if (!g[globalKey]) {
		g[globalKey] = { outbox: [], counter: 0 };
	}
	return g[globalKey]!;
}

export function isEmailTestMode(): boolean {
	if (process.env.EMAIL_TEST_MODE === "true") return true;
	if (process.env.NEXT_PUBLIC_IS_TEST === "true") return true;
	if (process.env.PLAYWRIGHT_TEST_BASE_URL) return true;
	if (!process.env.RESEND_API_KEY) return true;
	return false;
}

const resendClient = process.env.RESEND_API_KEY
	? new Resend(process.env.RESEND_API_KEY)
	: null;

export type SendMailResult =
	| { ok: true; mode: "test-fire"; id: string }
	| { ok: true; mode: "resend"; id: string | null }
	| { ok: false; error: string };

function validatePayload(p: SendMailParams): string | null {
	if (!p || typeof p !== "object") return "Email payload missing";
	if (!p.from || typeof p.from !== "string") return "`from` is required";
	if (!p.subject || typeof p.subject !== "string")
		return "`subject` is required";
	if (!p.html || typeof p.html !== "string") return "`html` is required";
	const tos = Array.isArray(p.to) ? p.to : [p.to];
	if (tos.length === 0) return "`to` is required";
	if (tos.some((t) => !t || typeof t !== "string"))
		return "`to` entries must be strings";
	return null;
}

/**
 * Centralized mail send. In test mode, records the email in-memory instead of
 * hitting the Resend API. Never throws — returns a discriminated result so
 * best-effort notification failures can decide whether to bubble up.
 */
export async function sendMail(
	params: SendMailParams,
): Promise<SendMailResult> {
	const err = validatePayload(params);
	if (err) return { ok: false, error: err };

	const toArr = Array.isArray(params.to) ? params.to : [params.to];

	if (isEmailTestMode()) {
		const store = getOutboxStore();
		store.counter += 1;
		const id = `test-fire-${store.counter}-${Date.now()}`;
		const captured: CapturedEmail = {
			id,
			firedAt: new Date().toISOString(),
			from: params.from,
			to: toArr,
			subject: params.subject,
			html: params.html,
			replyTo: params.replyTo ?? params.reply_to,
			scheduledAt: params.scheduledAt,
		};
		store.outbox.push(captured);
		return { ok: true, mode: "test-fire", id };
	}

	if (!resendClient) {
		return { ok: false, error: "Missing RESEND_API_KEY" };
	}

	try {
		const effectiveReplyTo = params.replyTo ?? params.reply_to;
		const resendArgs: Record<string, unknown> = {
			from: params.from,
			to: toArr,
			subject: params.subject,
			html: params.html,
		};
		if (effectiveReplyTo) resendArgs.replyTo = effectiveReplyTo;
		if (params.scheduledAt) resendArgs.scheduledAt = params.scheduledAt;

		const result = await resendClient.emails.send(
			resendArgs as unknown as Parameters<typeof resendClient.emails.send>[0],
		);
		const resendId =
			"data" in result &&
			result.data &&
			typeof result.data === "object" &&
			"id" in result.data
				? String((result.data as { id: string }).id)
				: null;
		return { ok: true, mode: "resend", id: resendId };
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, error: msg };
	}
}

export function getTestOutbox(): CapturedEmail[] {
	return [...getOutboxStore().outbox];
}

export function findTestEmails(filter: {
	to?: string;
	subjectContains?: string;
}): CapturedEmail[] {
	return getTestOutbox().filter((e) => {
		if (
			filter.to &&
			!e.to.some((t) => t.toLowerCase().includes(filter.to!.toLowerCase()))
		) {
			return false;
		}
		if (
			filter.subjectContains &&
			!e.subject.toLowerCase().includes(filter.subjectContains.toLowerCase())
		) {
			return false;
		}
		return true;
	});
}

export function clearTestOutbox(): void {
	const store = getOutboxStore();
	store.outbox = [];
	store.counter = 0;
}
