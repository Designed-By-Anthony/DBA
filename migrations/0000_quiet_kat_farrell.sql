CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`company_name` text,
	`source` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`turnstile_passed` integer,
	`metadata` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_email_unique` ON `leads` (`email`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_source_idx` ON `leads` (`source`);--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`stripe_session_id` text PRIMARY KEY NOT NULL,
	`customer_email` text,
	`amount_total` integer,
	`plan_name` text,
	`status` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transactions_email_idx` ON `transactions` (`customer_email`);--> statement-breakpoint
CREATE INDEX `transactions_created_at_idx` ON `transactions` (`created_at`);