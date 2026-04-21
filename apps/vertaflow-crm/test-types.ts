import { type Database } from "@dba/database";

type DB = Database | Parameters<Parameters<Database['transaction']>[0]>[0];

export function test(db: DB) {
  db.select();
}
