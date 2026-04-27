/**
 * reCAPTCHA Enterprise — server-side assessment (CreateAssessment REST).
 * @see https://cloud.google.com/recaptcha-enterprise/docs/create-assessment-website
 */

const DEFAULT_EXPECTED_ACTION = "contact_submit";
const DEFAULT_MIN_SCORE = 0.5;

function readRecaptchaSiteKey(): string | undefined {
	return (
		process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
		process.env.RECAPTCHA_SITE_KEY?.trim() ||
		undefined
	);
}

function readGoogleCloudProjectId(): string | undefined {
	return (
		process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
		process.env.RECAPTCHA_GOOGLE_CLOUD_PROJECT?.trim() ||
		undefined
	);
}

/** True when marketing forms should require and verify an Enterprise token. */
export function isRecaptchaEnterpriseVerificationEnabled(): boolean {
	return Boolean(
		process.env.RECAPTCHA_ENTERPRISE_API_KEY?.trim() &&
			readGoogleCloudProjectId() &&
			readRecaptchaSiteKey(),
	);
}

export function getRecaptchaExpectedAction(): string {
	return (
		process.env.RECAPTCHA_EXPECTED_ACTION?.trim() ||
		process.env.NEXT_PUBLIC_RECAPTCHA_ACTION?.trim() ||
		DEFAULT_EXPECTED_ACTION
	);
}

export function getRecaptchaSiteKeyForVerification(): string {
	const k = readRecaptchaSiteKey();
	if (!k) {
		throw new Error("reCAPTCHA site key is not configured");
	}
	return k;
}

type AssessmentResponse = {
	tokenProperties?: {
		valid?: boolean;
		invalidReason?: string;
		action?: string;
		hostname?: string;
	};
	riskAnalysis?: {
		score?: number;
		reasons?: string[];
	};
	error?: {
		code?: number;
		message?: string;
		status?: string;
	};
};

/**
 * Calls `projects.assessments` with your API key. Expects the same
 * `expectedAction` and `siteKey` used in `grecaptcha.enterprise.execute`.
 */
export async function verifyRecaptchaEnterpriseAssessment(input: {
	token: string;
	expectedAction: string;
	siteKey: string;
	userAgent?: string | null;
	userIpAddress?: string | null;
}): Promise<{ success: true } | { success: false; message: string }> {
	const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY?.trim();
	const projectId = readGoogleCloudProjectId();
	if (!apiKey || !projectId) {
		return {
			success: false,
			message: "reCAPTCHA Enterprise is not configured on the server.",
		};
	}

	const url = new URL(
		`https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments`,
	);
	url.searchParams.set("key", apiKey);

	const event: Record<string, string> = {
		token: input.token,
		siteKey: input.siteKey,
		expectedAction: input.expectedAction,
	};
	const ua = input.userAgent?.trim();
	if (ua) event.userAgent = ua;
	const ip = input.userIpAddress?.trim();
	if (ip) event.userIpAddress = ip;

	let response: Response;
	try {
		response = await fetch(url.toString(), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event }),
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : "Network error";
		return { success: false, message: msg };
	}

	const raw = (await response.json().catch(() => ({}))) as AssessmentResponse;

	if (!response.ok) {
		const apiMsg =
			raw.error?.message ||
			`reCAPTCHA API returned HTTP ${String(response.status)}`;
		return { success: false, message: apiMsg };
	}

	const valid = raw.tokenProperties?.valid === true;
	if (!valid) {
		const reason = raw.tokenProperties?.invalidReason || "INVALID";
		return {
			success: false,
			message: `Invalid reCAPTCHA token (${reason}).`,
		};
	}

	const action = raw.tokenProperties?.action;
	if (input.expectedAction && action && action !== input.expectedAction) {
		return {
			success: false,
			message: "reCAPTCHA action mismatch.",
		};
	}

	const minRaw = process.env.RECAPTCHA_MIN_SCORE?.trim();
	let minScore = DEFAULT_MIN_SCORE;
	if (minRaw !== undefined && minRaw !== "") {
		const parsed = Number.parseFloat(minRaw);
		if (Number.isFinite(parsed)) minScore = parsed;
	}
	const score = raw.riskAnalysis?.score;
	if (typeof score === "number" && Number.isFinite(score) && score < minScore) {
		return {
			success: false,
			message: "reCAPTCHA score below threshold.",
		};
	}

	return { success: true };
}
