import type { TenantEngineConfig, VerticalTypeId } from "@dba/database";

const VERTICAL_VALUES = [
  "agency",
  "restaurant",
  "service_pro",
  "retail",
] as const satisfies readonly VerticalTypeId[];

function isVerticalType(v: string): v is VerticalTypeId {
  return (VERTICAL_VALUES as readonly string[]).includes(v);
}

/** Map legacy Clerk / marketing strings into `vertical_type` enum values. */
function normalizeVerticalString(raw: string): VerticalTypeId {
  const v = raw.toLowerCase().trim();
  if (isVerticalType(v)) return v;
  if (v === "roofer" || v === "contractor" || v === "trades") return "service_pro";
  if (v === "florist" || v === "flower") return "retail";
  if (v === "food" || v === "kitchen") return "restaurant";
  return "agency";
}

/** Reads `public_metadata.vertical` from Clerk organization payloads into Postgres `vertical_type`. */
export function parseVerticalFromPublicMetadata(meta: unknown): VerticalTypeId {
  if (!meta || typeof meta !== "object") return "agency";
  const raw = (meta as Record<string, unknown>).vertical;
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return "agency";
  return normalizeVerticalString(s);
}

/** Optional `public_metadata.slug` for tenant URL segment; otherwise derived in webhook. */
export function parseSlugFromPublicMetadata(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>).slug;
  if (typeof raw === "string" && raw.trim()) return raw.trim().toLowerCase();
  return null;
}

/**
 * Builds engine `config` JSON from Clerk `public_metadata` (and legacy `crm_config` keys).
 * Matches `TenantEngineConfig` in `packages/database/schema.ts`.
 */
export function parseEngineConfigFromPublicMetadata(meta: unknown): TenantEngineConfig {
  const base: TenantEngineConfig = {
    primaryColor: "#2563eb",
    showKitchenDisplay: false,
    customEstimator: false,
  };
  if (!meta || typeof meta !== "object") return base;
  const m = meta as Record<string, unknown>;
  const crm = m.crm_config;
  const nested =
    crm && typeof crm === "object" && !Array.isArray(crm)
      ? (crm as Record<string, unknown>)
      : {};

  const primaryColor =
    (typeof m.primaryColor === "string" && m.primaryColor) ||
    (typeof nested.primaryColor === "string" && nested.primaryColor) ||
    base.primaryColor;

  const showKitchenDisplay =
    typeof m.showKitchenDisplay === "boolean"
      ? m.showKitchenDisplay
      : typeof nested.showKitchenDisplay === "boolean"
        ? nested.showKitchenDisplay
        : base.showKitchenDisplay;

  const customEstimator =
    typeof m.customEstimator === "boolean"
      ? m.customEstimator
      : typeof nested.customEstimator === "boolean"
        ? nested.customEstimator
        : typeof nested.showEstimator === "boolean"
          ? nested.showEstimator
          : base.customEstimator;

  return {
    primaryColor,
    showKitchenDisplay,
    customEstimator,
  };
}

/** True if Clerk payload explicitly sets kitchen display (top-level or under `crm_config`). */
export function hasExplicitShowKitchenDisplay(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  if ("showKitchenDisplay" in m) return true;
  const crm = m.crm_config;
  return Boolean(crm && typeof crm === "object" && "showKitchenDisplay" in (crm as object));
}

/** @deprecated Use `parseEngineConfigFromPublicMetadata` — kept for gradual migration */
export function parseCrmConfigFromPublicMetadata(meta: unknown): Record<string, unknown> {
  const c = parseEngineConfigFromPublicMetadata(meta);
  return { ...c };
}
