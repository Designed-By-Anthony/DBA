/**
 * Single JSON contract for public leads → server `POST /api/lead-email`, which
 * forwards to `LEAD_WEBHOOK_URL` (e.g. Convex HTTP action → Slack).
 *
 * Marketing site:
 *   - `NEXT_PUBLIC_LEAD_WEBHOOK_URL` — optional browser default for `[data-audit-form]`
 *   - `PUBLIC_API_URL` — Lighthouse audit API base only; not used for lead forms.
 *
 * Server:
 *   - reCAPTCHA Enterprise: `RECAPTCHA_ENTERPRISE_API_KEY` + GCP project + site key — when set, `recaptchaToken` is verified.
 */
import { z } from "zod";

/** CRM product tier for org_settings.planSuite and UI gating (same pipeline; different modules). */
export type PlanSuite = "starter" | "full";
export const planSuiteSchema = z.enum(["starter", "full"]);

/**
 * Global core fields the Augusta leads table requires. These mirror the
 * fixed (non-JSONB) columns on `leads` and let any vertical feed the same
 * ingest endpoint.
 */
const globalLeadCoreObjectSchema = z.object({
	firstName: z.string().trim().min(1).max(120).optional(),
	lastName: z.string().trim().min(1).max(120).optional(),
	/** Optional; server will synthesize from first+last if omitted. */
	name: z.string().trim().min(1).max(240).optional(),
	email: z.string().email("Invalid email"),
	phone: z.string().trim().min(3).max(40).optional(),
	source: z.string().trim().min(1).max(80).optional(),
});

export const globalLeadCoreSchema = globalLeadCoreObjectSchema.refine(
	(v) => Boolean(v.name || v.firstName || v.lastName),
	{
		message: "name, firstName, or lastName is required",
		path: ["name"],
	},
);

/**
 * Body for `POST /api/leads/ingest` — the Global Ingest Engine.
 *
 * - Global core fields live at the top level (same shape for every vertical).
 * - Vertical-specific fields go under `metadata` (JSONB column on `leads`).
 * - `tenantId` (Clerk org id) identifies the owner and is usually supplied via
 *   the `x-agency-id` / `x-tenant-id` header; the body field is a fallback.
 * - `secret` is the shared `LEAD_WEBHOOK_SECRET` (also accepted via
 *   `x-webhook-secret` / `x-lead-secret` headers).
 */
export const globalLeadIngestBodySchema = globalLeadCoreObjectSchema
	.extend({
		tenantId: z.string().trim().min(1).max(120).optional(),
		/** Shared secret (body fallback; headers preferred). */
		secret: z.string().optional(),
		/** Everything else lands in `leads.metadata` JSONB. */
		metadata: z.record(z.string(), z.unknown()).default({}),
	})
	.passthrough()
	.refine((v) => Boolean(v.name || v.firstName || v.lastName), {
		message: "name, firstName, or lastName is required",
		path: ["name"],
	});

export type GlobalLeadIngestBody = z.infer<typeof globalLeadIngestBodySchema>;

const GLOBAL_CORE_KEYS = new Set([
	"firstName",
	"lastName",
	"name",
	"email",
	"phone",
	"source",
	"tenantId",
	"agencyId",
	"secret",
	"metadata",
]);

/**
 * Parse + normalize a Global Lead Ingest payload.
 *
 * - Validates the global core with Zod.
 * - Merges unknown top-level fields into `metadata` so callers can post a
 *   flat form (e.g. `{ email, party_size: 4 }`) and still end up with the
 *   canonical `{ email, metadata: { party_size: 4 } }` shape.
 * - Derives `name` from `firstName + lastName` when only the split fields
 *   are supplied.
 */
export function parseGlobalLeadIngestBody(input: unknown): {
	core: {
		firstName?: string;
		lastName?: string;
		name: string;
		email: string;
		phone?: string;
		source?: string;
	};
	metadata: Record<string, unknown>;
	tenantId?: string;
	secret?: string;
} {
	const raw = globalLeadIngestBodySchema.parse(input) as Record<
		string,
		unknown
	>;

	const firstName =
		typeof raw.firstName === "string" ? raw.firstName.trim() : undefined;
	const lastName =
		typeof raw.lastName === "string" ? raw.lastName.trim() : undefined;
	const explicitName =
		typeof raw.name === "string" ? raw.name.trim() : undefined;
	const name =
		explicitName ||
		[firstName, lastName].filter(Boolean).join(" ").trim() ||
		undefined;
	if (!name) {
		throw new z.ZodError([
			{
				code: z.ZodIssueCode.custom,
				path: ["name"],
				message: "name, firstName, or lastName is required",
			},
		]);
	}

	const email = String(raw.email);
	const phone = typeof raw.phone === "string" ? raw.phone.trim() : undefined;
	const source = typeof raw.source === "string" ? raw.source.trim() : undefined;
	const tenantId =
		typeof raw.tenantId === "string"
			? raw.tenantId.trim()
			: typeof raw.agencyId === "string"
				? (raw.agencyId as string).trim()
				: undefined;
	const secret = typeof raw.secret === "string" ? raw.secret : undefined;

	// Seed metadata with whatever was already under `metadata`, then fold in
	// any unknown top-level fields (so `{ email, party_size: 4 }` works).
	const metadata: Record<string, unknown> = {
		...((raw.metadata as Record<string, unknown>) ?? {}),
	};
	for (const [k, v] of Object.entries(raw)) {
		if (GLOBAL_CORE_KEYS.has(k)) continue;
		if (v == null) continue;
		metadata[k] = v;
	}

	return {
		core: {
			firstName: firstName || undefined,
			lastName: lastName || undefined,
			name,
			email,
			phone: phone || undefined,
			source: source || undefined,
		},
		metadata,
		tenantId: tenantId || undefined,
		secret,
	};
}

/**
 * Constant-time string compare. Use this to verify the shared secret on
 * the Global Ingest route so we don't leak credential shape via timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
	if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
		return false;
	let out = 0;
	for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return out === 0;
}

export const publicLeadMarketingMetaSchema = z
	.object({
		ctaSource: z.string().trim().optional(),
		pageContext: z.string().trim().optional(),
		offerType: z.string().trim().optional(),
		leadSource: z.string().trim().optional(),
		pageUrl: z.string().trim().optional(),
		referrerUrl: z.string().trim().optional(),
		pageTitle: z.string().trim().optional(),
		sourcePage: z.string().trim().optional(),
		gaClientId: z.string().trim().optional(),
	})
	.strict();

export type PublicLeadMarketingMeta = z.infer<
	typeof publicLeadMarketingMetaSchema
>;

const aliasString = z.string().optional();

/**
 * Canonical body for `POST /api/lead` (JSON).
 *
 * The schema is permissive about aliasing: it accepts canonical camelCase keys
 * plus the snake_case keys emitted by the marketing AuditForm (e.g. `first_name`,
 * `cta_source`, `g-recaptcha-response`). Use `parsePublicLeadIngestBody` to
 * resolve to a normalized `PublicLeadIngestBody`.
 */
export const publicLeadIngestBodySchema = z
	.object({
		name: aliasString,
		first_name: aliasString,
		firstName: aliasString,
		full_name: aliasString,
		email: z.string().email("Invalid email"),
		phone: aliasString,
		company: aliasString,
		website: aliasString,
		websiteUrl: aliasString,
		source: aliasString,
		message: aliasString,
		biggest_issue: aliasString,
		projectRequirements: aliasString,
		auditUrl: aliasString,
		auditReportUrl: aliasString,
		agencyId: aliasString,
		recaptchaToken: aliasString,
		"g-recaptcha-response": aliasString,
		gRecaptchaResponse: aliasString,

		ctaSource: aliasString,
		cta_source: aliasString,
		pageContext: aliasString,
		page_context: aliasString,
		offerType: aliasString,
		offer_type: aliasString,
		leadSource: aliasString,
		lead_source: aliasString,
		pageUrl: aliasString,
		page_url: aliasString,
		referrerUrl: aliasString,
		referrer_url: aliasString,
		pageTitle: aliasString,
		page_title: aliasString,
		sourcePage: aliasString,
		source_page: aliasString,
		gaClientId: aliasString,
		ga_client_id: aliasString,
	})
	.passthrough();

/** Canonical body for `POST /api/lead-email` (JSON). Aliases are normalized server-side. */
export type PublicLeadIngestBody = PublicLeadMarketingMeta & {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	website?: string;
	source?: string;
	message?: string;
	auditUrl?: string;
	agencyId?: string;
	/** reCAPTCHA Enterprise token from `grecaptcha.enterprise.execute` */
	recaptchaToken?: string;
};

function firstNonEmpty(
	obj: Record<string, unknown>,
	keys: string[],
): string | undefined {
	for (const k of keys) {
		const v = obj[k];
		if (v == null) continue;
		const s = String(v).trim();
		if (s !== "") return s;
	}
	return undefined;
}

/**
 * Zod-validated parse + normalize.
 * Throws `ZodError` on invalid input (caller should return HTTP 400).
 * Returns a canonical `PublicLeadIngestBody` with camelCase keys only.
 */
export function parsePublicLeadIngestBody(
	input: unknown,
): PublicLeadIngestBody {
	const raw = publicLeadIngestBodySchema.parse(input) as Record<
		string,
		unknown
	>;

	const name = firstNonEmpty(raw, [
		"name",
		"first_name",
		"firstName",
		"full_name",
	]);
	const email = firstNonEmpty(raw, ["email"]);
	if (!name) {
		throw new z.ZodError([
			{
				code: z.ZodIssueCode.custom,
				path: ["name"],
				message: "Name is required",
			},
		]);
	}
	if (!email) {
		throw new z.ZodError([
			{
				code: z.ZodIssueCode.custom,
				path: ["email"],
				message: "Email is required",
			},
		]);
	}

	const meta = publicLeadMarketingMetaSchema.parse({
		ctaSource: firstNonEmpty(raw, ["ctaSource", "cta_source"]),
		pageContext: firstNonEmpty(raw, ["pageContext", "page_context"]),
		offerType: firstNonEmpty(raw, ["offerType", "offer_type"]),
		leadSource: firstNonEmpty(raw, ["leadSource", "lead_source"]),
		pageUrl: firstNonEmpty(raw, ["pageUrl", "page_url"]),
		referrerUrl: firstNonEmpty(raw, ["referrerUrl", "referrer_url"]),
		pageTitle: firstNonEmpty(raw, ["pageTitle", "page_title"]),
		sourcePage: firstNonEmpty(raw, ["sourcePage", "source_page"]),
		gaClientId: firstNonEmpty(raw, ["gaClientId", "ga_client_id"]),
	});

	return {
		...meta,
		name,
		email,
		phone: firstNonEmpty(raw, ["phone"]),
		company: firstNonEmpty(raw, ["company"]),
		website: firstNonEmpty(raw, ["website", "websiteUrl"]),
		source: firstNonEmpty(raw, ["source"]),
		message: firstNonEmpty(raw, [
			"message",
			"biggest_issue",
			"projectRequirements",
		]),
		auditUrl: firstNonEmpty(raw, ["auditUrl", "auditReportUrl"]),
		agencyId: firstNonEmpty(raw, ["agencyId"]),
		recaptchaToken: firstNonEmpty(raw, [
			"recaptchaToken",
			"g-recaptcha-response",
			"gRecaptchaResponse",
		]),
	};
}

function trim(s: unknown): string {
	return s == null ? "" : String(s).trim();
}

/**
 * Build the JSON body for CRM from the marketing AuditForm fields (FormData-compatible keys).
 */
export function buildPublicLeadPayloadFromFormFields(fields: {
	first_name?: string;
	email?: string;
	company?: string;
	website?: string;
	biggest_issue?: string;
	phone?: string;
	cta_source?: string;
	page_context?: string;
	offer_type?: string;
	lead_source?: string;
	page_url?: string;
	referrer_url?: string;
	page_title?: string;
	source_page?: string;
	ga_client_id?: string;
	"g-recaptcha-response"?: string;
}): PublicLeadIngestBody {
	const name = trim(fields.first_name);
	const email = trim(fields.email);
	const website = trim(fields.website);
	const message = trim(fields.biggest_issue);
	const phone = trim(fields.phone);
	const company = trim(fields.company);
	const recaptcha = trim(fields["g-recaptcha-response"]);

	const meta: PublicLeadMarketingMeta = {
		ctaSource: trim(fields.cta_source) || undefined,
		pageContext: trim(fields.page_context) || undefined,
		offerType: trim(fields.offer_type) || undefined,
		leadSource: trim(fields.lead_source) || undefined,
		pageUrl: trim(fields.page_url) || undefined,
		referrerUrl: trim(fields.referrer_url) || undefined,
		pageTitle: trim(fields.page_title) || undefined,
		sourcePage: trim(fields.source_page) || undefined,
		gaClientId: trim(fields.ga_client_id) || undefined,
	};

	const sourceBits = [
		meta.leadSource && `lead:${meta.leadSource}`,
		meta.ctaSource && `cta:${meta.ctaSource}`,
		meta.pageContext && `ctx:${meta.pageContext}`,
		meta.offerType && `offer:${meta.offerType}`,
	].filter(Boolean);

	const source = sourceBits.length
		? `marketing|${sourceBits.join("|")}`
		: "marketing_site";

	return {
		...meta,
		name,
		email,
		website,
		message,
		phone: phone || undefined,
		company: company || undefined,
		source,
		recaptchaToken: recaptcha || undefined,
	};
}

/** Convenience: read named fields from a browser `FormData` (AuditForm). */
export function buildPublicLeadPayloadFromFormData(
	fd: FormData,
): PublicLeadIngestBody {
	const get = (name: string) => String(fd.get(name) ?? "");
	return buildPublicLeadPayloadFromFormFields({
		first_name: get("first_name"),
		email: get("email"),
		company: get("company"),
		website: get("website"),
		biggest_issue: get("biggest_issue"),
		phone: get("phone"),
		cta_source: get("cta_source"),
		page_context: get("page_context"),
		offer_type: get("offer_type"),
		lead_source: get("lead_source"),
		page_url: get("page_url"),
		referrer_url: get("referrer_url"),
		page_title: get("page_title"),
		source_page: get("source_page"),
		ga_client_id: get("ga_client_id"),
		"g-recaptcha-response": get("g-recaptcha-response"),
	});
}
