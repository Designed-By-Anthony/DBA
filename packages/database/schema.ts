/**
 * Cloud SQL (PostgreSQL) — tenant + site registry for multi-vertical CRM.
 * @see packages/database/drizzle.config.ts — `pnpm exec drizzle-kit push` from this package.
 */
import { jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

/** Industry / UX template — drives conditional CRM UI. */
export const verticalEnum = pgEnum("vertical", ["restaurant", "roofer", "florist", "agency"]);

export const tenants = pgTable("tenants", {
  /** Clerk Organization ID or fixed platform id (e.g. agency_master) */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  vertical: verticalEnum("vertical").notNull().default("agency"),
  /** Feature flags, theme, vertical-specific routing (JSON). */
  crmConfig: jsonb("crm_config").$type<Record<string, unknown>>().notNull().default({}),
});

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  /** Site slug / host segment for the Astro engine (e.g. acme or www). */
  subdomain: text("subdomain").notNull(),
  /** Page copy, SEO blobs, or Astro content pointers. */
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
});

export type TenantRow = typeof tenants.$inferSelect;
export type SiteRow = typeof sites.$inferSelect;
export type VerticalId = (typeof verticalEnum.enumValues)[number];
