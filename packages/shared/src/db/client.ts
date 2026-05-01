/**
 * Drizzle D1 client factory — pass `env.DB` from Workers / Pages.
 */
import { type AnyD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type {
	Lead,
	LeadSource,
	LeadStatus,
	NewLead,
	NewTransaction,
	Transaction,
} from "./schema";
export {
	leadSourceEnum,
	leadStatusEnum,
	leads,
	transactions,
} from "./schema";

export function createD1Client(d1: AnyD1Database) {
	return drizzle(d1, { schema });
}

export type D1Client = ReturnType<typeof createD1Client>;
