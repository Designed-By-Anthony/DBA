/**
 * Cloud SQL (PostgreSQL) — tenant + CRM registry.
 * @see packages/database/drizzle.config.ts — `pnpm exec drizzle-kit push` from this package.
 */
import { boolean, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

/** Industry / UX template — normalized for runtime routing decisions. */
export const verticalTypeEnum = pgEnum("vertical_type", [
  "restaurant",
  "service_pro",
  "florist",
  "agency",
]);

/**
 * Clerk-first tenant registry.
 * `clerk_org_id` is the canonical tenant key for all lookups.
 */
export const tenants = pgTable("tenants", {
  clerkOrgId: text("clerk_org_id").primaryKey(),
  name: text("name").notNull(),
  verticalType: verticalTypeEnum("vertical_type").notNull().default("agency"),
  /** Feature flags, theme, vertical-specific routing (JSON). */
  crmConfig: jsonb("crm_config").$type<Record<string, unknown>>().notNull().default({}),
});

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  /** Site slug / host segment for the Astro engine (e.g. acme or www). */
  subdomain: text("subdomain").notNull(),
  /** Page copy, SEO blobs, or Astro content pointers. */
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
});

/** Canonical CRM lead/prospect projection in SQL (Firestorm replacement path). */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailNormalized: text("email_normalized").notNull(),
  status: text("status").notNull().default("lead"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  trigger: text("trigger").notNull(),
  action: jsonb("action").$type<Record<string, unknown>>().notNull().default({}),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  adminReply: text("admin_reply"),
  messages: jsonb("messages")
    .$type<Array<{ id: string; from: "client" | "admin"; content: string; createdAt: string }>>()
    .notNull()
    .default([]),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  resolvedAt: text("resolved_at"),
  firstResponseAt: text("first_response_at"),
});

export const portalTokens = pgTable("portal_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
});

export const portalSessions = pgTable("portal_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  prospectId: text("prospect_id").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name").notNull(),
  sessionTokenHash: text("session_token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export type TenantRow = typeof tenants.$inferSelect;
export type SiteRow = typeof sites.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type VerticalId = (typeof verticalTypeEnum.enumValues)[number];
