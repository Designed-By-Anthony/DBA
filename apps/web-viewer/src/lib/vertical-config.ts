import { getTenantByOrgId } from "@/lib/tenant-db";
import { getVerticalConfig as getUiVerticalConfig, type VerticalConfig } from "@/lib/verticals";

function toUiVertical(verticalType: string | undefined): "food" | "contractor" | "retail" | "general" {
  switch (verticalType) {
    case "restaurant":
      return "food";
    case "service_pro":
      return "contractor";
    case "florist":
      return "retail";
    default:
      return "general";
  }
}

/**
 * Augusta chameleon router:
 * resolve UI vertical config from SQL tenants.vertical_type.
 */
export async function getVerticalConfig(orgId: string | null | undefined): Promise<VerticalConfig> {
  if (!orgId) return getUiVerticalConfig("general");
  const tenant = await getTenantByOrgId(orgId);
  return getUiVerticalConfig(toUiVertical(tenant?.verticalType));
}

export function getVerticalTemplateFromType(verticalType: string | undefined): string {
  return toUiVertical(verticalType);
}
