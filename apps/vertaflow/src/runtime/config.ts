const DEFAULT_CANONICAL_ORIGIN = "https://vertaflow.io";
const DEFAULT_CRM_LEAD_URL = "https://admin.vertaflow.io/api/lead";

type RuntimeEnv = Record<string, string | boolean | undefined>;

export type RuntimeConfig = {
  /** Public site origin (canonical), e.g. https://vertaflow.io */
  canonicalOrigin: string;
  /** Alias of canonicalOrigin — used for JSON-LD and share URLs */
  siteUrl: string;
  crmLeadUrl: string;
  sentryDsn: string;
  appVersion: string;
  /** Vite MODE (development | production | …) */
  environment: string;
  /** Sentry-style environment name (production vs preview) */
  envName: string;
  /** Hostname only, for tagging */
  appHost: string;
};

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  try {
    return trimTrailingSlash(new URL(candidate).toString());
  } catch {
    return fallback;
  }
}

function resolveWindowOrigin(): string | undefined {
  if (typeof globalThis === "undefined") return undefined;
  if (!("location" in globalThis)) return undefined;
  const loc = (globalThis as Window).location;
  if (!loc?.origin || loc.origin === "null") return undefined;
  return loc.origin;
}

function hostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return "vertaflow.io";
  }
}

export function getRuntimeConfig(args?: {
  origin?: string;
  env?: RuntimeEnv;
}): RuntimeConfig {
  const env = args?.env ?? (import.meta.env as RuntimeEnv);
  const windowOrigin = resolveWindowOrigin();
  const canonicalOrigin = normalizeUrl(
    args?.origin ?? env.VITE_PUBLIC_DOMAIN ?? windowOrigin,
    DEFAULT_CANONICAL_ORIGIN,
  );
  const crmLeadUrl = normalizeUrl(env.VITE_CRM_LEAD_URL as string | undefined, DEFAULT_CRM_LEAD_URL);
  const mode = String(env.MODE ?? "development").trim();
  const prod = env.PROD === true || mode === "production";
  const envName = prod ? "production" : mode === "test" ? "test" : "development";

  return {
    canonicalOrigin,
    siteUrl: canonicalOrigin,
    crmLeadUrl,
    sentryDsn: String(env.VITE_SENTRY_DSN ?? "").trim(),
    appVersion: String(env.VITE_APP_VERSION ?? "1.0.0").trim(),
    environment: mode,
    envName,
    appHost: hostFromOrigin(canonicalOrigin),
  };
}

export const runtimeConfig = getRuntimeConfig();
