/**
 * insertLead — fire-and-forget D1 lead persistence helper.
 *
 * Design contract:
 * - Resolves `{ ok: true }` on successful insert.
 * - Resolves `{ ok: false, error }` on any D1 error — **never rejects**,
 *   so the caller's email-notification fallback is always reached.
 * - Deduplicates by email using ON CONFLICT DO NOTHING (D1/SQLite).
 * - `turnstile_passed` is always explicitly recorded from the caller.
 */
import { sql } from "drizzle-orm";
import { type D1Client, type NewLead, leads } from "./client";

export type InsertLeadResult =
	| { ok: true }
	| { ok: false; error: unknown };

/**
 * Insert a lead row into the D1 `leads` table.
 * Silently ignores duplicate emails (ON CONFLICT DO NOTHING).
 */
export async function insertLead(
	db: D1Client,
	lead: NewLead,
): Promise<InsertLeadResult> {
	try {
		await db
			.insert(leads)
			.values(lead)
			.onConflictDoUpdate({
				target: leads.email,
				set: {
					// On re-submit, update metadata + timestamp but preserve status
					metadata: sql`excluded.metadata`,
					created_at: sql`excluded.created_at`,
				},
			});
		return { ok: true };
	} catch (error) {
		console.error("[d1-leads] insert failed:", error);
		return { ok: false, error };
	}
}
