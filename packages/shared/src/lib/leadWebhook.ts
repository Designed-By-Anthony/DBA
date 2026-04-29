/**
 * Server-side lead ingest. Set `LEAD_WEBHOOK_URL` to your HTTP action
 * (e.g. `https://….convex.site/webhook/lead`). Optional `LEAD_WEBHOOK_SECRET`
 * is sent as `x-lead-secret` when set.
 */

const INGEST_TIMEOUT_MS = 15_000;

export function resolveLeadWebhookSecret(): string | undefined {
	return process.env.LEAD_WEBHOOK_SECRET?.trim() || undefined;
}

export async function postLeadIngest(
	url: string,
	body: unknown,
	options?: { secret?: string },
): Promise<Response> {
	const secret = options?.secret ?? resolveLeadWebhookSecret();
	const headers: Record<string, string> = {
		Accept: "application/json",
		"Content-Type": "application/json",
	};
	if (secret) {
		headers["x-lead-secret"] = secret;
	}
	return fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(INGEST_TIMEOUT_MS),
	});
}
