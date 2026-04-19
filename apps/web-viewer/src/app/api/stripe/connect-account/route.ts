import { NextResponse } from "next/server";
import "@dba/env/web-viewer-aliases";
import { auth } from "@clerk/nextjs/server";
import { getDb, tenants, withTenantContext } from "@dba/database";
import { eq } from "drizzle-orm";
import {
  createConnectedAccount,
  createAccountLink,
  getAccountStatus,
} from "@/lib/stripe-connect";
import { apiError } from "@/lib/api-error";

/**
 * GET — fetch the current tenant's Stripe Connect status.
 * POST — create a new Connected Account + return an onboarding link.
 */

export async function GET() {
  try {
    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const tenant = await withTenantContext(db, orgId, async (tx) => {
      const rows = await tx
        .select({
          stripeConnectAccountId: tenants.stripeConnectAccountId,
          stripeConnectStatus: tenants.stripeConnectStatus,
          platformFeeBps: tenants.platformFeeBps,
        })
        .from(tenants)
        .where(eq(tenants.clerkOrgId, orgId))
        .limit(1);
      return rows[0] ?? null;
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // If they have an account, get live status from Stripe
    if (tenant.stripeConnectAccountId) {
      const status = await getAccountStatus(tenant.stripeConnectAccountId);
      if ("error" in status) {
        return NextResponse.json({
          connectStatus: tenant.stripeConnectStatus,
          accountId: tenant.stripeConnectAccountId,
          platformFeeBps: tenant.platformFeeBps,
          error: status.error,
        });
      }
      return NextResponse.json({
        connectStatus: tenant.stripeConnectStatus,
        platformFeeBps: tenant.platformFeeBps,
        ...status,
      });
    }

    return NextResponse.json({
      connectStatus: tenant.stripeConnectStatus,
      accountId: null,
      platformFeeBps: tenant.platformFeeBps,
    });
  } catch (error: unknown) {
    return apiError("stripe/connect-account/GET", error);
  }
}

export async function POST() {
  try {
    const { orgId, orgSlug } = await auth();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Get tenant info
    const tenant = await withTenantContext(db, orgId, async (tx) => {
      const rows = await tx
        .select({
          name: tenants.name,
          supportEmail: tenants.supportEmail,
          stripeConnectAccountId: tenants.stripeConnectAccountId,
        })
        .from(tenants)
        .where(eq(tenants.clerkOrgId, orgId))
        .limit(1);
      return rows[0] ?? null;
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Don't create duplicate accounts
    if (tenant.stripeConnectAccountId) {
      return NextResponse.json(
        { error: "Connected Account already exists", accountId: tenant.stripeConnectAccountId },
        { status: 409 },
      );
    }

    const result = await createConnectedAccount({
      tenantId: orgId,
      email: tenant.supportEmail || `${orgSlug || orgId}@designedbyanthony.com`,
      businessName: tenant.name,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = await createAccountLink({
      accountId: result.accountId,
      returnUrl: `${baseUrl}/admin/settings/payments?onboarding=complete`,
      refreshUrl: `${baseUrl}/admin/settings/payments?onboarding=refresh`,
    });

    if ("error" in link) {
      return NextResponse.json(
        { accountId: result.accountId, error: link.error },
        { status: 500 },
      );
    }

    return NextResponse.json({
      accountId: result.accountId,
      onboardingUrl: link.url,
    });
  } catch (error: unknown) {
    return apiError("stripe/connect-account/POST", error);
  }
}
