"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb, tenants, withTenantContext } from "@dba/database";
import { eq } from "drizzle-orm";

function requireDb() {
	const db = getDb();
	if (!db) throw new Error("Database not configured");
	return db;
}

/** Record that the tenant accepted TOS + Privacy Policy. */
export async function acceptLegalAgreements() {
	const { orgId, userId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [tenant] = await tx
			.select({ crmConfig: tenants.crmConfig })
			.from(tenants)
			.where(eq(tenants.clerkOrgId, orgId))
			.limit(1);

		const config = (tenant?.crmConfig ?? {}) as Record<string, unknown>;
		const legal = (config.legal ?? {}) as Record<string, unknown>;

		const updatedConfig = {
			...config,
			legal: {
				...legal,
				tosAccepted: true,
				tosAcceptedAt: now,
				tosAcceptedBy: userId,
				tosVersion: "2026-04-19",
				privacyAccepted: true,
				privacyAcceptedAt: now,
				privacyAcceptedBy: userId,
				privacyVersion: "2026-04-19",
			},
		};

		await tx
			.update(tenants)
			.set({ crmConfig: updatedConfig, updatedAt: now })
			.where(eq(tenants.clerkOrgId, orgId));

		return { ok: true };
	});
}

/** Check if tenant has accepted legal agreements. */
export async function checkLegalAcceptance(): Promise<{
	tosAccepted: boolean;
	privacyAccepted: boolean;
}> {
	const { orgId } = await auth();
	if (!orgId) return { tosAccepted: false, privacyAccepted: false };
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [tenant] = await tx
			.select({ crmConfig: tenants.crmConfig })
			.from(tenants)
			.where(eq(tenants.clerkOrgId, orgId))
			.limit(1);

		const config = (tenant?.crmConfig ?? {}) as Record<string, unknown>;
		const legal = (config.legal ?? {}) as Record<string, unknown>;

		return {
			tosAccepted: !!legal.tosAccepted,
			privacyAccepted: !!legal.privacyAccepted,
		};
	});
}

/** Get / update the onboarding progress stored in crmConfig.onboarding. */
export async function getOnboardingProgress(): Promise<
	Record<string, boolean>
> {
	const { orgId } = await auth();
	if (!orgId) return {};
	const db = requireDb();

	return withTenantContext(db, orgId, async (tx) => {
		const [tenant] = await tx
			.select({ crmConfig: tenants.crmConfig })
			.from(tenants)
			.where(eq(tenants.clerkOrgId, orgId))
			.limit(1);

		const config = (tenant?.crmConfig ?? {}) as Record<string, unknown>;
		return (config.onboarding ?? {}) as Record<string, boolean>;
	});
}

/** Mark an onboarding step as complete. */
export async function completeOnboardingStep(stepId: string) {
	const { orgId } = await auth();
	if (!orgId) throw new Error("Unauthorized");
	const db = requireDb();

	const now = new Date().toISOString();

	return withTenantContext(db, orgId, async (tx) => {
		const [tenant] = await tx
			.select({ crmConfig: tenants.crmConfig })
			.from(tenants)
			.where(eq(tenants.clerkOrgId, orgId))
			.limit(1);

		const config = (tenant?.crmConfig ?? {}) as Record<string, unknown>;
		const onboarding = (config.onboarding ?? {}) as Record<string, boolean>;

		const updatedConfig = {
			...config,
			onboarding: { ...onboarding, [stepId]: true },
		};

		await tx
			.update(tenants)
			.set({ crmConfig: updatedConfig, updatedAt: now })
			.where(eq(tenants.clerkOrgId, orgId));

		return { ok: true };
	});
}
