import type { APIRoute } from "astro";
import { StreamChat } from "stream-chat";

export const prerender = false;

const ALLOWED_ORIGINS = new Set([
  "https://designedbyanthony.com",
  "https://www.designedbyanthony.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);

function corsHeaders(origin: string | null): HeadersInit {
  const o = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://designedbyanthony.com";
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

/**
 * Issues a short-lived Stream Chat user token for the marketing-site widget.
 * Secret key stays server-side; client only receives the user JWT.
 */
export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const apiKey = import.meta.env.PUBLIC_STREAM_CHAT_API_KEY?.trim();
  const apiSecret =
    (typeof process !== "undefined" && process.env.STREAM_CHAT_SECRET?.trim()) || undefined;

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "Chat is not configured." }), {
      status: 503,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  let body: { userId?: string; userName?: string };
  try {
    body = (await request.json()) as { userId?: string; userName?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const rawId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!rawId || rawId.length > 128) {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "visitor";
  const userName =
    typeof body.userName === "string" && body.userName.trim()
      ? body.userName.trim().slice(0, 80)
      : "Website visitor";

  const inboxUserId = (
    process.env.STREAM_CHAT_INBOX_USER_ID?.trim() || "DBAStudio315"
  ).slice(0, 64);
  const inboxName =
    process.env.STREAM_CHAT_INBOX_NAME?.trim() || "Designed by Anthony";

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  await serverClient.upsertUser({
    id: safeId,
    name: userName,
    role: "user",
  });
  await serverClient.upsertUser({
    id: inboxUserId,
    name: inboxName,
    role: "user",
  });

  const token = serverClient.createToken(safeId);

  return new Response(
    JSON.stringify({ token, apiKey, userId: safeId, inboxUserId }),
    {
    status: 200,
    headers: { ...headers, "Content-Type": "application/json" },
  });
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin");
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
};
