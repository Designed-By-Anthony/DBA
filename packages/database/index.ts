/**
 * Single public entry for `@dba/database`.
 *
 * Import only from `"@dba/database"` or `"@dba/database/schema"` — never `../../../../packages/...`.
 * Schema edits (e.g. a new `kitchen_notes` column) update inferred types here; CRM and other apps pick them up
 * on the next TypeScript check with no duplicate definitions.
 */
export * from "./schema";
export { getDb, closeDbPool, type Database } from "./src/db";
export {
  withTenantClerkOrg,
  withTenantSqlContext,
  type AppDatabase,
} from "./src/tenant-context";
