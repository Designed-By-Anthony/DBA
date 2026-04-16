import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createCustomHostname,
  deleteCustomHostname,
  isCloudflareConfigured,
  listCustomHostnames,
} from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

async function requireUser() {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ error: "Organization required" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireUser();
  if (denied) return denied;
  if (!isCloudflareConfigured()) {
    return NextResponse.json(
      { error: "Cloudflare is not configured (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID)." },
      { status: 503 },
    );
  }
  try {
    const hostnames = await listCustomHostnames();
    return NextResponse.json({ hostnames });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireUser();
  if (denied) return denied;
  if (!isCloudflareConfigured()) {
    return NextResponse.json({ error: "Cloudflare not configured" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as { hostname?: string };
    const hostname = (body.hostname || "").trim().toLowerCase();
    if (!hostname) return NextResponse.json({ error: "hostname is required" }, { status: 400 });
    const created = await createCustomHostname({ hostname });
    return NextResponse.json({ hostname: created });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireUser();
  if (denied) return denied;
  if (!isCloudflareConfigured()) {
    return NextResponse.json({ error: "Cloudflare not configured" }, { status: 503 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id query param" }, { status: 400 });
  try {
    await deleteCustomHostname(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

