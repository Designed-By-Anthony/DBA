-- Per-tenant Stripe linkage: subscription id for retainer flows (webhook + CRM display).
ALTER TABLE "public"."leads" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
