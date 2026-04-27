import { fetchWithTimeout } from "./http";

export interface FreshworksAuditLeadInput {
	name: string;
	email: string;
	company: string;
	location: string;
	scannedUrl: string;
	reportId: string;
	reportPublicUrl: string;
	trustScore: number;
	performanceScore: number;
	accessibilityScore: number;
	bestPracticesScore: number;
	seoScore: number;
	conversionScore: number;
	userAgent: string;
}

/**
 * Freshsales / Freshworks CRM: `POST .../api/leads`
 * Base URL examples:
 * - `https://yourbundle.freshsales.io`
 * - `https://yourbundle.myfreshworks.com/crm/sales`
 */
export function resolveFreshworksLeadsEndpoint(baseUrl: string): string {
	const trimmed = baseUrl.trim().replace(/\/$/, "");
	return `${trimmed}/api/leads`;
}

function splitFullName(fullName: string): {
	first_name: string;
	last_name: string;
} {
	const t = fullName.trim();
	if (!t) return { first_name: "Site", last_name: "visitor" };
	const space = t.indexOf(" ");
	if (space === -1) return { first_name: t.slice(0, 80), last_name: "—" };
	const first = t.slice(0, space).trim();
	const last = t.slice(space + 1).trim() || "—";
	return {
		first_name: first.slice(0, 80),
		last_name: last.slice(0, 120),
	};
}

function buildLeadDescription(input: FreshworksAuditLeadInput): string {
	const lines = [
		"Lighthouse Scanner v2 — automated audit",
		"",
		`Report: ${input.reportPublicUrl}`,
		`Report ID: ${input.reportId}`,
		`Scanned URL: ${input.scannedUrl}`,
		"",
		`Trust score: ${input.trustScore}`,
		`Performance: ${input.performanceScore} · A11y: ${input.accessibilityScore} · Best practices: ${input.bestPracticesScore} · SEO: ${input.seoScore} · Conversion (AI): ${input.conversionScore}`,
		"",
		`Location (form): ${input.location || "—"}`,
		`User-Agent: ${input.userAgent.slice(0, 400)}`,
	];
	return lines.join("\n");
}

/**
 * Creates a CRM lead after a successful audit. Runs in `after()` — failures are logged only.
 */
export async function createFreshworksLeadFromAudit(
	input: FreshworksAuditLeadInput,
): Promise<{ ok: true } | { ok: false; status?: number; error: string }> {
	const base = process.env.FRESHWORKS_CRM_BASE_URL?.trim();
	const apiKey = process.env.FRESHWORKS_CRM_API_KEY?.trim();
	if (!base || !apiKey) {
		return {
			ok: false,
			error: "FRESHWORKS_CRM_BASE_URL or FRESHWORKS_CRM_API_KEY unset",
		};
	}

	const url = resolveFreshworksLeadsEndpoint(base);
	const authMode = (
		process.env.FRESHWORKS_CRM_AUTH_MODE || "token"
	).toLowerCase();
	const authHeader =
		authMode === "bearer" ? `Bearer ${apiKey}` : `Token token=${apiKey}`;

	const { first_name, last_name } = splitFullName(input.name);

	const lead: Record<string, unknown> = {
		first_name,
		last_name,
		email: input.email.trim(),
		company: { name: input.company.trim().slice(0, 200) },
		description: buildLeadDescription(input).slice(0, 65_000),
	};

	const loc = input.location.trim();
	if (loc) {
		lead.city = loc.slice(0, 120);
	}

	// Optional Freshsales custom fields (create matching fields in CRM or leave env unset).
	const keysRaw = process.env.FRESHWORKS_CRM_CUSTOM_FIELD_KEYS?.trim();
	if (keysRaw) {
		const custom: Record<string, string> = {};
		for (const key of keysRaw
			.split(",")
			.map((k) => k.trim())
			.filter(Boolean)) {
			if (key === "cf_lighthouse_scanned_url") {
				custom[key] = input.scannedUrl.slice(0, 500);
			} else if (key === "cf_lighthouse_report_id") {
				custom[key] = input.reportId.slice(0, 120);
			} else if (key === "cf_lighthouse_trust_score") {
				custom[key] = String(input.trustScore);
			} else if (key === "cf_lighthouse_report_url") {
				custom[key] = input.reportPublicUrl.slice(0, 500);
			}
		}
		if (Object.keys(custom).length > 0) {
			lead.custom_field = custom;
		}
	}

	const body = { lead };

	try {
		const res = await fetchWithTimeout(
			url,
			{
				method: "POST",
				headers: {
					Authorization: authHeader,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(body),
			},
			12_000,
		);

		if (res.status === 201 || res.status === 200) {
			return { ok: true };
		}

		const errText = await res.text().catch(() => "");
		return {
			ok: false,
			status: res.status,
			error: errText.slice(0, 500) || `HTTP ${res.status}`,
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, error: msg };
	}
}
