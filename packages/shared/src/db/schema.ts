import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const leadSourceEnum = ["Audit_Form", "Contact_Form"] as const;
export type LeadSource = (typeof leadSourceEnum)[number];

export const leadStatusEnum = [
  "New",
  "Contacted",
  "Provisioning",
  "Closed",
] as const;
export type LeadStatus = (typeof leadStatusEnum)[number];

export const auditStatusEnum = [
  "New",
  "Reviewed",
  "Published"
] as const;
export type AuditStatus = (typeof auditStatusEnum)[number];

export const seoMetadataStatusEnum = [
  "Draft",
  "Published"
] as const;
export type SeoMetadataStatus = (typeof seoMetadataStatusEnum)[number];

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    company_name: text("company_name"),
    source: text("source", { enum: leadSourceEnum }).notNull(),
    status: text("status", { enum: leadStatusEnum }).notNull().default("New"),
    turnstile_passed: integer("turnstile_passed"),
    metadata: text("metadata"),
    created_at: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("leads_email_unique").on(t.email),
    index("leads_status_idx").on(t.status),
    index("leads_source_idx").on(t.source),
    index("leads_created_at_idx").on(t.created_at),
  ]
);

export const transactions = sqliteTable(
  "transactions",
  {
    stripe_session_id: text("stripe_session_id").primaryKey(),
    customer_email: text("customer_email"),
    amount_total: integer("amount_total"),
    plan_name: text("plan_name"),
    status: text("status"),
    lead_id: text("lead_id").references(() => leads.id),
    created_at: integer("created_at").notNull(),
  },
  (t) => [
    index("transactions_email_idx").on(t.customer_email),
    index("transactions_created_at_idx").on(t.created_at),
  ]
);

export const audits = sqliteTable(
  "audits",
  {
    id: text("id").primaryKey(),
    lead_id: text("lead_id").notNull(),
    content: text("content").notNull(),
    status: text("status", { enum: auditStatusEnum }).notNull().default("New"),
    created_at: integer("created_at").notNull(),
  }
);

export const seo_metadata = sqliteTable(
  "seo_metadata",
  {
    id: text("id").primaryKey(),
    page_url: text("page_url").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    keywords: text("keywords"),
    status: text("status", { enum: seoMetadataStatusEnum }).notNull().default("Draft"),
    created_at: integer("created_at").notNull(),
  }
);

// Type exports for schema tables
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
  lead: one(leads, {
    fields: [transactions.lead_id],
    references: [leads.id],
  }),
}));

export const leadsRelations = relations(leads, ({ many }) => ({
  transactions: many(transactions),
}));
