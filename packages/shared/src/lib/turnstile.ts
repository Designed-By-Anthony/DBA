/**
 * Cloudflare Turnstile server-side token verification.
 * Use in API routes to validate the `cf-turnstile-response` token sent from
 * the browser before processing any protected request.
 */

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
	success: boolean;
	errorCodes?: string[];
}

/**
 * Verifies a Turnstile challenge token server-side.
 *
 * @param token  The token received from the browser (cf_turnstile_response).
 * @param secret The `TURNSTILE_SECRET_KEY` env var value.
 * @returns      `{ success: true }` on valid token, `{ success: false, errorCodes }` otherwise.
 */
export async function verifyTurnstileToken(
	token: string,
	secret: string,
): Promise<TurnstileVerifyResult> {
	const params = new URLSearchParams();
	params.set("secret", secret);
	params.set("response", token);

	let json: { success: boolean; "error-codes"?: string[] };
	try {
		const res = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			body: params,
		});
		json = (await res.json()) as {
			success: boolean;
			"error-codes"?: string[];
		};
	} catch {
		return { success: false, errorCodes: ["network-error"] };
	}

	return {
		success: json.success === true,
		errorCodes: json["error-codes"],
	};
}
