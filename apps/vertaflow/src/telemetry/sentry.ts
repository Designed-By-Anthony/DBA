type Severity = "info" | "warning" | "error";

export type TelemetryErrorContext = {
  area: "ui" | "network" | "sync" | "pwa";
  feature: string;
  severity?: Severity;
  metadata?: Record<string, unknown>;
};

type SentryLike = {
  captureException: (error: unknown, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, context?: Record<string, unknown>) => string;
  setTag?: (key: string, value: string) => void;
};

type TelemetryClient = {
  captureError: (input: unknown, context: TelemetryErrorContext) => void;
  captureMessage: (message: string, context: TelemetryErrorContext) => void;
  setTags: (tags: Record<string, string>) => void;
};

declare global {
  interface Window {
    Sentry?: SentryLike;
  }
}

function normalizeError(input: unknown): Error {
  if (input instanceof Error) return input;
  return new Error(typeof input === "string" ? input : JSON.stringify(input));
}

function toTags(context: TelemetryErrorContext) {
  return {
    area: context.area,
    feature: context.feature,
    severity: context.severity ?? "error",
  };
}

export function captureAppError(input: unknown, context: TelemetryErrorContext): void {
  const err = normalizeError(input);
  const tags = toTags(context);
  const extra = context.metadata ?? {};

  const sentry = window.Sentry;
  if (sentry?.captureException) {
    sentry.captureException(err, { tags, extra });
    return;
  }

  // Keep local observability in non-Sentry development environments.
  // eslint-disable-next-line no-console
  console.error("[VertaFlow telemetry]", err, { tags, extra });
}

function sentryMessageLevel(context: TelemetryErrorContext): string {
  if (context.severity === "info") return "info";
  if (context.severity === "warning") return "warning";
  return "error";
}

export function captureAppMessage(message: string, context: TelemetryErrorContext): void {
  const tags = toTags(context);
  const extra = context.metadata ?? {};

  const sentry = window.Sentry;
  if (sentry?.captureMessage) {
    sentry.captureMessage(message, {
      level: sentryMessageLevel(context),
      tags,
      extra,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.warn("[VertaFlow telemetry]", message, { tags, extra });
}

export type SentryRuntimeInitConfig = {
  dsn?: string;
  sentryDsn?: string;
  environment?: string;
  envName?: string;
  release?: string;
  appVersion?: string;
  canonicalOrigin?: string;
  siteUrl?: string;
  appHost?: string;
};

export function initSentryFromRuntimeConfig(config: SentryRuntimeInitConfig) {
  if (typeof window === "undefined") return;
  const dsn = (config.sentryDsn ?? config.dsn ?? "").trim();
  if (!dsn) return;
  if (window.Sentry) return;

  const environment = (config.envName ?? config.environment ?? "development").trim();
  const release = (config.release ?? config.appVersion ?? "").trim() || undefined;
  const origin = (config.canonicalOrigin ?? config.siteUrl ?? "").trim();

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://browser.sentry-cdn.com/7.120.3/bundle.tracing.min.js";
  script.crossOrigin = "anonymous";
  script.onload = () => {
    const sdk = window.Sentry as
      | (SentryLike & {
          init?: (opts: Record<string, unknown>) => void;
          setTag?: (k: string, v: string) => void;
        })
      | undefined;
    sdk?.init?.({
      dsn,
      environment,
      release,
      tracesSampleRate: 0.15,
      ignoreErrors: [
        /^ResizeObserver loop/,
        /^Non-Error promise rejection captured/,
        /chrome-extension:\/\//i,
        /moz-extension:\/\//i,
      ],
      beforeSend(event) {
        const nextTags = { ...(event.tags ?? {}) };
        nextTags.app = "vertaflow-marketing";
        if (config.appHost) nextTags.deployment_host = config.appHost;
        if (origin) nextTags.canonical_origin = origin;
        const vertical =
          typeof document !== "undefined" ? document.body?.getAttribute("data-active-vertical") : null;
        if (vertical) nextTags.vertical_tab = vertical;
        const exType = event.exception?.values?.[0]?.type;
        if (exType) nextTags.exception_type = exType;
        event.tags = nextTags;
        return event;
      },
    });
    if (origin) {
      sdk?.setTag?.("canonical_origin", origin);
    }
    if (config.appHost) {
      sdk?.setTag?.("deployment_host", config.appHost);
    }
    if (config.appVersion) {
      sdk?.setTag?.("app_version", config.appVersion);
    }
  };
  document.head.appendChild(script);
}

export function setSentryTags(tags: Record<string, string>) {
  const sentry = window.Sentry;
  if (!sentry?.setTag) return;
  for (const [key, value] of Object.entries(tags)) {
    sentry.setTag(key, value);
  }
}

export function captureHandledError(error: unknown, context: TelemetryErrorContext) {
  captureAppError(error, context);
}

export function captureMessage(message: string, context: TelemetryErrorContext) {
  captureAppMessage(message, context);
}

export function createTelemetryClient(adapter: SentryLike): TelemetryClient {
  return {
    captureError(input, context) {
      const err = normalizeError(input);
      adapter.captureException(err, {
        tags: toTags(context),
        extra: context.metadata ?? {},
      });
    },
    captureMessage(message, context) {
      adapter.captureMessage(message, {
        tags: toTags(context),
        extra: context.metadata ?? {},
      });
    },
    setTags(tags) {
      if (!adapter.setTag) return;
      for (const [key, value] of Object.entries(tags)) {
        adapter.setTag(key, value);
      }
    },
    captureHandledError(input, context) {
      const err = normalizeError(input);
      adapter.captureException(err, {
        tags: toTags(context),
        extra: context.metadata ?? {},
      });
    },
  };
}
