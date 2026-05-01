/**
 * Drizzle Kit — Cloudflare D1 (SQLite).
 * `apps/api/wrangler.json` must declare binding `DB` for D1 database `dba-ledger`.
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	driver: "d1-http",
	schema: "./packages/shared/src/db/schema.ts",
	out: "./apps/api/migrations",
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
		databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? "",
		token: process.env.CLOUDFLARE_API_TOKEN ?? "",
	},
});
