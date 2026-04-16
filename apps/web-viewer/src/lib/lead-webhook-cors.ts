import type { NextRequest } from "next/server";

/** Origins allowed to POST lead endpoints from a browser (marketing site, local dev). */
export function leadWebhookCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const raw =
    process.env.LEAD_WEBHOOK_CORS_ORIGINS ||
    "https://designedbyanthony.com,https://www.designedbyanthony.com,http://localhost:4321,http://127.0.0.1:4321,http://localhost:3000,http://127.0.0.1:3000";
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allow =
    origin && allowed.includes(origin) ? origin : allowed[0] || "*";

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-webhook-secret, x-lead-secret, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
