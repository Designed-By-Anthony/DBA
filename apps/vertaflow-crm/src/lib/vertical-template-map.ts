/**
 * Maps Agency OS UI vertical templates (`verticals.ts` / Clients picker) to
 * Postgres `tenants.vertical_type` enum values (`@dba/database`).
 */

import type { VerticalId as SqlVerticalType } from "@dba/database";
import type { VerticalId as UiVerticalId } from "@/lib/verticals";

const UI_TO_SQL: Record<UiVerticalId, SqlVerticalType> = {
	general: "agency",
	contractor: "service_pro",
	food: "restaurant",
	beauty: "service_pro",
	fitness: "wellness",
	realestate: "agency",
	creative: "agency",
	retail: "agency",
};

export function uiVerticalTemplateToSqlVerticalType(
	template: string | undefined,
): SqlVerticalType {
	if (!template) return "agency";
	if (template in UI_TO_SQL) return UI_TO_SQL[template as UiVerticalId];
	return "agency";
}

/** Best-effort inverse when `crm_config.templateId` is missing (legacy rows). */
export function sqlVerticalTypeToUiTemplateFallback(
	sql: string | null | undefined,
): UiVerticalId {
	switch (sql) {
		case "service_pro":
			return "contractor";
		case "restaurant":
			return "food";
		case "wellness":
			return "fitness";
		default:
			return "general";
	}
}

/** Prefer `crm_config.templateId` (UI picker), else derive from `vertical_type`. */
export function resolveUiVerticalTemplateFromTenant(tenant: {
	verticalType: string | null | undefined;
	crmConfig: Record<string, unknown> | null | undefined;
}): string {
	const crm = tenant.crmConfig ?? {};
	const id = crm.templateId;
	if (typeof id === "string" && id.trim()) return id;
	return sqlVerticalTypeToUiTemplateFallback(tenant.verticalType);
}
