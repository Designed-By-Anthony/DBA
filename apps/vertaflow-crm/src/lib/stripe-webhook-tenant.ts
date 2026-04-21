import {
	STRIPE_METADATA_CLERK_ORG,
	STRIPE_METADATA_PROSPECT_ID,
} from "@/lib/stripe-tenant-metadata";

/** Read `clerk_org_id` from Stripe object metadata (Checkout Session, Subscription, etc.). */
export function readClerkOrgIdFromMetadata(
	metadata: Record<string, string> | null | undefined,
): string | undefined {
	if (!metadata || typeof metadata !== "object") return undefined;
	const raw = metadata[STRIPE_METADATA_CLERK_ORG] ?? metadata.clerk_org_id;
	const s = typeof raw === "string" ? raw.trim() : "";
	return s || undefined;
}

/** Prospect id from metadata (`prospect_id` preferred; legacy `prospectId` supported). */
export function readProspectIdFromMetadata(
	metadata: Record<string, string> | null | undefined,
): string | undefined {
	if (!metadata || typeof metadata !== "object") return undefined;
	const a = metadata[STRIPE_METADATA_PROSPECT_ID]?.trim();
	if (a) return a;
	const b = metadata.prospectId?.trim();
	return b || undefined;
}
