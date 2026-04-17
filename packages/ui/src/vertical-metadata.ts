/**
 * Vertical-specific metadata schemas for `leads.metadata` (JSONB).
 *
 * The SQL schema stays lean (5 columns + JSON bag); each vertical's
 * specialty payload lives here and is strictly Zod-validated before
 * it's written to Postgres.
 *
 * Augusta vertical blueprints:
 *   - agency        → Lighthouse SEO engine (Moz backlinks, PageSpeed, audits)
 *   - service_pro   → Job dispatch + photo proof (geo, before/after, crew)
 *   - restaurant    → QR menu + order stream (table, dietary, heatmaps)
 *   - florist/retail→ Inventory + loyalty (SKUs, discount codes, CLV)
 */
import { z } from "zod";
import { VERTICAL_IDS, type VerticalId } from "./vertical-config";

const isoDate = z.string().datetime({ offset: true }).or(z.string().min(1));

export const agencyLeadMetadataSchema = z
  .object({
    mozDomainAuthority: z.number().min(0).max(100).optional(),
    backlinkCount: z.number().int().min(0).optional(),
    pagespeedScore: z.number().min(0).max(100).optional(),
    lighthouseReportUrl: z.string().url().optional(),
    lastAuditAt: isoDate.optional(),
    competitorDomains: z.array(z.string()).max(50).optional(),
    seoLeadScore: z.number().min(0).max(100).optional(),
  })
  .strict();

export const servicePtoJobStatusEnum = z.enum([
  "new",
  "dispatched",
  "on_site",
  "completed",
  "cancelled",
]);
export type ServiceProJobStatus = z.infer<typeof servicePtoJobStatusEnum>;

export const servicePtoLeadMetadataSchema = z
  .object({
    jobStatus: servicePtoJobStatusEnum.default("new"),
    crewId: z.string().optional(),
    dispatchedAt: isoDate.optional(),
    onSiteAt: isoDate.optional(),
    completedAt: isoDate.optional(),
    geo: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        accuracyM: z.number().min(0).optional(),
        capturedAt: isoDate.optional(),
      })
      .optional(),
    addressLine: z.string().max(200).optional(),
    smsDispatchSentAt: isoDate.optional(),
    smsDispatchTo: z.string().optional(),
    speedToLeadMs: z.number().int().min(0).optional(),
    beforePhotoUrl: z.string().url().optional(),
    afterPhotoUrl: z.string().url().optional(),
    proofPhotoUrls: z.array(z.string().url()).max(20).optional(),
  })
  .strict();

export const restaurantLeadMetadataSchema = z
  .object({
    tableNumber: z.string().max(20).optional(),
    partySize: z.number().int().min(1).max(50).optional(),
    dietaryTags: z.array(z.string().max(40)).max(20).optional(),
    orderItems: z
      .array(
        z.object({
          sku: z.string().max(80),
          name: z.string().max(120),
          qty: z.number().int().min(1).max(99),
          priceCents: z.number().int().min(0),
        }),
      )
      .max(100)
      .optional(),
    orderTotalCents: z.number().int().min(0).optional(),
    peakHour: z.number().int().min(0).max(23).optional(),
    placedAt: isoDate.optional(),
    readyAt: isoDate.optional(),
    source: z.enum(["qr_menu", "counter", "delivery", "phone"]).optional(),
  })
  .strict();

export const retailLeadMetadataSchema = z
  .object({
    skus: z.array(z.string().max(80)).max(50).optional(),
    discountCode: z.string().max(40).optional(),
    customerLifetimeValueCents: z.number().int().min(0).optional(),
    lastPurchaseAt: isoDate.optional(),
    storeLocation: z.string().max(120).optional(),
    loyaltyTier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
    stripeTerminalReaderId: z.string().max(120).optional(),
  })
  .strict();

/**
 * Discriminated helper. Select the matching schema from a tenant vertical id.
 */
export const VERTICAL_METADATA_SCHEMAS = {
  agency: agencyLeadMetadataSchema,
  service_pro: servicePtoLeadMetadataSchema,
  restaurant: restaurantLeadMetadataSchema,
  florist: retailLeadMetadataSchema,
} as const satisfies Record<VerticalId, z.ZodTypeAny>;

export type AgencyLeadMetadata = z.infer<typeof agencyLeadMetadataSchema>;
export type ServiceProLeadMetadata = z.infer<typeof servicePtoLeadMetadataSchema>;
export type RestaurantLeadMetadata = z.infer<typeof restaurantLeadMetadataSchema>;
export type RetailLeadMetadata = z.infer<typeof retailLeadMetadataSchema>;

export type VerticalLeadMetadataMap = {
  agency: AgencyLeadMetadata;
  service_pro: ServiceProLeadMetadata;
  restaurant: RestaurantLeadMetadata;
  florist: RetailLeadMetadata;
};

/**
 * Parse an arbitrary `leads.metadata` payload against the schema for the
 * given vertical. Unknown verticals fall back to `agency`. Invalid
 * payloads throw `ZodError` — callers decide whether to 400 or warn.
 */
export function parseVerticalLeadMetadata<V extends VerticalId>(
  vertical: V,
  raw: unknown,
): VerticalLeadMetadataMap[V];
export function parseVerticalLeadMetadata(
  vertical: VerticalId | string | null | undefined,
  raw: unknown,
): VerticalLeadMetadataMap[VerticalId];
export function parseVerticalLeadMetadata(
  vertical: VerticalId | string | null | undefined,
  raw: unknown,
) {
  const safeVertical = z.enum(VERTICAL_IDS).safeParse(vertical);
  const id: VerticalId = safeVertical.success ? safeVertical.data : "agency";
  const schema = VERTICAL_METADATA_SCHEMAS[id];
  return schema.parse(raw ?? {});
}

/** Non-throwing sibling for server code that prefers partial data over 500s. */
export function safeParseVerticalLeadMetadata(
  vertical: VerticalId | string | null | undefined,
  raw: unknown,
) {
  const safeVertical = z.enum(VERTICAL_IDS).safeParse(vertical);
  const id: VerticalId = safeVertical.success ? safeVertical.data : "agency";
  const schema = VERTICAL_METADATA_SCHEMAS[id];
  return schema.safeParse(raw ?? {});
}
