/**
 * @dba/ui — Chameleon vertical config.
 *
 * Framework-agnostic module-visibility rules per tenant vertical.
 * Drives which CRM modules (sidebar entries, dashboard widgets, Lighthouse
 * audit panels) are exposed for a given `tenant.vertical_type`.
 *
 * Consumers:
 *   - apps/web-viewer (Agency OS sidebar + dashboard)
 *   - apps/marketing  (Astro pricing pages, audience-specific copy)
 *
 * Tenant key: `tenants.vertical_type` in Postgres (`verticalTypeEnum`).
 */
import { z } from "zod";

/** Mirrors the Postgres `vertical_type` enum in `@dba/database`. */
export const VERTICAL_IDS = [
	"agency",
	"restaurant",
	"service_pro",
	"florist",
] as const;
export type VerticalId = (typeof VERTICAL_IDS)[number];

/** Canonical module identifiers used for sidebar / dashboard rendering. */
export const MODULE_IDS = [
	"dashboard",
	"prospects",
	"pipeline",
	"tickets",
	"email",
	"reports",
	"backlink_audit",
	"lighthouse_audit",
	"seo_keywords",
	"menu_management",
	"reservations",
	"reviews",
	"price_book",
	"automations",
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const verticalConfigSchema = z.object({
	id: z.enum(VERTICAL_IDS),
	displayName: z.string().min(1),
	/** Terminology for the primary CRM entity (e.g. "Lead", "Customer"). */
	terminology: z.object({
		prospect: z.string().min(1),
		prospects: z.string().min(1),
		pipeline: z.string().min(1),
	}),
	/** Modules explicitly enabled. Anything not listed is hidden. */
	enabledModules: z.array(z.enum(MODULE_IDS)).readonly(),
});

export type VerticalConfig = z.infer<typeof verticalConfigSchema>;

const CORE: readonly ModuleId[] = [
	"dashboard",
	"prospects",
	"pipeline",
	"tickets",
	"email",
	"reports",
	"automations",
] as const;

const VERTICAL_CONFIGS: Record<VerticalId, VerticalConfig> = {
	agency: verticalConfigSchema.parse({
		id: "agency",
		displayName: "Agency",
		terminology: {
			prospect: "Prospect",
			prospects: "Prospects",
			pipeline: "Pipeline",
		},
		enabledModules: [
			...CORE,
			"backlink_audit",
			"lighthouse_audit",
			"seo_keywords",
			"price_book",
		],
	}),
	restaurant: verticalConfigSchema.parse({
		id: "restaurant",
		displayName: "Restaurant",
		terminology: {
			prospect: "Customer",
			prospects: "Customers",
			pipeline: "Orders",
		},
		enabledModules: [...CORE, "menu_management", "reservations", "reviews"],
	}),
	service_pro: verticalConfigSchema.parse({
		id: "service_pro",
		displayName: "Service Pro",
		terminology: { prospect: "Lead", prospects: "Leads", pipeline: "Jobs" },
		enabledModules: [...CORE, "reviews", "price_book"],
	}),
	florist: verticalConfigSchema.parse({
		id: "florist",
		displayName: "Florist",
		terminology: {
			prospect: "Customer",
			prospects: "Customers",
			pipeline: "Orders",
		},
		enabledModules: [...CORE, "reviews"],
	}),
};

/**
 * Resolve the vertical config for a tenant vertical value.
 * Unknown / null inputs fall back to the `agency` suite.
 */
export function getVerticalConfig(
	verticalId: VerticalId | string | null | undefined,
): VerticalConfig {
	if (!verticalId) return VERTICAL_CONFIGS.agency;
	const parsed = z.enum(VERTICAL_IDS).safeParse(verticalId);
	if (!parsed.success) return VERTICAL_CONFIGS.agency;
	return VERTICAL_CONFIGS[parsed.data];
}

/** Bulk access for admin UIs (vertical picker / config preview). */
export function getAllVerticalConfigs(): readonly VerticalConfig[] {
	return Object.values(VERTICAL_CONFIGS);
}

/** Module visibility check. */
export function isModuleEnabled(
	verticalId: VerticalId | string | null | undefined,
	moduleId: ModuleId,
): boolean {
	return getVerticalConfig(verticalId).enabledModules.includes(moduleId);
}
