/**
 * Single source of truth for Drizzle tables (PostgreSQL 18 / Cloud SQL).
 * Apps import from `@dba/database` or `@dba/database/schema` — do not duplicate table definitions in apps.
 *
 * `vertical_type` + `tenants.config` drive the site engine (skin, Kitchen vs Estimator toggles, etc.).
 *
 * @see packages/database/drizzle.config.cjs — `pnpm run db:push` from this package (uses `--config`).
 */
import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Postgres enum `vertical_type` — industry template for the engine + CRM. */
export const verticalTypeEnum = pgEnum("vertical_type", [
  "agency",
  "restaurant",
  "service_pro",
  "retail",
]);

/** JSON in `tenants.config` — what the Astro/engine UI reads to skin the site. */
export type TenantEngineConfig = {
  primaryColor: string;
  showKitchenDisplay: boolean;
  customEstimator: boolean;
};

const defaultEngineConfig: TenantEngineConfig = {
  primaryColor: "#2563eb",
  showKitchenDisplay: false,
  customEstimator: false,
};

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Clerk Organization ID — join key for webhooks and session org. */
  clerkOrgId: text("clerk_org_id").unique().notNull(),
  name: text("name").notNull(),
  /** URL-safe tenant segment, e.g. `315-flora` */
  slug: text("slug").unique().notNull(),
  vertical: verticalTypeEnum("vertical").notNull().default("agency"),
  config: jsonb("config")
    .$type<TenantEngineConfig>()
    .notNull()
    .$defaultFn(() => ({ ...defaultEngineConfig })),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  subdomain: text("subdomain").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
});

export type TenantRow = typeof tenants.$inferSelect;
export type SiteRow = typeof sites.$inferSelect;
export type VerticalTypeId = (typeof verticalTypeEnum.enumValues)[number];

/** @deprecated Use `verticalTypeEnum` — kept as alias for short imports */
export const verticalEnum = verticalTypeEnum;
/** @deprecated Use `VerticalTypeId` */
export type VerticalId = VerticalTypeId;
