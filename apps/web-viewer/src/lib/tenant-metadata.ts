import type { VerticalId } from "@dba/database";

const VERTICALS: VerticalId[] = ["restaurant", "service_pro", "wellness", "agency"];

function isVertical(v: string): v is VerticalId {
  return (VERTICALS as string[]).includes(v);
}

/** Reads `public_metadata.vertical` from Clerk organization payloads. */
export function parseVerticalFromPublicMetadata(meta: unknown): VerticalId {
  if (!meta || typeof meta !== "object") return "agency";
  const raw = (meta as Record<string, unknown>).vertical;
  const v = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (v === "roofer" || v === "contractor") return "service_pro";
  if (v && isVertical(v)) return v;
  return "agency";
}

/** Optional nested `public_metadata.crm_config` object for JSONB `crm_config`. */
export function parseCrmConfigFromPublicMetadata(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const c = (meta as Record<string, unknown>).crm_config;
  if (c && typeof c === "object" && !Array.isArray(c)) return { ...(c as Record<string, unknown>) };
  return {};
}
