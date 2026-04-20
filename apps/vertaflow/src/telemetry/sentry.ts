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
  const payload = {
    tags: toTags(context),
    extra: context.metadata ?? {},
  };

  const sentry = window.Sentry;
  if (sentry?.captureException) {
    sentry.captureException(err, payload);
    return;
  }

  // Keep local observability in non-Sentry development environments.
  // eslint-disable-next-line no-console
  console.error("[VertaFlow telemetry]", err, payload);
}

export function captureAppMessage(message: string, context: TelemetryErrorContext): void {
  const payload = {
    tags: toTags(context),
    extra: context.metadata ?? {},
  };

  const sentry = window.Sentry;
  if (sentry?.captureMessage) {
    sentry.captureMessage(message, payload);
    return;
  }

  // eslint-disable-next-line no-console
  console.warn("[VertaFlow telemetry]", message, payload);
}

export function initSentryFromRuntimeConfig(config: {
  dsn?: string;
  environment: string;
  release?: string;
  appVersion?: string;
  canonicalOrigin?: string;
}) {
  if (typeof window === "undefined") return;
  if (!config.dsn?.trim()) return;
  if (window.Sentry) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://browser.sentry-cdn.com/7.120.3/bundle.tracing.min.js";
  script.crossOrigin = "anonymous";
  script.onload = () => {
    const sdk = window.Sentry as
      | (SentryLike & { init?: (opts: Record<string, unknown>) => void; setTag?: (k: string, v: string) => void })
      | undefined;
    sdk?.init?.({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release ?? config.appVersion,
      tracesSampleRate: 0.2,
    });
    if (config.canonicalOrigin) {
      sdk?.setTag?.("canonical_origin", config.canonicalOrigin);
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
