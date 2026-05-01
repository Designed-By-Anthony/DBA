/**
 * Drizzle D1 client factory.
 *
 * Usage (Cloudflare Worker / Pages):
 *   import { createD1Client } from "@dba/shared/db/client";
 *   const db = createD1Client(env.DBA_LEADS_DB);
 *
 * The D1Database type is declared by @cloudflare/workers-types and is
 * available in both Workers and Pages with D1 bindings configured.
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type { Lead, NewLead, LeadStatus, LeadType } from "./schema";
export { leads, leadStatusEnum, leadTypeEnum } from "./schema";

/**
 * Create a Drizzle client bound to a Cloudflare D1 database instance.
 * Pass the D1 binding from `env.DBA_LEADS_DB`.
 */
// biome-ignore lint/suspicious/noExplicitAny: D1Database type from @cloudflare/workers-types; avoid coupling the shared package to that devDependency
export function createD1Client(d1: any) {
	return drizzle(d1, { schema });
}

export type D1Client = ReturnType<typeof createD1Client>;
