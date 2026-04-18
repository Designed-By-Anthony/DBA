/**
 * Full CRM schema with RLS enforcement.
 *
 * Multi-tenant architecture:
 * - Tenants are Clerk organizations (clerk_org_id)
 * - RLS policies enforce tenant_id checks via app.current_tenant_id session variable
 * - All tables include tenant_id and are protected by RLS
 *
 * Execution flow:
 * 1. Create enums
 * 2. Create tables with foreign keys
 * 3. Create indexes
 * 4. Enable and configure RLS
 * 5. Create helper functions
 * 6. Create updated_at triggers
 */

-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE "public"."vertical_type" AS ENUM(
  'agency',
  'service_pro',
  'restaurant',
  'wellness'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."lead_status" AS ENUM(
  'new',
  'contacted',
  'proposal',
  'active',
  'completed',
  'lost'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."ticket_status" AS ENUM(
  'open',
  'in_progress',
  'resolved',
  'closed'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."ticket_priority" AS ENUM(
  'low',
  'medium',
  'high',
  'urgent'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."automation_trigger" AS ENUM(
  'lead_created',
  'lead_status_changed',
  'ticket_created',
  'ticket_resolved',
  'email_sent',
  'payment_received',
  'tag_added'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."automation_action_type" AS ENUM(
  'send_email',
  'change_status',
  'add_tag',
  'remove_tag',
  'create_task',
  'send_notification',
  'webhook'
) ON CONFLICT DO NOTHING;

CREATE TYPE "public"."notification_channel" AS ENUM(
  'push',
  'email',
  'in_app'
) ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────────────────
-- TENANTS TABLE (already exists, but ensure all columns)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."tenants" (
  "clerk_org_id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "vertical_type" "vertical_type" DEFAULT 'agency' NOT NULL,
  "brand_color" text DEFAULT '#2563eb',
  "brand_logo_url" text,
  "reply_from_email" text,
  "reply_from_name" text,
  "support_email" text,
  "physical_address" text,
  "pipeline_stages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "deal_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "crm_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "vapid_public_key" text,
  "vapid_private_key" text,
  "cloudflare_zone_id" text,
  "cloudflare_apex_hostname" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- Add missing columns to tenants if they don't exist
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "brand_color" text DEFAULT '#2563eb';
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "brand_logo_url" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "reply_from_email" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "reply_from_name" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "support_email" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "physical_address" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "pipeline_stages" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "deal_sources" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "notification_prefs" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "vapid_public_key" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "vapid_private_key" text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "created_at" text NOT NULL DEFAULT now()::text;
ALTER TABLE "public"."tenants" ADD COLUMN IF NOT EXISTS "updated_at" text NOT NULL DEFAULT now()::text;

-- ────────────────────────────────────────────────────────────────────────────
-- LEADS TABLE (already exists, but ensure all columns)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "prospect_id" text NOT NULL,
  "name" text NOT NULL,
  "first_name" text,
  "last_name" text,
  "email" text NOT NULL,
  "email_normalized" text NOT NULL,
  "phone" text,
  "company" text,
  "website" text,
  "target_url" text,
  "source" text,
  "status" text NOT NULL DEFAULT 'new',
  "deal_value" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "assigned_to" text,
  "last_contacted_at" text,
  "unsubscribed" boolean DEFAULT false NOT NULL,
  "lead_score" integer DEFAULT 0 NOT NULL,
  "health_status" text DEFAULT 'healthy' NOT NULL,
  "staging_url" text,
  "contract_doc_url" text,
  "drive_folder_url" text,
  "contract_signed" boolean DEFAULT false NOT NULL,
  "contract_status" text DEFAULT 'draft' NOT NULL,
  "stripe_customer_id" text,
  "pricing_tier" text,
  "project_notes" text,
  "fcm_token" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- Add missing columns to leads
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "last_name" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "company" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "target_url" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "deal_value" integer DEFAULT 0;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "assigned_to" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "last_contacted_at" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "unsubscribed" boolean DEFAULT false;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "lead_score" integer DEFAULT 0;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "health_status" text DEFAULT 'healthy';
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "staging_url" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "contract_doc_url" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "drive_folder_url" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "contract_signed" boolean DEFAULT false;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "contract_status" text DEFAULT 'draft';
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "pricing_tier" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "project_notes" text;
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "fcm_token" text;

-- ────────────────────────────────────────────────────────────────────────────
-- ACTIVITIES TABLE (timeline events per lead)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "lead_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- EMAILS TABLE (full email history)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."emails" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "lead_id" text NOT NULL,
  "lead_email" text NOT NULL,
  "lead_name" text,
  "subject" text NOT NULL,
  "body_html" text NOT NULL,
  "status" text DEFAULT 'sent' NOT NULL,
  "scheduled_at" text,
  "sent_at" text,
  "resend_id" text,
  "opens" integer DEFAULT 0 NOT NULL,
  "clicks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- EMAIL_SEQUENCES TABLE (automation for multi-step campaigns)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."email_sequences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- SEQUENCE_ENROLLMENTS TABLE (lead membership in email sequences)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."sequence_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "lead_id" text,
  "sequence_id" text NOT NULL REFERENCES "public"."email_sequences"("id") ON DELETE cascade,
  "step_index" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "next_run_at" text,
  "enrolled_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- AUTOMATIONS TABLE (event-driven workflows)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."automations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "trigger" "automation_trigger" NOT NULL,
  "condition" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "action" jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- Add missing columns to automations (if migrating from old schema)
ALTER TABLE "public"."automations" ADD COLUMN IF NOT EXISTS "condition" jsonb DEFAULT '{}'::jsonb;

-- ────────────────────────────────────────────────────────────────────────────
-- TASKS TABLE (CRM tasks/reminders)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "lead_id" text,
  "title" text NOT NULL,
  "due_at" text,
  "completed" boolean DEFAULT false NOT NULL,
  "completed_at" text,
  "assigned_to" text,
  "priority" text DEFAULT 'medium' NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- TICKETS TABLE (support tickets from portal)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "lead_id" text NOT NULL,
  "lead_email" text NOT NULL,
  "lead_name" text NOT NULL,
  "subject" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" "ticket_status" DEFAULT 'open' NOT NULL,
  "priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
  "admin_reply" text,
  "messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "first_response_at" text,
  "resolved_at" text,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);

-- Add missing columns to tickets (if migrating)
ALTER TABLE "public"."tickets" ADD COLUMN IF NOT EXISTS "lead_id" text;
ALTER TABLE "public"."tickets" ADD COLUMN IF NOT EXISTS "lead_email" text;
ALTER TABLE "public"."tickets" ADD COLUMN IF NOT EXISTS "lead_name" text;

-- ────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS TABLE (in-app notification center)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "type" text NOT NULL,
  "reference_id" text,
  "reference_type" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- PUSH_SUBSCRIPTIONS TABLE (Web Push API)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "user_id" text NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- PORTAL_TOKENS TABLE (one-time access tokens)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."portal_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "prospect_id" text NOT NULL,
  "prospect_email" text NOT NULL,
  "prospect_name" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" text NOT NULL,
  "used" boolean DEFAULT false NOT NULL,
  "used_at" text,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- PORTAL_SESSIONS TABLE (session state for lead portal)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."portal_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "prospect_id" text NOT NULL,
  "prospect_email" text NOT NULL,
  "prospect_name" text NOT NULL,
  "session_token_hash" text NOT NULL,
  "expires_at" text NOT NULL,
  "created_at" text NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- SITES TABLE (landing pages and subdomains)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."sites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade,
  "subdomain" text NOT NULL,
  "content" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- ────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────────────────

-- Leads indexes
CREATE INDEX IF NOT EXISTS "idx_leads_tenant_id" ON "public"."leads"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_leads_email_normalized" ON "public"."leads"("email_normalized");
CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "public"."leads"("status");
CREATE INDEX IF NOT EXISTS "idx_leads_created_at_desc" ON "public"."leads"("created_at" DESC);

-- Emails indexes
CREATE INDEX IF NOT EXISTS "idx_emails_tenant_id" ON "public"."emails"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_emails_lead_id" ON "public"."emails"("lead_id");

-- Activities indexes
CREATE INDEX IF NOT EXISTS "idx_activities_tenant_id" ON "public"."activities"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_activities_lead_id" ON "public"."activities"("lead_id");

-- Tickets indexes
CREATE INDEX IF NOT EXISTS "idx_tickets_tenant_id" ON "public"."tickets"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tickets_status" ON "public"."tickets"("status");

-- Notifications indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_tenant_is_read" ON "public"."notifications"("tenant_id", "is_read");

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_tenant_user" ON "public"."push_subscriptions"("tenant_id", "user_id");

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) SETUP
-- ────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."email_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sequence_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."automations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."portal_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."portal_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sites" ENABLE ROW LEVEL SECURITY;

-- Tenants RLS: Isolate by clerk_org_id
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON "public"."tenants";
CREATE POLICY "tenant_isolation_tenants" ON "public"."tenants"
  USING (clerk_org_id = current_setting('app.current_tenant_id', true));

-- Leads RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_leads" ON "public"."leads";
CREATE POLICY "tenant_isolation_leads" ON "public"."leads"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Activities RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_activities" ON "public"."activities";
CREATE POLICY "tenant_isolation_activities" ON "public"."activities"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Emails RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_emails" ON "public"."emails";
CREATE POLICY "tenant_isolation_emails" ON "public"."emails"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Email Sequences RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_email_sequences" ON "public"."email_sequences";
CREATE POLICY "tenant_isolation_email_sequences" ON "public"."email_sequences"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Sequence Enrollments RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_sequence_enrollments" ON "public"."sequence_enrollments";
CREATE POLICY "tenant_isolation_sequence_enrollments" ON "public"."sequence_enrollments"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Automations RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_automations" ON "public"."automations";
CREATE POLICY "tenant_isolation_automations" ON "public"."automations"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Tasks RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_tasks" ON "public"."tasks";
CREATE POLICY "tenant_isolation_tasks" ON "public"."tasks"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Tickets RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_tickets" ON "public"."tickets";
CREATE POLICY "tenant_isolation_tickets" ON "public"."tickets"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Notifications RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_notifications" ON "public"."notifications";
CREATE POLICY "tenant_isolation_notifications" ON "public"."notifications"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Push Subscriptions RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_push_subscriptions" ON "public"."push_subscriptions";
CREATE POLICY "tenant_isolation_push_subscriptions" ON "public"."push_subscriptions"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Portal Tokens RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_portal_tokens" ON "public"."portal_tokens";
CREATE POLICY "tenant_isolation_portal_tokens" ON "public"."portal_tokens"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Portal Sessions RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_portal_sessions" ON "public"."portal_sessions";
CREATE POLICY "tenant_isolation_portal_sessions" ON "public"."portal_sessions"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Sites RLS: Isolate by tenant_id
DROP POLICY IF EXISTS "tenant_isolation_sites" ON "public"."sites";
CREATE POLICY "tenant_isolation_sites" ON "public"."sites"
  USING (tenant_id = current_setting('app.current_tenant_id', true));

-- ────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTION: Set tenant ID session variable
-- ────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS "public"."set_tenant_id"(text);
CREATE OR REPLACE FUNCTION "public"."set_tenant_id"(p_tenant_id text) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

-- Create the trigger function (once for all tables)
DROP FUNCTION IF EXISTS "public"."update_updated_at_column"() CASCADE;
CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now()::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tenants trigger
DROP TRIGGER IF EXISTS "update_tenants_updated_at" ON "public"."tenants";
CREATE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Leads trigger
DROP TRIGGER IF EXISTS "update_leads_updated_at" ON "public"."leads";
CREATE TRIGGER "update_leads_updated_at" BEFORE UPDATE ON "public"."leads"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Email sequences trigger
DROP TRIGGER IF EXISTS "update_email_sequences_updated_at" ON "public"."email_sequences";
CREATE TRIGGER "update_email_sequences_updated_at" BEFORE UPDATE ON "public"."email_sequences"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Sequence enrollments trigger
DROP TRIGGER IF EXISTS "update_sequence_enrollments_updated_at" ON "public"."sequence_enrollments";
CREATE TRIGGER "update_sequence_enrollments_updated_at" BEFORE UPDATE ON "public"."sequence_enrollments"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Automations trigger
DROP TRIGGER IF EXISTS "update_automations_updated_at" ON "public"."automations";
CREATE TRIGGER "update_automations_updated_at" BEFORE UPDATE ON "public"."automations"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Tasks trigger
DROP TRIGGER IF EXISTS "update_tasks_updated_at" ON "public"."tasks";
CREATE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Tickets trigger
DROP TRIGGER IF EXISTS "update_tickets_updated_at" ON "public"."tickets";
CREATE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."tickets"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
