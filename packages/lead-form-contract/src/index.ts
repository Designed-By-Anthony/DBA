/**
 * Single JSON contract for public leads → Agency OS `POST /api/lead`.
 *
 * Marketing (Astro):
 *   - `PUBLIC_CRM_LEAD_URL` — full URL, e.g. `https://viewer.designedbyanthony.com/api/lead`
 *   - `PUBLIC_API_URL` — Lighthouse audit API base only (LighthouseAudit, report viewer); not used for lead forms.
 *
 * Agency OS (web-viewer):
 *   - `TURNSTILE_SECRET_KEY` — optional; when set, `cfTurnstileResponse` is verified server-side.
 *   - `LEAD_WEBHOOK_CORS_ORIGINS` — comma-separated browser `Origin` values allowed for POST.
 *   - `LEAD_WEBHOOK_DEFAULT_AGENCY_ID` — tenant when `agencyId` is omitted.
 */

/** CRM product tier for org_settings.planSuite and UI gating (same pipeline; different modules). */
export type PlanSuite = "starter" | "full";

export type PublicLeadMarketingMeta = {
  ctaSource?: string;
  pageContext?: string;
  offerType?: string;
  leadSource?: string;
  pageUrl?: string;
  referrerUrl?: string;
  pageTitle?: string;
  sourcePage?: string;
  gaClientId?: string;
};

/** Canonical body for `POST /api/lead` (JSON). Aliases are normalized server-side. */
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
  /** Honeypot — must be empty */
  _hp?: string;
  /** Cloudflare Turnstile token (optional if CRM verifies client-side path) */
  cfTurnstileResponse?: string;
};

function trim(s: unknown): string {
  return s == null ? "" : String(s).trim();
}

/**
 * Build the JSON body for CRM from the marketing AuditForm fields (FormData-compatible keys).
 */
export function buildPublicLeadPayloadFromFormFields(fields: {
  first_name?: string;
  email?: string;
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
  _hp?: string;
  "cf-turnstile-response"?: string;
}): PublicLeadIngestBody {
  const name = trim(fields.first_name);
  const email = trim(fields.email);
  const website = trim(fields.website);
  const message = trim(fields.biggest_issue);
  const phone = trim(fields.phone);
  const turnstile = trim(fields["cf-turnstile-response"]);

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

  const source = sourceBits.length ? `marketing|${sourceBits.join("|")}` : "marketing_site";

  return {
    ...meta,
    name,
    email,
    website,
    message,
    phone: phone || undefined,
    company: trim(fields.source_page) || undefined,
    source,
    _hp: trim(fields._hp),
    cfTurnstileResponse: turnstile || undefined,
  };
}

/** Convenience: read named fields from a browser `FormData` (AuditForm). */
export function buildPublicLeadPayloadFromFormData(fd: FormData): PublicLeadIngestBody {
  const get = (name: string) => String(fd.get(name) ?? "");
  return buildPublicLeadPayloadFromFormFields({
    first_name: get("first_name"),
    email: get("email"),
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
    _hp: get("_hp"),
    "cf-turnstile-response": get("cf-turnstile-response"),
  });
}
