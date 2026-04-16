const path = require("node:path");
const { config } = require("dotenv");
const { defineConfig } = require("drizzle-kit");

const repoRoot = path.resolve(__dirname, "../..");

// drizzle-kit does not load .env; match web-viewer + repo-root conventions
config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(repoRoot, "apps/web-viewer/.env") });
config({ path: path.join(repoRoot, "apps/web-viewer/.env.local"), override: true });

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

if (!databaseUrl) {
  throw new Error(
    [
      "No database URL found for Drizzle.",
      "Set DATABASE_URL in apps/web-viewer/.env.local (copy the line from apps/web-viewer/.env.example),",
      "or export DATABASE_URL / POSTGRES_URL in your shell.",
      "Loaded (if present): .env, apps/web-viewer/.env, apps/web-viewer/.env.local at repo root:",
      repoRoot,
    ].join(" "),
  );
}

function hostnameFromDatabaseUrl(url) {
  try {
    const base = url.trim().split("?")[0];
    return new URL(base.replace(/^postgres(ql)?:/i, "http:")).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isLocalPostgresHost(host) {
  return (
    host === "localhost" || host === "127.0.0.1" || host === "::1" || host === ""
  );
}

/**
 * When TLS is needed, use explicit db fields + ssl: "require".
 * drizzle-kit passes that to node-pg as `{ rejectUnauthorized: false }` (see drizzle-kit bin.cjs).
 * A bare `url` with `sslmode=require` makes newer pg-connection-string treat it like verify-full,
 * which fails on Cloud SQL without the server CA ("unable to verify the first certificate").
 */
function shouldUseExplicitTls(url) {
  if (process.env.DRIZZLE_DATABASE_SSL === "false") return false;
  const forceSsl =
    process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1";
  if (forceSsl) return true;
  const host = hostnameFromDatabaseUrl(url);
  return !isLocalPostgresHost(host);
}

function parsePostgresUrlForPool(url) {
  const base = url.trim().split("?")[0];
  const u = new URL(base.replace(/^postgres(ql)?:/i, "http:"));
  const user = decodeURIComponent(u.username || "");
  const password = decodeURIComponent(u.password || "");
  const database = (u.pathname || "/").replace(/^\//, "").split("/")[0] || "postgres";
  const port = u.port ? Number(u.port) : 5432;
  return {
    host: u.hostname,
    port,
    user,
    password,
    database,
  };
}

function buildPostgresCredentials(url) {
  if (!shouldUseExplicitTls(url)) {
    return { url: url.trim() };
  }
  const { host, port, user, password, database } = parsePostgresUrlForPool(url);
  return {
    host,
    port,
    user,
    password,
    database,
    ssl: "require",
  };
}

module.exports = defineConfig({
  schema: "./schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: buildPostgresCredentials(databaseUrl),
});
