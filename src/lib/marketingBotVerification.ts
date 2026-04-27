import { verifyTurnstileToken } from "@lh/lib/turnstile";
import type { PublicLeadIngestBody } from "@/lib/lead-form-contract";
import {
	getRecaptchaExpectedAction,
	getRecaptchaSiteKeyForVerification,
	isRecaptchaEnterpriseVerificationEnabled,
	verifyRecaptchaEnterpriseAssessment,
} from "@/lib/recaptchaEnterprise";

export type MarketingBotVerifyResult =
	| { ok: true }
	| { ok: false; message: string };

/**
 * Verifies Cloudflare Turnstile **or** reCAPTCHA Enterprise for marketing
 * lead payloads. reCAPTCHA takes precedence when fully configured.
 */
export async function verifyMarketingLeadBotProtection(input: {
	lead: PublicLeadIngestBody;
	userAgent: string | null;
	userIpAddress: string | null;
}): Promise<MarketingBotVerifyResult> {
	const recaptchaToken = input.lead.recaptchaToken?.trim() || "";
	const turnstileToken = input.lead.cfTurnstileResponse?.trim() || "";

	if (isRecaptchaEnterpriseVerificationEnabled()) {
		if (!recaptchaToken) {
			return {
				ok: false,
				message: "Security verification is required.",
			};
		}
		let siteKey: string;
		try {
			siteKey = getRecaptchaSiteKeyForVerification();
		} catch {
			return {
				ok: false,
				message: "reCAPTCHA is misconfigured on the server.",
			};
		}
		const expectedAction = getRecaptchaExpectedAction();
		const res = await verifyRecaptchaEnterpriseAssessment({
			token: recaptchaToken,
			expectedAction,
			siteKey,
			userAgent: input.userAgent,
			userIpAddress: input.userIpAddress,
		});
		if (!res.success) {
			return {
				ok: false,
				message:
					res.message ||
					"Bot verification failed. Please refresh and try again.",
			};
		}
		return { ok: true };
	}

	const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
	if (turnstileSecret) {
		if (!turnstileToken) {
			return {
				ok: false,
				message: "Security verification is required.",
			};
		}
		const verifyRes = await verifyTurnstileToken(
			turnstileToken,
			input.userIpAddress ?? undefined,
		);
		if (!verifyRes.success) {
			return {
				ok: false,
				message: "Bot verification failed. Please refresh and try again.",
			};
		}
	}

	return { ok: true };
}
