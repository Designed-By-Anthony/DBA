/**
 * Drizzle Kit — Cloudflare D1 (SQLite).
 * `wranglerConfigFile` must declare the `DB` binding (apps/api/wrangler.json).
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
