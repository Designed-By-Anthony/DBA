import type { VerticalTypeId } from "@dba/database";
import type { VerticalId as UiVerticalId } from "@/lib/verticals";

/**
 * Maps Postgres `vertical_type` enum values to Agency OS UI template ids (`verticals.ts`).
 */
const DB_TO_UI: Record<VerticalTypeId, UiVerticalId> = {
  agency: "creative",
  restaurant: "food",
  service_pro: "contractor",
  retail: "retail",
};

export function tenantDbVerticalToUiTemplate(
  db: VerticalTypeId | string | null | undefined,
): UiVerticalId {
  if (!db) return "general";
  const k = db as VerticalTypeId;
  return DB_TO_UI[k] ?? "general";
}
