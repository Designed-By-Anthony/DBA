/**
 * Augusta chameleon router.
 *
 * Bridges the SQL tenant (`tenants.vertical_type`) to the shared
 * `@dba/ui` `VerticalConfig` + the local `verticals.ts` UI-template
 * config (sidebar items, pipeline stages, terminology).
 */
import { getTenantByOrgId } from "@/lib/tenant-db";
import { getVerticalConfig as getUiVerticalConfig, type VerticalConfig } from "@/lib/verticals";
import {
  getVerticalConfig as getSharedVerticalConfig,
  type VerticalConfig as SharedVerticalConfig,
  type VerticalId as SharedVerticalId,
} from "@dba/ui";

function toUiVertical(verticalType: string | undefined): "food" | "contractor" | "retail" | "fitness" | "general" {
  switch (verticalType) {
    case "restaurant":
      return "food";
    case "service_pro":
      return "contractor";
    case "florist":
      return "retail";
    case "wellness":
      return "fitness";
    default:
      return "general";
  }
}

/**
 * Resolve the vertical config + full module matrix from SQL tenants.vertical_type.
 *
 * `ui` — local Next sidebar/pipeline/terminology config.
 * `shared` — canonical `@dba/ui` module visibility matrix (Chameleon $250/mo demo).
 */
export async function getVerticalConfig(orgId: string | null | undefined): Promise<{
  ui: VerticalConfig;
  shared: SharedVerticalConfig;
  verticalType: SharedVerticalId | "agency";
}> {
  if (!orgId) {
    return {
      ui: getUiVerticalConfig("general"),
      shared: getSharedVerticalConfig("agency"),
      verticalType: "agency",
    };
  }
  let tenant = null;
  try {
    tenant = await getTenantByOrgId(orgId);
  } catch (err) {
    console.error("[getVerticalConfig] tenant lookup failed:", err);
  }
  const verticalType = (tenant?.verticalType as SharedVerticalId) || "agency";
  return {
    ui: getUiVerticalConfig(toUiVertical(tenant?.verticalType)),
    shared: getSharedVerticalConfig(verticalType),
    verticalType,
  };
}

export function getVerticalTemplateFromType(verticalType: string | undefined): string {
  return toUiVertical(verticalType);
}
