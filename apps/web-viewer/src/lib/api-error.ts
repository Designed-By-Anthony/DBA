/**
 * Error-response hygiene for API routes.
 *
 * Before this helper every route that caught an `unknown` error did:
 *
 *   const msg = err instanceof Error ? err.message : "Internal error";
 *   return NextResponse.json({ error: msg }, { status: 500 });
 *
 * which leaks implementation detail — database host/port in connection
 * errors, "No such key" from Stripe revealing which test/live secret is
 * configured, Drizzle SQL snippets, Clerk JWT verification detail, etc. —
 * straight to internet callers.
 *
 * Use `apiError()` to return a generic, non-enumerable message to the
 * client while still logging the full error server-side (Vercel logs,
 * Sentry) for operator debugging.
 *
 * Deliberately no `stack` return. Deliberately no error code return.
 */
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

type LogContext = Record<string, unknown>;

/**
 * Log the error server-side and return a generic client-facing JSON response.
 *
 * @param tag        Short tag identifying the route (shows up in logs).
 * @param err        The caught value (may be anything — we handle `unknown`).
 * @param status     HTTP status to return (default 500).
 * @param publicMessage Generic message safe for the response body.
 * @param extra      Optional structured context to log.
 */
export function apiError(
  tag: string,
  err: unknown,
  opts?: {
    status?: number;
    publicMessage?: string;
    headers?: HeadersInit;
    extra?: LogContext;
  },
): NextResponse {
  const status = opts?.status ?? 500;
  const publicMessage = opts?.publicMessage ?? defaultMessageForStatus(status);

  const detail = err instanceof Error ? err.stack || err.message : String(err);
  const context = opts?.extra ? ` ${JSON.stringify(opts.extra)}` : "";
  console.error(`[${tag}] ${detail}${context}`);

  // Report to Sentry as a first-class exception
  if (err instanceof Error) {
    Sentry.captureException(err, { tags: { apiRoute: tag }, extra: opts?.extra });
  } else {
    Sentry.captureMessage(`[${tag}] ${String(err)}`, { level: "error", tags: { apiRoute: tag }, extra: opts?.extra });
  }

  const init: ResponseInit = opts?.headers ? { status, headers: opts.headers } : { status };
  return NextResponse.json({ error: publicMessage }, init);
}

function defaultMessageForStatus(status: number): string {
  if (status >= 400 && status < 500) {
    if (status === 400) return "Bad request";
    if (status === 401) return "Unauthorized";
    if (status === 403) return "Forbidden";
    if (status === 404) return "Not found";
    if (status === 409) return "Conflict";
    if (status === 413) return "Request too large";
    if (status === 429) return "Too many requests";
    return "Request rejected";
  }
  if (status === 503) return "Service unavailable";
  return "Internal error";
}
