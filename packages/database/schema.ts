/**
 * Postgres (Neon in production) — tenant + CRM registry with RLS enforcement.
 * @see packages/database/drizzle.config.ts — `pnpm exec drizzle-kit push` from this package.
 *
 * Multi-tenant CRM schema for service professionals, restaurants, agencies, wellness.
 * Clerk organizations are the tenant boundary. RLS policies enforce tenant_id checks
 * via `app.current_tenant_id` session variable.
 */
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * ──────────────────────────────────────────────────────────────────────
 * ENUMS
 * ──────────────────────────────────────────────────────────────────────
 */

/** Industry / UX template — normalized for runtime routing decisions. */
export const verticalTypeEnum = pgEnum("vertical_type", [
  "agency",
  "service_pro",
  "restaurant",
  "wellness",
]);

/** Lead status workflow — pipeline progression. */
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "proposal",
  "active",
  "completed",
  "lost",
]);

/** Support ticket status workflow. */
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

/** Support ticket priority levels. */
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

/** Automation trigger events. */
export const automationTriggerEnum = pgEnum("automation_trigger", [
  "lead_created",
  "lead_status_changed",
  "ticket_created",
  "ticket_resolved",
  "email_sent",
  "payment_received",
  "tag_added",
]);

/** Automation action types. */
export const automationActionTypeEnum = pgEnum("automation_action_type", [
  "send_email",
  "change_status",
  "add_tag",
  "remove_tag",
  "create_task",
  "send_notification",
  "webhook",
]);

/** Notification delivery channels. */
export const notificationChannelEnum = pgEnum("notification_channel", [
  "push",
  "email",
  "in_app",
]);

export type TenantDomainStatus =
  | "pending"
  | "verified"
  | "failed"
  | "temporary_failure"
  | "not_started";

export type TenantDomainDnsRecord = {
  group: "verification" | "dkim" | "dmarc" | "receiving";
  record: string;
  name: string;
  type: "TXT" | "CNAME" | "MX";
  value: string;
  ttl?: string;
  status?: TenantDomainStatus;
  priority?: number;
};

/**
 * ──────────────────────────────────────────────────────────────────────
 * CORE TABLES
 * ──────────────────────────────────────────────────────────────────────
 */

/**
 * Clerk-first tenant registry.
 * `clerk_org_id` is the canonical tenant key for all lookups.
 * Every row in other tables MUST have a matching tenantId.
 */
export const tenants = pgTable("tenants", {
  clerkOrgId: text("clerk_org_id").primaryKey(),
  name: text("name").notNull(),
  verticalType: verticalTypeEnum("vertical_type").notNull().default("agency"),

  // ── BRANDING ────────────────────────────────────────────────────────
  brandColor: text("brand_color").default("#2563eb"),
  brandLogoUrl: text("brand_logo_url"),

  // ── COMMUNICATION ───────────────────────────────────────────────────
  replyFromEmail: text("reply_from_email"),
  replyFromName: text("reply_from_name"),
  supportEmail: text("support_email"),
  physicalAddress: text("physical_address"),

  // ── CONFIGURATION ───────────────────────────────────────────────────
  /** Pipeline stages: [{id, label, color, probability, order}] */
  pipelineStages: jsonb("pipeline_stages")
    .$type<Array<{ id: string; label: string; color: string; probability: number; order: number }>>()
    .notNull()
    .default([]),

  /** Deal source options: ["marketing", "referral", ...] */
  dealSources: jsonb("deal_sources")
    .$type<string[]>()
    .notNull()
    .default([]),

  /** Notification preferences: {emailOnNewLead, pushEnabled, ...} */
  notificationPrefs: jsonb("notification_prefs")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),

  /** Feature flags, theme, vertical-specific routing (JSON). */
  crmConfig: jsonb("crm_config")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),

  // ── WEB PUSH VAPID ──────────────────────────────────────────────────
  vapidPublicKey: text("vapid_public_key"),
  vapidPrivateKey: text("vapid_private_key"),

  // ── CLOUDFLARE ──────────────────────────────────────────────────────
  /**
   * Cloudflare zone ID this tenant's hostnames live under.
   * Nullable — tenants that aren't fronted by Cloudflare leave this blank.
   */
  cloudflareZoneId: text("cloudflare_zone_id"),

  /**
   * Apex hostname this tenant's zone covers (e.g. "acme.example.com").
   * Used as a trust anchor when an admin route creates or mutates a record.
   */
  cloudflareApexHostname: text("cloudflare_apex_hostname"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Multi-tenant CRM lead/prospect record.
 * Polymorphic schema: core fields in fixed columns, vertical-specific in metadata JSONB.
 *
 * Zero-Trust Multi-Tenancy: Every query MUST filter on `tenantId`.
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Human-readable prospect id used in URLs + CRM UI (`desi0001`). */
    prospectId: text("prospect_id").notNull(),

    // ── IDENTITY ────────────────────────────────────────────────────
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    phone: text("phone"),

    // ── COMPANY / CONTEXT ────────────────────────────────────────────
    company: text("company"),
    website: text("website"),

    // ── WORKFLOW ────────────────────────────────────────────────────
    /** Lead origin tag: 'marketing_site', 'qr-code', 'facebook', etc. */
    source: text("source"),
    status: text("status").notNull().default("new"),

    // ── DEAL ────────────────────────────────────────────────────────
    /** Value in cents for financial tracking */
    dealValue: integer("deal_value").notNull().default(0),
    notes: text("notes"),
    tags: jsonb("tags")
      .$type<string[]>()
      .notNull()
      .default([]),
    assignedTo: text("assigned_to"),
    lastContactedAt: text("last_contacted_at"),

    // ── ENGAGEMENT ──────────────────────────────────────────────────
    unsubscribed: boolean("unsubscribed").notNull().default(false),
    leadScore: integer("lead_score").notNull().default(0),
    healthStatus: text("health_status").notNull().default("healthy"),

    // ── ASSETS ──────────────────────────────────────────────────────
    targetUrl: text("target_url"),
    stagingUrl: text("staging_url"),
    contractDocUrl: text("contract_doc_url"),
    driveFolderUrl: text("drive_folder_url"),

    // ── CONTRACT ────────────────────────────────────────────────────
    contractSigned: boolean("contract_signed").notNull().default(false),
    contractStatus: text("contract_status").notNull().default("draft"),

    // ── PAYMENT ────────────────────────────────────────────────────
    stripeCustomerId: text("stripe_customer_id"),
    pricingTier: text("pricing_tier"),

    // ── PROJECT ────────────────────────────────────────────────────
    projectNotes: text("project_notes"),

    // ── NOTIFICATIONS ──────────────────────────────────────────────
    fcmToken: text("fcm_token"),

    // ── VERTICAL-SPECIFIC ──────────────────────────────────────────
    /**
     * Vertical-specific payload — e.g. service-pro dispatch state + geo,
     * restaurant order/table info, retail SKU/loyalty fields, agency audit scores.
     * Strictly validated at the edge before insert/update.
     */
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_leads_tenant_id").on(table.tenantId),
    index("idx_leads_email_normalized").on(table.emailNormalized),
    index("idx_leads_status").on(table.status),
    index("idx_leads_created_at").on(table.createdAt),
  ]
);

/**
 * Activity timeline — events per lead.
 * Tracks interactions, status changes, email opens, etc.
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** References leads.prospectId (not FK — text-based for denormalization) */
    leadId: text("lead_id").notNull(),

    type: text("type").notNull(), // 'email_sent', 'status_change', 'note', 'call', etc.
    title: text("title").notNull(),
    description: text("description"),

    /** Additional data: email open details, metadata, etc. */
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_activities_tenant_id").on(table.tenantId),
    index("idx_activities_lead_id").on(table.leadId),
  ]
);

/**
 * Email history — full record of sent/scheduled emails.
 */
export const emails = pgTable(
  "emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** References leads.prospectId */
    leadId: text("lead_id").notNull(),
    leadEmail: text("lead_email").notNull(),
    leadName: text("lead_name"),

    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull(),

    status: text("status").notNull().default("sent"), // 'draft', 'scheduled', 'sent', 'failed'
    scheduledAt: text("scheduled_at"),
    sentAt: text("sent_at"),

    /** Third-party email service ID (e.g. Resend) */
    resendId: text("resend_id"),

    /** Engagement metrics */
    opens: integer("opens").notNull().default(0),
    clicks: jsonb("clicks")
      .$type<Array<{ url: string; count: number; clickedAt: string }>>()
      .notNull()
      .default([]),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_emails_tenant_id").on(table.tenantId),
    index("idx_emails_lead_id").on(table.leadId),
  ]
);

/**
 * Tenant email domains — Resend-managed sending identities.
 *
 * Zero-Trust Multi-Tenancy: every query MUST filter on `tenantId`, and RLS
 * also enforces `tenant_id = app.current_tenant_id`.
 */
export const tenantDomains = pgTable(
  "tenant_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    domainName: text("domain_name").notNull(),
    resendId: text("resend_id").notNull(),
    status: text("status").$type<TenantDomainStatus>().notNull().default("pending"),
    records: jsonb("records")
      .$type<TenantDomainDnsRecord[]>()
      .notNull()
      .default([]),
    lastCheckedAt: text("last_checked_at"),
    verifiedAt: text("verified_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("uniq_tenant_domains_tenant_domain").on(table.tenantId, table.domainName),
    uniqueIndex("uniq_tenant_domains_tenant_resend").on(table.tenantId, table.resendId),
    index("idx_tenant_domains_tenant_status").on(table.tenantId, table.status),
  ],
);

/**
 * Email sequences — automation for multi-step campaigns.
 */
export const emailSequences = pgTable("email_sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),

  /** Steps: [{delayDays: 0, subject: "...", bodyHtml: "..."}] */
  steps: jsonb("steps")
    .$type<
      Array<{
        delayDays: number;
        subject: string;
        bodyHtml: string;
      }>
    >()
    .notNull()
    .default([]),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Sequence enrollments — lead membership in email sequences.
 */
export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** References leads.prospectId */
    leadId: text("lead_id"),

    /** References emailSequences.id */
    sequenceId: text("sequence_id")
      .notNull()
      .references(() => emailSequences.id, { onDelete: "cascade" }),

    stepIndex: integer("step_index").notNull().default(0),
    status: text("status").notNull().default("active"), // 'active', 'paused', 'completed'
    nextRunAt: text("next_run_at"),

    enrolledAt: text("enrolled_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  }
);

/**
 * Automations — event-driven workflows.
 */
export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),

  trigger: automationTriggerEnum("trigger").notNull(),

  /**
   * Optional Zod-validated predicate.
   * {} / null means "always true" — i.e. fire on every matching trigger.
   */
  condition: jsonb("condition")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),

  /** Strict per-action-type schema lives in @dba/automation. */
  action: jsonb("action")
    .$type<Record<string, unknown>>()
    .notNull(),

  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Tasks — CRM reminders and action items.
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  /** References leads.prospectId (nullable for org-level tasks) */
  leadId: text("lead_id"),

  title: text("title").notNull(),
  dueAt: text("due_at"),
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at"),
  assignedTo: text("assigned_to"),
  priority: text("priority").notNull().default("medium"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Support tickets — client-initiated requests from portal.
 */
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** References leads.prospectId */
    leadId: text("lead_id").notNull(),
    leadEmail: text("lead_email").notNull(),
    leadName: text("lead_name").notNull(),

    subject: text("subject").notNull(),
    description: text("description").notNull().default(""),

    status: ticketStatusEnum("status").notNull().default("open"),
    priority: ticketPriorityEnum("priority").notNull().default("medium"),

    adminReply: text("admin_reply"),

    /** Messages: [{id, from: 'client'|'admin', content, createdAt}] */
    messages: jsonb("messages")
      .$type<
        Array<{
          id: string;
          from: "client" | "admin";
          content: string;
          createdAt: string;
        }>
      >()
      .notNull()
      .default([]),

    firstResponseAt: text("first_response_at"),
    resolvedAt: text("resolved_at"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_tickets_tenant_id").on(table.tenantId),
    index("idx_tickets_status").on(table.status),
  ]
);

/**
 * Notifications — in-app notification center.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    title: text("title").notNull(),
    body: text("body").notNull(),

    /** Type: 'lead', 'ticket', 'payment', 'system', etc. */
    type: text("type").notNull(),

    /** FK reference: e.g. lead ID or ticket ID */
    referenceId: text("reference_id"),
    referenceType: text("reference_type"),

    isRead: boolean("is_read").notNull().default(false),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_notifications_tenant_id_is_read").on(table.tenantId, table.isRead),
  ]
);

/**
 * Push subscriptions — Web Push API for in-app notifications.
 * No FCM — pure Web Push standard.
 */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Clerk user ID */
    userId: text("user_id").notNull(),

    /** Web Push API endpoint */
    endpoint: text("endpoint").notNull(),

    /** VAPID: public key component */
    p256dh: text("p256dh").notNull(),

    /** VAPID: auth token component */
    auth: text("auth").notNull(),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_push_subscriptions_tenant_user").on(table.tenantId, table.userId),
  ]
);

/**
 * Portal tokens — one-time access tokens for lead portals.
 */
export const portalTokens = pgTable("portal_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  /** References leads.prospectId */
  prospectId: text("prospect_id").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name").notNull(),

  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  usedAt: text("used_at"),

  createdAt: text("created_at").notNull(),
});

/**
 * Portal sessions — session state for lead portal access.
 */
export const portalSessions = pgTable("portal_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  /** References leads.prospectId */
  prospectId: text("prospect_id").notNull(),
  prospectEmail: text("prospect_email").notNull(),
  prospectName: text("prospect_name").notNull(),

  sessionTokenHash: text("session_token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),

  createdAt: text("created_at").notNull(),
});

/**
 * Sites — landing pages and subdomains per tenant.
 */
export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  /** Site slug / host segment for the Astro engine (e.g. acme or www). */
  subdomain: text("subdomain").notNull(),

  /** Page copy, SEO blobs, or Astro content pointers. */
  content: jsonb("content")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
});

/**
 * ──────────────────────────────────────────────────────────────────────
 * EXPORTED TYPES
 * ──────────────────────────────────────────────────────────────────────
 */

export type TenantRow = typeof tenants.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
export type EmailRow = typeof emails.$inferSelect;
export type TenantDomainRow = typeof tenantDomains.$inferSelect;
export type EmailSequenceRow = typeof emailSequences.$inferSelect;
export type SequenceEnrollmentRow = typeof sequenceEnrollments.$inferSelect;
export type AutomationRow = typeof automations.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type PortalTokenRow = typeof portalTokens.$inferSelect;
export type PortalSessionRow = typeof portalSessions.$inferSelect;
export type SiteRow = typeof sites.$inferSelect;

export type VerticalId = (typeof verticalTypeEnum.enumValues)[number];
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type AutomationTrigger = (typeof automationTriggerEnum.enumValues)[number];
export type AutomationActionType = (typeof automationActionTypeEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
