/**
 * Drizzle Kit configuration — Cloudflare D1 (SQLite dialect).
 *
 * CLI usage (from monorepo root):
 *   bun run db:generate   — generate SQL migration files
 *   bun run db:migrate    — apply pending migrations to D1
 *
 * Migrations are generated into `packages/shared/src/db/migrations/`
 * so they are co-located with the schema and can be imported by both
 * the API worker and the admin app.
 *
 * The `wranglerConfigFile` must point at the Worker wrangler.json that
 * declares the `DBA_LEADS_DB` D1 binding (apps/api/wrangler.json).
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	driver: "d1-http",
	schema: "./packages/shared/src/db/schema.ts",
	out: "./packages/shared/src/db/migrations",
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
		databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? "",
		token: process.env.CLOUDFLARE_API_TOKEN ?? "",
	},
});
