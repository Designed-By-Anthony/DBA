import { captureAppError } from "@/telemetry/sentry";

type CaptureFn = (error: Error, context?: Record<string, unknown>) => void;

export function createGlobalErrorHandlers(captureException: CaptureFn) {
  return {
    onError(event: ErrorEvent) {
      captureException(event.error ?? new Error(event.message ?? "Unknown runtime error"), {
        origin: "window.error",
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      });
    },
    onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureException(reason, {
        origin: "window.unhandledrejection",
      });
    },
  };
}

export function registerGlobalErrorHandlers(): () => void {
  const handlers = createGlobalErrorHandlers((error, context) => {
    captureAppError(error, {
      area: "ui",
      feature: String(context?.origin ?? "global-error"),
      severity: "error",
      metadata: context,
    });
  });
  window.addEventListener("error", handlers.onError);
  window.addEventListener("unhandledrejection", handlers.onUnhandledRejection);

  return () => {
    window.removeEventListener("error", handlers.onError);
    window.removeEventListener("unhandledrejection", handlers.onUnhandledRejection);
  };
}
