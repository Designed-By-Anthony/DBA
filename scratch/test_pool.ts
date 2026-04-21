import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

dotenv.config({ path: "apps/vertaflow-crm/.env.local" });

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	max: 10,
});
const db = drizzle(pool);

async function run() {
	await db.execute(sql`SELECT set_config('app.test_val', '123', false)`);
	const res1 = await db.execute(
		sql`SELECT current_setting('app.test_val', true) as val`,
	);
	console.log("Res1:", res1.rows[0]);

	const res2 = await db.execute(
		sql`SELECT current_setting('app.test_val', true) as val`,
	);
	console.log("Res2:", res2.rows[0]);

	await pool.end();
}
run();
