import { fetchWithTimeout } from "./http";
import {
	RECAPTCHA_ENTERPRISE_ACTION,
	RECAPTCHA_ENTERPRISE_SITE_KEY,
} from "./recaptchaEnterpriseConfig";

type RecaptchaConfigStatus = "disabled" | "ready" | "incomplete";

type RecaptchaAssessmentResponse = {
	tokenProperties?: {
		valid?: boolean;
		action?: string;
		invalidReason?: string;
		hostname?: string;
	};
	riskAnalysis?: {
		score?: number;
		reasons?: string[];
	};
	error?: {
		message?: string;
	};
};

export type RecaptchaVerificationResult = {
	success: boolean;
	skipped?: boolean;
	reason?: string;
	score?: number;
};

const DEFAULT_PROJECT_ID = "dba-website-prod";
const DEFAULT_MIN_SCORE = 0.5;

function getTrimmedEnv(key: string): string {
	return process.env[key]?.trim() || "";
}

function getApiKey(): string {
	return getTrimmedEnv("RECAPTCHA_ENTERPRISE_API_KEY");
}

function getProjectId(): string {
	return getTrimmedEnv("RECAPTCHA_ENTERPRISE_PROJECT_ID") || DEFAULT_PROJECT_ID;
}

function getSiteKey(): string {
	return (
		getTrimmedEnv("RECAPTCHA_ENTERPRISE_SITE_KEY") ||
		getTrimmedEnv("NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY") ||
		RECAPTCHA_ENTERPRISE_SITE_KEY
	);
}

function getExpectedAction(): string {
	return (
		getTrimmedEnv("RECAPTCHA_ENTERPRISE_EXPECTED_ACTION") ||
		RECAPTCHA_ENTERPRISE_ACTION
	);
}

function getMinScore(): number {
	const configured = Number.parseFloat(
		getTrimmedEnv("RECAPTCHA_ENTERPRISE_MIN_SCORE"),
	);
	return Number.isFinite(configured) ? configured : DEFAULT_MIN_SCORE;
}

export function getRecaptchaEnterpriseConfigStatus(): RecaptchaConfigStatus {
	const apiKey = getApiKey();
	const projectId = getProjectId();
	const siteKey = getSiteKey();

	if (!apiKey) return "disabled";

	return apiKey && projectId && siteKey ? "ready" : "incomplete";
}

export async function verifyRecaptchaEnterpriseToken(
	token: string,
	clientIp?: string,
): Promise<RecaptchaVerificationResult> {
	const status = getRecaptchaEnterpriseConfigStatus();
	if (status === "disabled") {
		return { success: true, skipped: true };
	}
	if (status === "incomplete") {
		return { success: false, reason: "misconfigured" };
	}
	if (!token.trim()) {
		return { success: false, reason: "missing-token" };
	}

	const expectedAction = getExpectedAction();
	const siteKey = getSiteKey();
	const projectId = getProjectId();
	const endpoint = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(getApiKey())}`;
	const event: Record<string, string> = {
		token,
		expectedAction,
		siteKey,
	};

	if (clientIp && clientIp !== "unknown") {
		event.userIpAddress = clientIp;
	}

	const response = await fetchWithTimeout(
		endpoint,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event }),
		},
		10_000,
	);

	if (!response.ok) {
		return { success: false, reason: "assessment-request-failed" };
	}

	const assessment = (await response.json()) as RecaptchaAssessmentResponse;
	const tokenProperties = assessment.tokenProperties;
	const score = assessment.riskAnalysis?.score;

	if (!tokenProperties?.valid) {
		return {
			success: false,
			reason: tokenProperties?.invalidReason || "invalid-token",
			score,
		};
	}

	if (tokenProperties.action !== expectedAction) {
		return { success: false, reason: "action-mismatch", score };
	}

	if (typeof score === "number" && score < getMinScore()) {
		return { success: false, reason: "low-score", score };
	}

	return { success: true, score };
}
