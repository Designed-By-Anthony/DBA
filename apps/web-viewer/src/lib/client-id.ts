/**
 * Agency OS — Unified Client ID Generator
 * 
 * Format: [4-char prefix][4-digit sequence]
 * Examples: desi0001, beta0001, alph0002
 * 
 * The prefix is derived from the company name (or person name as fallback).
 * The sequence auto-increments if collisions are found in Firestore.
 * 
 * This module is shared across:
 *  - CRM manual add (addProspect in actions.ts)
 *  - Lead intake webhook (/api/webhooks/lead) — requires shared secret
 *  - Public browser ingest (/api/lead) — no secret; use for marketing + personal Lighthouse UI
 */

import { db } from "@/lib/firebase";

/**
 * Generates a 4-character prefix from a name or company.
 * Strips non-alpha characters, lowercases, and takes the first 4 chars.
 * Falls back to "lead" if the input is empty or too short.
 */
function derivePrefix(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 4);
  
  // Pad to 4 chars if the name is very short (e.g. "Ed" → "edxx")
  if (cleaned.length < 4) {
    return cleaned.padEnd(4, "x");
  }
  return cleaned;
}

/**
 * Generates the next available client ID for a given name/company.
 * 
 * Strategy:
 *  1. Derive a 4-char prefix from the company (or name if no company)
 *  2. Query Firestore for all prospect IDs starting with that prefix
 *  3. Find the highest existing sequence number
 *  4. Return prefix + (highest + 1), zero-padded to 4 digits
 * 
 * @param nameOrCompany - The company name, or person name as fallback
 * @returns A unique 8-character client ID like "desi0001"
 */
export async function generateClientId(nameOrCompany: string): Promise<string> {
  const prefix = derivePrefix(nameOrCompany);
  
  // Query Firestore for existing IDs with this prefix
  // We use a range query: prefix0000 <= id < prefix9999 + 1
  const startId = `${prefix}0000`;
  const endId = `${prefix}9999`;
  
  let maxSequence = 0;
  
  try {
    const snapshot = await db
      .collection("prospects")
      .where("__name__", ">=", startId)
      .where("__name__", "<=", endId)
      .select() // We only need doc IDs, not field data
      .get();
    
    for (const doc of snapshot.docs) {
      const idSuffix = doc.id.slice(prefix.length);
      const num = parseInt(idSuffix, 10);
      if (!isNaN(num) && num > maxSequence) {
        maxSequence = num;
      }
    }
  } catch {
    // If the collection doesn't exist yet or index is missing,
    // start from 0 — first ID will be prefix0001
    maxSequence = 0;
  }
  
  const nextSequence = maxSequence + 1;
  
  if (nextSequence > 9999) {
    // Extremely unlikely edge case — overflow protection
    throw new Error(`Client ID overflow: prefix "${prefix}" has exhausted 9999 IDs`);
  }
  
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

/**
 * Derives a client ID prefix from prospect fields.
 * Prefers company name over person name.
 */
export function getIdSource(company?: string, name?: string): string {
  // Prefer company name for the prefix
  if (company && company.trim().length >= 2) {
    return company.trim();
  }
  // Fall back to person name
  if (name && name.trim().length >= 2) {
    return name.trim();
  }
  return "lead";
}
