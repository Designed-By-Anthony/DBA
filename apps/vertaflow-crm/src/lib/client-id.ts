/**
 * Client ID generator — pure Drizzle + Postgres.
 * Generates deterministic prospect IDs like "desi0001" from company/name.
 */
import { getDb, leads, withBypassRls } from "@dba/database";
import { and, eq, sql } from "drizzle-orm";

/**
 * Extract an ID source from company or name.
 * Takes first 4 letters of the company (or name) lowercase.
 */
export function getIdSource(company?: string, name?: string): string {
	const src = (company || name || "lead").trim().toLowerCase();
	return src
		.replace(/[^a-z0-9]/g, "")
		.substring(0, 4)
		.padEnd(4, "x");
}

/**
 * Generate a unique client ID like "desi0001" **within a tenant**.
 * Without `tenantId`, uses a random suffix (no global scan — avoids cross-tenant collisions).
 */
export async function generateClientId(
	prefix: string,
	tenantId: string | null,
): Promise<string> {
	const db = getDb();
	if (!db || !tenantId) {
		const rand = Math.floor(Math.random() * 9999)
			.toString()
			.padStart(4, "0");
		return `${prefix}${rand}`;
	}

	try {
		return await withBypassRls(db, async (tx) => {
			const pattern = `${prefix}%`;
			const result = await tx
				.select({ prospectId: leads.prospectId })
				.from(leads)
				.where(
					and(
						eq(leads.tenantId, tenantId),
						sql`${leads.prospectId} LIKE ${pattern}`,
					),
				)
				.orderBy(sql`${leads.prospectId} DESC`)
				.limit(1);

			let nextNum = 1;
			if (result.length > 0) {
				const existing = result[0].prospectId;
				const numPart = existing.substring(prefix.length);
				const parsed = parseInt(numPart, 10);
				if (!isNaN(parsed)) {
					nextNum = parsed + 1;
				}
			}

			return `${prefix}${nextNum.toString().padStart(4, "0")}`;
		});
	} catch {
		// Fallback on error
		const rand = Math.floor(Math.random() * 9999)
			.toString()
			.padStart(4, "0");
		return `${prefix}${rand}`;
	}
}
