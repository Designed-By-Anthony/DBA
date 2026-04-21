/**
 * Prospect email utilities — pure Drizzle + Postgres.
 */
import { getDb, leads, withBypassRls, withTenantContext } from "@dba/database";
import { and, eq } from "drizzle-orm";

/**
 * Get prospect's email preferences.
 */
export async function getProspectEmailPrefs(
	tenantId: string,
	prospectId: string,
): Promise<{ email: string; unsubscribed: boolean; name: string } | null> {
	const db = getDb();
	if (!db) return null;

	return withTenantContext(db, tenantId, async (tx) => {
		const rows = await tx
			.select({
				email: leads.email,
				unsubscribed: leads.unsubscribed,
				name: leads.name,
			})
			.from(leads)
			.where(
				and(eq(leads.tenantId, tenantId), eq(leads.prospectId, prospectId)),
			)
			.limit(1);

		return rows[0] ?? null;
	});
}

/**
 * Mark a prospect as unsubscribed.
 */
export async function unsubscribeProspect(
	prospectId: string,
): Promise<boolean> {
	const db = getDb();
	if (!db) return false;

	try {
		await withBypassRls(db, async (tx) => {
			await tx
				.update(leads)
				.set({ unsubscribed: true, updatedAt: new Date().toISOString() })
				.where(eq(leads.prospectId, prospectId));
		});
		return true;
	} catch {
		return false;
	}
}

export async function sendProspectEmailFromTemplate(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_params: unknown,
): Promise<{ ok: boolean; id?: string; error?: string }> {
	// Stub for automations
	return { ok: true, id: "stub-id" };
}
