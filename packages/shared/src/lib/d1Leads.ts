/**
 * D1 ledger helpers — binding injected via `setLedgerDb(env.DB)` at Worker startup.
 */

import {
	createD1Client,
	type D1Client,
	leads,
	type NewLead,
	type NewTransaction,
	transactions,
} from "@dba/shared/db/client";
import { sql } from "drizzle-orm";

export type { D1Client, NewLead, NewTransaction };

let _db: D1Client | null = null;

export function setLedgerDb(db: D1Client): void {
	_db = db;
}

/** @deprecated Use setLedgerDb */
export function setLeadsDb(db: D1Client): void {
	setLedgerDb(db);
}

export async function tryInsertLead(lead: NewLead): Promise<boolean> {
	if (!_db) return false;
	try {
		await _db
			.insert(leads)
			.values(lead)
			.onConflictDoUpdate({
				target: leads.email,
				set: {
					metadata: sql`excluded.metadata`,
					created_at: sql`excluded.created_at`,
					company_name: sql`excluded.company_name`,
					source: sql`excluded.source`,
					turnstile_passed: sql`excluded.turnstile_passed`,
				},
			});
		return true;
	} catch {
		return false;
	}
}

export async function tryInsertTransaction(
	tx: NewTransaction,
	dbOverride?: D1Client,
): Promise<boolean> {
	const db = dbOverride ?? _db;
	if (!db) return false;
	try {
		await db.insert(transactions).values(tx);
		return true;
	} catch {
		return false;
	}
}

export { createD1Client, leads, transactions };
