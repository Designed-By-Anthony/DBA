import { describe, expect, it, vi } from "vitest";
import { getRuntimeConfig } from "../runtime/config";
import { registerServiceWorker } from "../pwa/registerServiceWorker";
import { createGlobalErrorHandlers } from "../telemetry/globalErrorHandlers";
import { createTelemetryClient } from "../telemetry/sentry";

describe("runtime config", () => {
  it("falls back to vertaflow domains", () => {
    const config = getRuntimeConfig({ origin: "https://vertaflow.io" });
    expect(config.crmLeadUrl).toBe("https://admin.vertaflow.io/api/lead");
    expect(config.canonicalOrigin).toBe("https://vertaflow.io");
    expect(config.siteUrl).toBe("https://vertaflow.io");
    expect(config.appHost).toBe("vertaflow.io");
  });

  it("marks production env when MODE is production", () => {
    const config = getRuntimeConfig({
      origin: "https://vertaflow.io",
      env: { MODE: "production", PROD: true, VITE_SENTRY_DSN: "" },
    });
    expect(config.envName).toBe("production");
  });

  it("uses env override for lead endpoint", () => {
    const config = getRuntimeConfig({
      origin: "https://preview.vercel.app",
      env: { VITE_CRM_LEAD_URL: "https://custom.example.com/api/lead" },
    });
    expect(config.crmLeadUrl).toBe("https://custom.example.com/api/lead");
  });
});

describe("service worker registration", () => {
  it("returns unsupported when service workers are unavailable", async () => {
    const result = await registerServiceWorker(undefined);
    expect(result.status).toBe("unsupported");
  });

  it("registers service worker with expected URL and scope", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });
    const result = await registerServiceWorker({ register } as unknown as ServiceWorkerContainer);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(result.status).toBe("registered");
  });
});

describe("global error handlers", () => {
  it("captures error and unhandled rejection payloads", () => {
    const captureException = vi.fn();
    const handlers = createGlobalErrorHandlers(captureException);

    handlers.onError({
      message: "boom",
      filename: "main.js",
      lineno: 7,
      colno: 3,
    } as ErrorEvent);
    handlers.onUnhandledRejection({
      reason: new Error("rejection"),
    } as PromiseRejectionEvent);

    expect(captureException).toHaveBeenCalledTimes(2);
  });
});

describe("sentry telemetry client", () => {
  it("captures exception and message through window.Sentry transport", () => {
    const captureException = vi.fn();
    const captureMessage = vi.fn();
    const setTag = vi.fn();

    const telemetry = createTelemetryClient({
      captureException,
      captureMessage,
      setTag,
    });

    telemetry.setTags({ vertical: "retail", route: "/pricing" });
    telemetry.captureHandledError(new Error("sync failure"), {
      area: "sync",
      feature: "flush",
      severity: "error",
      metadata: { pending: 2 },
    });
    telemetry.captureMessage("healthy ping", {
      area: "ui",
      feature: "heartbeat",
      severity: "info",
    });

    expect(setTag).toHaveBeenCalledWith("vertical", "retail");
    expect(setTag).toHaveBeenCalledWith("route", "/pricing");
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });
});
