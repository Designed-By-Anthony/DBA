// Next.js instrumentation hook — runs once when the server starts.
// This is the global entry point that ensures Sentry captures ALL errors:
//   - Server component errors
//   - Server action errors (verifyAuth, addProspect, etc.)
//   - API route errors
//   - Edge middleware errors
//   - Unhandled promise rejections
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side: import the server Sentry config
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime: import the edge Sentry config
    await import("./sentry.edge.config");
  }
}

// This hook is called whenever an error is caught by Next.js error handling.
// It ensures ALL server-side errors go to Sentry automatically.
export const onRequestError = Sentry.captureRequestError;
