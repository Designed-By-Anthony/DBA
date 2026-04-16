import type { PublicLeadMarketingMeta } from "@dba/lead-form-contract";

/**
 * Shared contract for contact + Lighthouse audit leads.
 * Use with POST /api/lead (browser-safe, no secret) or POST /api/webhooks/lead (secret auth).
 */
export type LeadIntakeSource = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  /** e.g. contact_form | Lighthouse | audit_tool */
  source?: string;
  message?: string;
  auditUrl?: string;
  /** Clerk org id — optional; else server uses LEAD_WEBHOOK_DEFAULT_AGENCY_ID */
  agencyId?: string;
  /** Attribution from public marketing forms (stored on activity metadata). */
  marketing?: PublicLeadMarketingMeta;
};

export type LeadIntakeResult = {
  success: true;
  prospectId: string;
  isNew: boolean;
  agencyId: string;
  message: string;
};
