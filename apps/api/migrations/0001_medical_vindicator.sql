CREATE TABLE `audits` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'New' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seo_metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`page_url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`keywords` text,
	`status` text DEFAULT 'Draft' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seo_metadata_page_url_unique` ON `seo_metadata` (`page_url`);