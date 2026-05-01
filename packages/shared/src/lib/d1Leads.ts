/**
 * Module-level D1 lead-insertion helper for the API Worker.
 *
 * The D1 binding is not available at import time — it is injected once
 * at Worker startup via `setLeadsDb()` (called from `apps/api/src/index.ts`).
 * Route handlers call `tryInsertLead()` which silently no-ops when the
 * binding is absent (e.g. local dev without D1 configured).
 */
import { type D1Client, type NewLead, leads } from "@dba/shared/db/client";
import { insertLead } from "@dba/shared/db/insertLead";

export type { D1Client, NewLead };

let _db: D1Client | null = null;

/** Called once at Worker startup from `apps/api/src/index.ts`. */
export function setLeadsDb(db: D1Client): void {
	_db = db;
}

/**
 * Attempt to persist a lead to D1.
 * - Returns `{ ok: true }` on success or when D1 is not configured.
 * - Returns `{ ok: false, error }` on D1 errors.
 * - Never throws — callers must not skip their email fallback.
 */
export async function tryInsertLead(
	lead: NewLead,
): Promise<{ ok: boolean; error?: unknown }> {
	if (!_db) return { ok: true };
	return insertLead(_db, lead);
}

export { leads };
