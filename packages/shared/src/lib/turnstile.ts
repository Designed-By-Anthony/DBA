/**
 * Cloudflare Turnstile server-side token verification.
 * Use in API routes to validate the `cf-turnstile-response` token sent from
 * the browser before processing any protected request.
 *
 * Environment-aware key switching
 * ─────────────────────────────────────────────────────────────────────────────
 * Production is detected by `CF_PAGES_BRANCH === 'main'`.
 * Every other environment (preview deployments, localhost) uses Cloudflare's
 * official always-pass dummy keys so that non-production deployments are never
 * blocked by missing credentials.
 *
 * Dummy keys (from https://developers.cloudflare.com/turnstile/troubleshooting/testing/):
 *   Site key : 1x00000000000000000000AA
 *   Secret   : 1x0000000000000000000000000000000AA
 */

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare always-pass test site key — safe to expose publicly. */
export const TURNSTILE_DEV_SITE_KEY = "1x00000000000000000000AA";
/** Cloudflare always-pass test secret key — for server-side use only. */
export const TURNSTILE_DEV_SECRET_KEY =
	"1x0000000000000000000000000000000AA";

/**
 * Returns `true` only when the deployment is the production `main` branch.
 * Checks both `CF_PAGES_BRANCH` (Cloudflare Workers / API) and
 * `NEXT_PUBLIC_CF_PAGES_BRANCH` (Next.js client bundles, baked in via
 * `next.config.ts` env section).
 */
export function isProductionBranch(): boolean {
	return (
		process.env.CF_PAGES_BRANCH === "main" ||
		process.env.NEXT_PUBLIC_CF_PAGES_BRANCH === "main"
	);
}

/**
 * Returns the site key that should be rendered in the Turnstile widget.
 * Non-production environments always receive the dummy key so that
 * preview deployments remain fully functional without any dashboard config.
 *
 * @param configuredKey  The value of `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (or
 *                       `undefined` when the variable is not set).
 */
export function resolveEffectiveSiteKey(
	configuredKey: string | undefined,
): string | undefined {
	if (!isProductionBranch()) {
		// Force the dummy key in all non-production environments, regardless
		// of whether a real key was configured in the dashboard.
		return TURNSTILE_DEV_SITE_KEY;
	}
	return configuredKey || undefined;
}

/**
 * Returns the secret key that should be used for server-side verification.
 * Non-production environments always receive the dummy secret so verification
 * never blocks preview traffic even if a real key is present in env vars.
 *
 * @param configuredKey  The value of `TURNSTILE_SECRET_KEY` env var (or
 *                       `undefined` when the variable is not set).
 */
export function resolveEffectiveSecretKey(
	configuredKey: string | undefined,
): string | undefined {
	if (!isProductionBranch()) {
		return TURNSTILE_DEV_SECRET_KEY;
	}
	return configuredKey || undefined;
}

export interface TurnstileVerifyResult {
	success: boolean;
	errorCodes?: string[];
}

/**
 * Verifies a Turnstile challenge token server-side.
 *
 * @param token  The token received from the browser (cf_turnstile_response).
 * @param secret The effective secret key (use `resolveEffectiveSecretKey()`).
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
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params,
		});
		json = (await res.json()) as {
			success: boolean;
			"error-codes"?: string[];
		};
	} catch (err) {
		console.error("[turnstile] Verification request failed:", err);
		return { success: false, errorCodes: ["network-error"] };
	}

	return {
		success: json.success === true,
		errorCodes: json["error-codes"],
	};
}
