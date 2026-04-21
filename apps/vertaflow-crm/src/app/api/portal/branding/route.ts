import type { PlanSuite } from "@dba/lead-form-contract";
import { type NextRequest, NextResponse } from "next/server";
import { getTenantByOrgId } from "@/lib/tenant-db";
import { resolveUiVerticalTemplateFromTenant } from "@/lib/vertical-template-map";

/**
 * Portal Branding API
 *
 * GET /api/portal/branding?org=orgId
 *
 * Returns the branding settings for a given org.
 * This is a public endpoint (no auth) since the portal login page needs it.
 */
export async function GET(request: NextRequest) {
	const orgId = request.nextUrl.searchParams.get("org");

	if (!orgId) {
		return NextResponse.json({
			brandName: "Client Portal",
			brandColor: "#2563eb",
			brandInitial: "D",
			verticalTemplate: "general",
			planSuite: "full" satisfies PlanSuite,
		});
	}

	try {
		const tenant = await getTenantByOrgId(orgId);
		if (!tenant) {
			return NextResponse.json({
				brandName: "Client Portal",
				brandColor: "#2563eb",
				brandInitial: "D",
				verticalTemplate: "general",
				planSuite: "full" satisfies PlanSuite,
			});
		}

		const planSuite: PlanSuite = "full";

		return NextResponse.json({
			brandName: tenant.name || "Client Portal",
			brandColor: tenant.brandColor?.trim() || "#2563eb",
			brandInitial: tenant.name?.trim()?.charAt(0)?.toUpperCase() || "D",
			verticalTemplate: resolveUiVerticalTemplateFromTenant(tenant),
			planSuite,
		});
	} catch (error) {
		console.error("Portal branding error:", error);
		return NextResponse.json({
			brandName: "Client Portal",
			brandColor: "#2563eb",
			brandInitial: "D",
			verticalTemplate: "general",
			planSuite: "full" satisfies PlanSuite,
		});
	}
}
