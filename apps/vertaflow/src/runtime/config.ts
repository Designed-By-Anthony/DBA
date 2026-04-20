const DEFAULT_CANONICAL_ORIGIN = "https://vertaflow.io";
const DEFAULT_CRM_LEAD_URL = "https://admin.vertaflow.io/api/lead";

type RuntimeEnv = Record<string, string | undefined>;

export type RuntimeConfig = {
  canonicalOrigin: string;
  crmLeadUrl: string;
  sentryDsn: string;
  appVersion: string;
  environment: string;
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

export function getRuntimeConfig(args?: {
  origin?: string;
  env?: RuntimeEnv;
}): RuntimeConfig {
  const env = args?.env ?? (import.meta.env as RuntimeEnv);
  const canonicalOrigin = normalizeUrl(
    env.VITE_PUBLIC_DOMAIN ?? args?.origin,
    DEFAULT_CANONICAL_ORIGIN,
  );
  const crmLeadUrl = normalizeUrl(env.VITE_CRM_LEAD_URL, DEFAULT_CRM_LEAD_URL);

  return {
    canonicalOrigin,
    crmLeadUrl,
    sentryDsn: (env.VITE_SENTRY_DSN ?? "").trim(),
    appVersion: (env.VITE_APP_VERSION ?? "1.0.0").trim(),
    environment: (env.MODE ?? "development").trim(),
  };
}

export const runtimeConfig = getRuntimeConfig();
