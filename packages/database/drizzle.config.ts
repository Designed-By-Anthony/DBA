import { defineConfig } from "drizzle-kit";

const sslOn = process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";

export default defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
    ssl: sslOn ? { rejectUnauthorized: false } : undefined,
  },
});
