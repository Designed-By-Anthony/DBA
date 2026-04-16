import { NextRequest, NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/portal-auth";

/**
 * POST /api/portal/push-token
 * Placeholder endpoint: push token persistence is disabled until SQL notification table lands.
 */
export async function POST(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true, persisted: false });
  } catch (err) {
    console.error("Push token save error:", err);
    return NextResponse.json({ error: "Failed to process token" }, { status: 500 });
  }
}

/**
 * DELETE /api/portal/push-token
 * No-op while push token SQL storage is pending.
 */
export async function DELETE(request: NextRequest) {
  const session = await getPortalSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({ success: true, persisted: false });
}
