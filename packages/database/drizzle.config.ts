import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * For Neon: drizzle-kit push needs the DIRECT connection (no pooler).
 * The pooler URL has `-pooler` in the hostname — strip it for DDL ops.
 * Falls back to DATABASE_URL as-is.
 */
function resolveUrl(): string {
	const url = process.env.DATABASE_URL ?? "";
	// Neon pooler URLs contain `-pooler.` — drizzle-kit must use the direct endpoint.
	return url.replace("-pooler.", ".");
}

export default defineConfig({
	schema: "./schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: resolveUrl(),
		ssl: { rejectUnauthorized: false },
	},
});
