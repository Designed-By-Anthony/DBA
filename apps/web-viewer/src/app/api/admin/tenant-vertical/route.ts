import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTenantByOrgId } from "@/lib/tenant-db";

export const dynamic = "force-dynamic";

/**
 * Returns the org's row from Cloud SQL (`tenants.vertical`) for Chameleon UI.
 * Auth required — used by admin VerticalProvider to prefer SQL over Firestore branding.
 */
export async function GET() {
  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 503 },
    );
  }
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ vertical: null }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ vertical: null });
  }

  const tenant = await getTenantByOrgId(orgId);
  return NextResponse.json({
    vertical: tenant?.vertical ?? null,
  });
}
