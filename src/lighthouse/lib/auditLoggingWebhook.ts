import { fetchWithTimeout } from "./http";

const WEBHOOK_TIMEOUT_MS = 10_000;
const MAX_TEXT_FIELD_CHARS = 8000;

function clampText(value: string, max: number): string {
	const t = value.trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max - 1)}…`;
}

export type AuditLoggingWebhookInput = {
	company: string;
	url: string;
	email: string;
	reportId: string;
	reportPublicBase: string;
	trustScore: number;
	performanceScore: number;
	seoScore: number;
	accessibilityScore: number;
	bestPracticesScore: number;
	/** When lab scores were omitted or estimated (e.g. PageSpeed timeout). */
	psiNote?: string | null;
	failedAuditCount: number;
	criticalIssue: string;
	executiveSummary: string;
	weaknesses: string[];
	prioritizedActions: Array<{
		priority: number;
		action: string;
		impact: string;
		effort: string;
	}>;
	copywritingAnalysis: string;
};

function buildBody(input: AuditLoggingWebhookInput): Record<string, unknown> {
	const reportUrl = `${input.reportPublicBase}/report/${input.reportId}`;
	const auditedAt = new Date().toISOString().slice(0, 10);

	const issueNotes: string[] = [];
	if (input.psiNote) {
		issueNotes.push(input.psiNote);
	}
	if (input.criticalIssue) {
		issueNotes.push(`Critical: ${input.criticalIssue}`);
	}
	if (input.failedAuditCount > 0) {
		issueNotes.push(`PageSpeed failed categories: ${input.failedAuditCount}`);
	}

	const findingsParts = [
		input.executiveSummary.trim(),
		issueNotes.length > 0 ? issueNotes.join("\n") : "",
		input.weaknesses.length > 0
			? `Weaknesses:\n${input.weaknesses.map((w) => `- ${w}`).join("\n")}`
			: "",
	].filter((p) => p.length > 0);

	const recLines = input.prioritizedActions.map(
		(a) =>
			`${a.priority}. ${a.action} (${a.impact} impact / ${a.effort} effort)`,
	);

	const recommendationsParts = [
		input.copywritingAnalysis.trim(),
		recLines.length > 0 ? `Prioritized actions:\n${recLines.join("\n")}` : "",
	].filter((p) => p.length > 0);

	const findingsRaw = findingsParts.join("\n\n");
	const recommendationsRaw = recommendationsParts.join("\n\n");

	const body: Record<string, unknown> = {
		businessName: input.company,
		websiteUrl: input.url,
		email: input.email,
		overallScore: input.trustScore,
		performanceScore: input.performanceScore,
		seoScore: input.seoScore,
		accessibilityScore: input.accessibilityScore,
		/** PSI run used mobile strategy; same numeric bucket as performance. */
		mobileScore: input.performanceScore,
		reportUrl,
		auditedAt,
	};

	if (findingsRaw.length > 0) {
		body.findings = clampText(findingsRaw, MAX_TEXT_FIELD_CHARS);
	}
	if (recommendationsRaw.length > 0) {
		body.recommendations = clampText(recommendationsRaw, MAX_TEXT_FIELD_CHARS);
	}

	/** Optional extra context (receiver may ignore unknown keys). */
	body.bestPracticesScore = input.bestPracticesScore;

	return body;
}

/**
 * POST audit summary to external logging (e.g. Convex). Fire-and-forget:
 * never throws; logs HTTP/network errors only.
 */
export async function fireAuditLoggingWebhook(
	input: AuditLoggingWebhookInput,
): Promise<void> {
	const endpoint = process.env.AUDIT_LOGGING_WEBHOOK_URL?.trim();
	if (!endpoint) return;

	const body = buildBody(input);

	try {
		const res = await fetchWithTimeout(
			endpoint,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(body),
			},
			WEBHOOK_TIMEOUT_MS,
		);
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			console.error(
				"[audit] Audit logging webhook HTTP",
				res.status,
				text.slice(0, 500),
			);
		}
	} catch (err) {
		console.error(
			"[audit] Audit logging webhook failed:",
			err instanceof Error ? err.message : err,
		);
	}
}
