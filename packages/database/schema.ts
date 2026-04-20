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
  "retail",
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
  "order_placed",
  "order_completed",
  "appointment_scheduled",
  "appointment_no_show",
  "event_booked",
  "event_waitlist_opened",
  "inventory_low",
  "gift_card_redeemed",
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

/** Stripe Connect onboarding status. */
export const stripeConnectStatusEnum = pgEnum("stripe_connect_status", [
  "not_started",
  "onboarding",
  "active",
  "restricted",
]);

/** Inventory stock type — drives ERP tracking behavior. */
export const stockTypeEnum = pgEnum("stock_type", [
  "stock",
  "non_stock",
  "special_order",
]);

/** Order lifecycle status. */
export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "refunded",
]);

/** Order fulfillment channel. */
export const orderTypeEnum = pgEnum("order_type", [
  "dine_in",
  "takeout",
  "delivery",
  "retail_pos",
  "ecommerce",
  "catering",
]);

/** Payment tendering method. */
export const paymentMethodEnum = pgEnum("payment_method", [
  "card",
  "cash",
  "check",
  "gift_card",
  "split",
]);

/** Appointment lifecycle status. */
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "no_show",
  "cancelled",
]);

/** Event booking status. */
export const eventBookingStatusEnum = pgEnum("event_booking_status", [
  "confirmed",
  "waitlisted",
  "cancelled",
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
 * Tenant registry.
 *
 * `clerk_org_id` remains the current canonical tenant key used by foreign-key
 * references (`tenant_id`) and RLS bindings. During the Stytch migration we
 * also persist `stytch_organization_id` for direct identity-provider mapping.
 *
 * Every row in other tables MUST have a matching tenantId.
 */
export const tenants = pgTable("tenants", {
  clerkOrgId: text("clerk_org_id").primaryKey(),
  stytchOrganizationId: text("stytch_organization_id").unique(),
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

  // ── STRIPE CONNECT ─────────────────────────────────────────────────
  /** Stripe Connected Account ID (Standard Connect). */
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeConnectStatus: stripeConnectStatusEnum("stripe_connect_status")
    .notNull()
    .default("not_started"),
  /** Platform fee in basis points (250 = 2.50%). Industry standard. */
  platformFeeBps: integer("platform_fee_bps").notNull().default(250),

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
    /** Latest Stripe subscription id for this prospect (retainer / subscription checkout). */
    stripeSubscriptionId: text("stripe_subscription_id"),
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
    sequenceId: uuid("sequence_id")
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

    /** Clerk user ID — null means visible to all org members. */
    userId: text("user_id"),

    title: text("title").notNull(),
    body: text("body").notNull(),

    /** Type: 'lead', 'ticket', 'payment', 'system', etc. */
    type: text("type").notNull(),

    /** Deep-link URL within admin, e.g. /admin/prospects/desi0012 */
    actionUrl: text("action_url"),

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
 * Notification preferences — per-user with admin-controlled mandatory minimums.
 * org:admin sets which events are mandatory (members can't turn them off).
 * Members choose their delivery channel (push/email/in_app) for non-mandatory events.
 */
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Clerk user ID — null row = org-wide default / mandatory baseline. */
    userId: text("user_id"),

    /** Event type: 'new_lead', 'ticket_created', 'payment_received', 'stage_change', 'daily_digest' */
    eventType: text("event_type").notNull(),

    /** Delivery channels enabled for this event. */
    emailEnabled: boolean("email_enabled").notNull().default(true),
    pushEnabled: boolean("push_enabled").notNull().default(true),
    inAppEnabled: boolean("in_app_enabled").notNull().default(true),

    /** When true, members cannot disable this event — admin-enforced minimum. */
    mandatory: boolean("mandatory").notNull().default(false),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_notif_prefs_tenant_user_event").on(
      table.tenantId,
      table.userId,
      table.eventType,
    ),
  ]
);

/**
 * ──────────────────────────────────────────────────────────────────────
 * REVENUE PIPELINE — Estimate → Contract → Invoice → Review
 * ──────────────────────────────────────────────────────────────────────
 */

/** Estimate / Proposal status flow. */
export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "expired",
]);

/** Contract signing status. */
export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "sent",
  "viewed",
  "signed",
  "voided",
]);

/** Invoice payment status. */
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "voided",
  "refunded",
]);

/** Line item on an estimate. */
export type EstimateLineItem = {
  id: string;
  /** Stripe Product ID (from PriceBook) — optional for custom line items. */
  stripeProductId?: string;
  name: string;
  description?: string;
  quantity: number;
  /** Unit price in cents. */
  unitPriceCents: number;
  /** 'one_time' | 'month' | 'year' */
  interval: string;
};

/**
 * Estimates & Proposals — quote builder tied to PriceBook + prospects.
 * Two modes: quick estimate (line items only) or long-form proposal (rich content).
 */
export const estimates = pgTable(
  "estimates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Human-readable estimate number (EST-0001). */
    estimateNumber: text("estimate_number").notNull(),

    /** References leads.prospectId (text, not FK for flexibility). */
    prospectId: text("prospect_id"),

    /** 'estimate' for quick line-item quotes, 'proposal' for rich content. */
    templateType: text("template_type").notNull().default("estimate"),

    status: estimateStatusEnum("status").notNull().default("draft"),

    /** Line items pulled from PriceBook or custom. */
    lineItems: jsonb("line_items")
      .$type<EstimateLineItem[]>()
      .notNull()
      .default([]),

    /** Long-form proposal rich content (HTML). */
    proposalContent: text("proposal_content"),

    /** Terms and conditions text. */
    terms: text("terms"),

    /** Total in cents (calculated from line items). */
    totalCents: integer("total_cents").notNull().default(0),

    /** Date the estimate was sent to the prospect. */
    sentAt: text("sent_at"),
    /** Expiration date for the estimate. */
    validUntil: text("valid_until"),
    /** When the prospect viewed it. */
    viewedAt: text("viewed_at"),

    /** Who created it (Clerk userId). */
    createdBy: text("created_by"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_estimates_tenant_id").on(table.tenantId),
    index("idx_estimates_prospect_id").on(table.prospectId),
    index("idx_estimates_status").on(table.status),
  ]
);

/**
 * Contracts — e-signature documents generated from estimates.
 * Captures full audit trail for ESIGN Act / UETA compliance:
 * intent, consent, association, IP, user agent, timestamp, document hash.
 */
export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Link back to estimate that generated this contract. */
    estimateId: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),

    /** Human-readable contract number (CTR-0001). */
    contractNumber: text("contract_number").notNull(),

    /** References leads.prospectId. */
    prospectId: text("prospect_id"),

    status: contractStatusEnum("contract_status").notNull().default("draft"),

    /** Full HTML content of the contract. */
    htmlContent: text("html_content").notNull(),

    // ── E-SIGN AUDIT TRAIL ──────────────────────────────────────────
    signerName: text("signer_name"),
    signerEmail: text("signer_email"),
    /** Base64-encoded signature image (drawn or typed). */
    signatureData: text("signature_data"),
    /** IP address at time of signing. */
    signerIp: text("signer_ip"),
    /** User-Agent at time of signing. */
    signerUserAgent: text("signer_user_agent"),
    /** SHA-256 hash of (htmlContent + signatureData + signedAt + signerIp). */
    certificateHash: text("certificate_hash"),
    /** Timestamp of signing (ISO 8601). */
    signedAt: text("signed_at"),
    /** Explicit consent flag — signer checked "I agree to sign electronically". */
    consentGiven: boolean("consent_given").notNull().default(false),

    sentAt: text("sent_at"),
    viewedAt: text("viewed_at"),

    createdBy: text("created_by"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_contracts_tenant_id").on(table.tenantId),
    index("idx_contracts_prospect_id").on(table.prospectId),
    index("idx_contracts_estimate_id").on(table.estimateId),
  ]
);

/**
 * Invoices — generated from signed contracts, paid via Stripe Connect.
 */
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Link to contract. */
    contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
    /** Direct link to estimate (denormalized for convenience). */
    estimateId: uuid("estimate_id").references(() => estimates.id, { onDelete: "set null" }),

    /** Human-readable invoice number (INV-0001). */
    invoiceNumber: text("invoice_number").notNull(),

    /** References leads.prospectId. */
    prospectId: text("prospect_id"),

    status: invoiceStatusEnum("invoice_status").notNull().default("draft"),

    /** Line items snapshot at time of invoice creation. */
    lineItems: jsonb("line_items")
      .$type<EstimateLineItem[]>()
      .notNull()
      .default([]),

    /** Total amount in cents. */
    totalCents: integer("total_cents").notNull().default(0),

    /** Due date. */
    dueDate: text("due_date"),

    // ── STRIPE ──────────────────────────────────────────────────────
    /** Stripe Checkout Session or Payment Intent ID. */
    stripeSessionId: text("stripe_session_id"),
    /** Stripe Payment Intent ID. */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** Stripe payment link URL (for secure pay links). */
    stripePaymentUrl: text("stripe_payment_url"),

    paidAt: text("paid_at"),
    sentAt: text("sent_at"),

    createdBy: text("created_by"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_invoices_tenant_id").on(table.tenantId),
    index("idx_invoices_prospect_id").on(table.prospectId),
    index("idx_invoices_status").on(table.status),
  ]
);

/**
 * Review requests — auto-generated after payment completion.
 * Default platform is Google; tenant can configure a custom review URL.
 */
export const reviewRequests = pgTable(
  "review_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Link to invoice that triggered the review request. */
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),

    /** References leads.prospectId. */
    prospectId: text("prospect_id"),

    /** Platform name: 'google', 'yelp', 'bbb', 'custom'. */
    platform: text("platform").notNull().default("google"),
    /** Direct review URL (Google Place ID link, Yelp page, or custom). */
    reviewUrl: text("review_url").notNull(),

    sentAt: text("sent_at"),
    /** When the client completed the review (manual or webhook). */
    completedAt: text("completed_at"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_review_requests_tenant_id").on(table.tenantId),
    index("idx_review_requests_prospect_id").on(table.prospectId),
  ]
);
/**
 * ──────────────────────────────────────────────────────────────────────
 * LIGHT ERP — Inventory, Menu, Orders (Restaurant / Retail / All)
 * ──────────────────────────────────────────────────────────────────────
 */

/**
 * Inventory items — Light ERP stock tracking.
 * stock_type drives tracking: 'stock' decrements, 'non_stock' skips, 'special_order' allows backorder.
 */
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    name: text("name").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    description: text("description"),

    stockType: stockTypeEnum("stock_type").notNull().default("stock"),
    stockCount: integer("stock_count").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    /** Cost of goods in cents — for margin tracking. */
    costOfGoodsCents: integer("cost_of_goods_cents").notNull().default(0),

    /** Stripe sync */
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),

    /** Image stored in R2 — URL only. */
    imageUrl: text("image_url"),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_inventory_items_tenant_id").on(table.tenantId),
    index("idx_inventory_items_sku").on(table.sku),
    index("idx_inventory_items_barcode").on(table.barcode),
  ]
);

/**
 * Item variants — Size/Color/etc for retail products.
 */
export const itemVariants = pgTable(
  "item_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),

    label: text("label").notNull(),
    sku: text("sku"),
    barcode: text("barcode"),
    priceCents: integer("price_cents").notNull().default(0),
    stockCount: integer("stock_count").notNull().default(0),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_item_variants_tenant_id").on(table.tenantId),
    index("idx_item_variants_inventory_item_id").on(table.inventoryItemId),
  ]
);

/**
 * Menu categories — groups for restaurant/bar menus.
 */
export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * Menu items — products synced to Stripe for POS + online ordering.
 */
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => menuCategories.id, { onDelete: "set null" }),
    inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }),

    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),

    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),

    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_menu_items_tenant_id").on(table.tenantId),
    index("idx_menu_items_category_id").on(table.categoryId),
  ]
);

/**
 * Menu modifiers — add-ons and options (e.g. "Add Bacon +$2").
 */
export const menuModifiers = pgTable("menu_modifiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),

  createdAt: text("created_at").notNull(),
});

/**
 * Orders — universal order record for POS, KDS, online, catering.
 * Supports split tendering (card/cash/check/gift_card).
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Human-readable order number (ORD-0001). */
    orderNumber: text("order_number").notNull(),
    /** References leads.prospectId (nullable for walk-ins). */
    prospectId: text("prospect_id"),

    status: orderStatusEnum("status").notNull().default("new"),
    orderType: orderTypeEnum("order_type").notNull().default("retail_pos"),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("card"),

    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    tipAmountCents: integer("tip_amount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),

    /** Cash tendering fields */
    cashTenderedCents: integer("cash_tendered_cents"),
    changeDueCents: integer("change_due_cents"),
    /** Check tendering */
    checkNumber: text("check_number"),

    /** Stripe */
    stripePaymentIntentId: text("stripe_payment_intent_id"),

    /** Restaurant-specific */
    tableId: uuid("table_id"),

    /** Staff who took the order (Clerk userId). */
    takenBy: text("taken_by"),
    notes: text("notes"),

    paidAt: text("paid_at"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_orders_tenant_id").on(table.tenantId),
    index("idx_orders_status").on(table.status),
    index("idx_orders_created_at").on(table.createdAt),
  ]
);

/**
 * Order items — line items with snapshotted price.
 */
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  menuItemId: uuid("menu_item_id"),
  inventoryItemId: uuid("inventory_item_id"),

  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),

  /** Selected modifiers snapshot */
  modifiers: jsonb("modifiers")
    .$type<Array<{ name: string; priceCents: number }>>()
    .notNull()
    .default([]),

  createdAt: text("created_at").notNull(),
});

/**
 * Restaurant tables / floor plan.
 */
export const restaurantTables = pgTable("restaurant_tables", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  tableNumber: text("table_number").notNull(),
  zone: text("zone"),
  seats: integer("seats").notNull().default(4),
  status: text("status").notNull().default("available"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * ──────────────────────────────────────────────────────────────────────
 * BOOKING — Appointments & Events (Agency, Service Pro, Wellness)
 * ──────────────────────────────────────────────────────────────────────
 */

/**
 * Appointments — universal booking (discovery calls, jobs, sessions).
 */
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** References leads.prospectId */
    prospectId: text("prospect_id"),
    prospectName: text("prospect_name"),
    prospectEmail: text("prospect_email"),

    title: text("title").notNull(),
    description: text("description"),

    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),

    status: appointmentStatusEnum("status").notNull().default("scheduled"),

    /** iCal RRULE for recurring appointments */
    recurrenceRule: text("recurrence_rule"),

    /** Assigned staff (Clerk userId) */
    assignedTo: text("assigned_to"),
    /** Location or address */
    location: text("location"),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_appointments_tenant_id").on(table.tenantId),
    index("idx_appointments_start_time").on(table.startTime),
    index("idx_appointments_status").on(table.status),
  ]
);

/**
 * Events — classes, catering, webinars, special events.
 * max_capacity drives "X seats remaining" urgency display.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    location: text("location"),
    imageUrl: text("image_url"),

    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),

    maxCapacity: integer("max_capacity"),
    /** Push to public website calendar? */
    isPublic: boolean("is_public").notNull().default(false),
    waitlistEnabled: boolean("waitlist_enabled").notNull().default(false),

    /** Price per ticket in cents (0 = free). */
    priceCents: integer("price_cents").notNull().default(0),

    /** Recurring event rule (iCal RRULE). */
    recurrenceRule: text("recurrence_rule"),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_events_tenant_id").on(table.tenantId),
    index("idx_events_start_time").on(table.startTime),
    index("idx_events_is_public").on(table.isPublic),
  ]
);

/**
 * Event bookings — tracks who booked + waitlist status.
 */
export const eventBookings = pgTable(
  "event_bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    prospectId: text("prospect_id"),
    prospectName: text("prospect_name").notNull(),
    prospectEmail: text("prospect_email").notNull(),

    status: eventBookingStatusEnum("status").notNull().default("confirmed"),
    /** Stripe Payment Intent for paid events. */
    stripePaymentIntentId: text("stripe_payment_intent_id"),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_event_bookings_tenant_id").on(table.tenantId),
    index("idx_event_bookings_event_id").on(table.eventId),
  ]
);

/**
 * ──────────────────────────────────────────────────────────────────────
 * CROSS-VERTICAL — Gift Cards, Loyalty, Memberships, Tax, Files, HW
 * ──────────────────────────────────────────────────────────────────────
 */

/** Gift cards — balance tracked in cents. */
export const giftCards = pgTable("gift_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  code: text("code").notNull(),
  initialBalanceCents: integer("initial_balance_cents").notNull(),
  currentBalanceCents: integer("current_balance_cents").notNull(),

  issuedToProspectId: text("issued_to_prospect_id"),
  issuedToEmail: text("issued_to_email"),

  isActive: boolean("is_active").notNull().default(true),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Loyalty points — ledger per prospect. */
export const loyaltyPoints = pgTable("loyalty_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  prospectId: text("prospect_id").notNull(),
  points: integer("points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),

  updatedAt: text("updated_at").notNull(),
});

/** Memberships — recurring packages tied to Stripe Subscriptions. */
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  prospectId: text("prospect_id").notNull(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  interval: text("interval").notNull().default("month"),

  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"),

  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Tax rates — per-tenant tax configuration. */
export const taxRates = pgTable("tax_rates", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  name: text("name").notNull(),
  /** Rate in basis points (e.g. 800 = 8.00%). */
  rateBps: integer("rate_bps").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** File attachments — URLs to Cloudflare R2 (images, PDFs, docs). */
export const fileAttachments = pgTable(
  "file_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    url: text("url").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),

    /** Polymorphic link: 'lead', 'order', 'event', 'appointment', 'contract' */
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),

    uploadedBy: text("uploaded_by"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_file_attachments_tenant_id").on(table.tenantId),
    index("idx_file_attachments_entity").on(table.entityType, table.entityId),
  ]
);

/** Hardware devices — registered Stripe Readers + PrintNode printers. */
export const hardwareDevices = pgTable("hardware_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

  /** 'stripe_reader', 'printnode_printer' */
  deviceType: text("device_type").notNull(),
  label: text("label").notNull(),
  /** External device ID (Stripe Reader ID or PrintNode Printer ID). */
  externalId: text("external_id").notNull(),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Time entries — clock in/out per job for Service Pro. */
export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),

    /** Clerk userId */
    userId: text("user_id").notNull(),
    /** References appointments.id or leads.prospectId */
    appointmentId: uuid("appointment_id"),
    prospectId: text("prospect_id"),

    clockIn: text("clock_in").notNull(),
    clockOut: text("clock_out"),
    /** Duration in minutes (calculated on clock-out). */
    durationMinutes: integer("duration_minutes"),
    notes: text("notes"),

    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_time_entries_tenant_id").on(table.tenantId),
    index("idx_time_entries_user_id").on(table.userId),
  ]
);

/** Returns — return/exchange records for retail + restaurant refunds. */
export const returns = pgTable(
  "returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.clerkOrgId, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    reason: text("reason"),
    /** 'refund', 'exchange', 'store_credit' */
    returnType: text("return_type").notNull().default("refund"),
    refundAmountCents: integer("refund_amount_cents").notNull().default(0),

    stripeRefundId: text("stripe_refund_id"),
    /** Restock inventory on return? */
    restocked: boolean("restocked").notNull().default(false),

    processedBy: text("processed_by"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_returns_tenant_id").on(table.tenantId),
    index("idx_returns_order_id").on(table.orderId),
  ]
);

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
export type NotificationPreferenceRow = typeof notificationPreferences.$inferSelect;
export type EstimateRow = typeof estimates.$inferSelect;
export type ContractRow = typeof contracts.$inferSelect;
export type InvoiceRow = typeof invoices.$inferSelect;
export type ReviewRequestRow = typeof reviewRequests.$inferSelect;

export type VerticalId = (typeof verticalTypeEnum.enumValues)[number];
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type AutomationTrigger = (typeof automationTriggerEnum.enumValues)[number];
export type AutomationActionType = (typeof automationActionTypeEnum.enumValues)[number];
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
export type StripeConnectStatus = (typeof stripeConnectStatusEnum.enumValues)[number];
export type EstimateStatus = (typeof estimateStatusEnum.enumValues)[number];
export type ContractStatus = (typeof contractStatusEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];
export type StockType = (typeof stockTypeEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type OrderType = (typeof orderTypeEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number];
export type EventBookingStatus = (typeof eventBookingStatusEnum.enumValues)[number];

/** CRM V1 Sprint — Row Types */
export type InventoryItemRow = typeof inventoryItems.$inferSelect;
export type ItemVariantRow = typeof itemVariants.$inferSelect;
export type MenuCategoryRow = typeof menuCategories.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
export type MenuModifierRow = typeof menuModifiers.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type RestaurantTableRow = typeof restaurantTables.$inferSelect;
export type AppointmentRow = typeof appointments.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type EventBookingRow = typeof eventBookings.$inferSelect;
export type GiftCardRow = typeof giftCards.$inferSelect;
export type LoyaltyPointsRow = typeof loyaltyPoints.$inferSelect;
export type MembershipRow = typeof memberships.$inferSelect;
export type TaxRateRow = typeof taxRates.$inferSelect;
export type FileAttachmentRow = typeof fileAttachments.$inferSelect;
export type HardwareDeviceRow = typeof hardwareDevices.$inferSelect;
export type TimeEntryRow = typeof timeEntries.$inferSelect;
export type ReturnRow = typeof returns.$inferSelect;

