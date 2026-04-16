CREATE TYPE "public"."vertical_type" AS ENUM('restaurant', 'service_pro', 'florist', 'agency');--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger" text NOT NULL,
	"action" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"prospect_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_normalized" text NOT NULL,
	"status" text DEFAULT 'lead' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"prospect_id" text NOT NULL,
	"prospect_email" text NOT NULL,
	"prospect_name" text NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"prospect_id" text NOT NULL,
	"prospect_email" text NOT NULL,
	"prospect_name" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"used_at" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"subdomain" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"clerk_org_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"vertical_type" "vertical_type" DEFAULT 'agency' NOT NULL,
	"crm_config" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"prospect_id" text NOT NULL,
	"prospect_email" text NOT NULL,
	"prospect_name" text NOT NULL,
	"subject" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"admin_reply" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"resolved_at" text,
	"first_response_at" text
);
--> statement-breakpoint
ALTER TABLE "automations" ADD CONSTRAINT "automations_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_tokens" ADD CONSTRAINT "portal_tokens_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenant_id_tenants_clerk_org_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("clerk_org_id") ON DELETE cascade ON UPDATE no action;