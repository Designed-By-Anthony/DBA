import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createDnsRecord,
  deleteDnsRecord,
  isCloudflareConfigured,
  listDnsRecords,
} from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

async function requireUser() {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json(
      { error: "Organization required for zone operations" },
      { status: 403 },
    );
  }
  return null;
}

/** GET — list DNS records for the configured zone (Cloudflare API). */
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
    const records = await listDnsRecords();
    return NextResponse.json({ records });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

/** POST — create a DNS record (JSON body: type, name, content, proxied?). */
export async function POST(request: NextRequest) {
  const denied = await requireUser();
  if (denied) return denied;
  if (!isCloudflareConfigured()) {
    return NextResponse.json({ error: "Cloudflare not configured" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as {
      type: string;
      name: string;
      content: string;
      proxied?: boolean;
    };
    if (!body.type || !body.name || !body.content) {
      return NextResponse.json(
        { error: "type, name, and content are required" },
        { status: 400 },
      );
    }
    const record = await createDnsRecord({
      type: body.type,
      name: body.name,
      content: body.content,
      proxied: body.proxied,
    });
    return NextResponse.json({ record });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

/** DELETE — `?id=<dns_record_id>` */
export async function DELETE(request: NextRequest) {
  const denied = await requireUser();
  if (denied) return denied;
  if (!isCloudflareConfigured()) {
    return NextResponse.json({ error: "Cloudflare not configured" }, { status: 503 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id query param" }, { status: 400 });
  }
  try {
    await deleteDnsRecord(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
