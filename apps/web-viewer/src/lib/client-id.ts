/**
 * Client ID generator — pure Drizzle, no Firestore.
 * Generates deterministic prospect IDs like "desi0001" from company/name.
 */
import { getDb, withBypassRls, leads } from "@dba/database";
import { eq, and, sql } from "drizzle-orm";

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
 * Generate a unique client ID like "desi0001".
 * Queries the leads table to find the next available number for a given prefix.
 */
export async function generateClientId(prefix: string): Promise<string> {
  const db = getDb();
  if (!db) {
    // Fallback when no DB: generate a random ID
    const rand = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");
    return `${prefix}${rand}`;
  }

  try {
    return await withBypassRls(db, async (tx) => {
      // Find the highest numbered prospect ID with this prefix
      const pattern = `${prefix}%`;
      const result = await tx
        .select({ prospectId: leads.prospectId })
        .from(leads)
        .where(sql`${leads.prospectId} LIKE ${pattern}`)
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
