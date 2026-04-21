/**
 * Seed the platform master tenant (Designed By Anthony).
 * Usage (from repo root or packages/database):
 *   DATABASE_URL="postgresql://..." node scripts/seed-master-tenant.mjs
 * Optional: DATABASE_SSL=true when your host requires explicit TLS flags.
 */
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
	console.error("DATABASE_URL is required");
	process.exit(1);
}

const pool = new pg.Pool({
	connectionString: url,
	ssl:
		process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
			? { rejectUnauthorized: false }
			: undefined,
});

const crmConfig = {
	theme: "dark",
	features: ["billing", "audit_logs"],
};

try {
	await pool.query(
		`INSERT INTO tenants (id, name, vertical, crm_config)
     VALUES ($1, $2, 'agency', $3::jsonb)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       vertical = EXCLUDED.vertical,
       crm_config = EXCLUDED.crm_config`,
		["agency_master", "Designed By Anthony", JSON.stringify(crmConfig)],
	);
	console.info("Seeded tenants row: agency_master — Designed By Anthony");
} catch (e) {
	console.error(e);
	process.exit(1);
} finally {
	await pool.end();
}
