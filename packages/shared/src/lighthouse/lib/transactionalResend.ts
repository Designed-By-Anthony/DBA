const RESEND_API = "https://api.resend.com/emails";

/** Default outbound for audit / transactional mail (verify domain in Resend). */
export const DEFAULT_TRANSACTIONAL_FROM = "outreach@designedbyanthony.com";

export function getTransactionalFromEmail(): string {
	const configured = process.env.RESEND_FROM_EMAIL?.trim();
	if (configured) return configured;
	return DEFAULT_TRANSACTIONAL_FROM;
}

export function isResendConfigured(): boolean {
	return Boolean(process.env.RESEND_API_KEY?.trim());
}

export type SendTransactionalEmailInput = {
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
};

const DEFAULT_REPLY_TO = "hello@designedbyanthony.com";

/**
 * Sends one email via Resend. Caller must handle errors (this throws on failure).
 * Automatically adds Reply-To, List-Unsubscribe, and a plain-text fallback.
 */
export async function sendTransactionalEmail(
	input: SendTransactionalEmailInput,
): Promise<void> {
	const key = process.env.RESEND_API_KEY?.trim();
	if (!key) {
		throw new Error("RESEND_API_KEY is not configured.");
	}

	const to = Array.isArray(input.to) ? input.to : [input.to];
	const from = getTransactionalFromEmail();
	const replyTo = input.replyTo || DEFAULT_REPLY_TO;

	const body: Record<string, unknown> = {
		from,
		to,
		subject: input.subject,
		html: input.html,
		reply_to: replyTo,
		headers: {
			"List-Unsubscribe": `<mailto:${DEFAULT_REPLY_TO}?subject=Unsubscribe>`,
			"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		},
	};
	if (input.text) {
		body.text = input.text;
	} else {
		body.text = input.html
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.replace(/&amp;/g, "&")
			.trim();
	}

	const res = await fetch(RESEND_API, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errBody = (await res.json().catch(() => ({}))) as {
			message?: string;
		};
		throw new Error(errBody.message || `Resend API error (${res.status})`);
	}
}
