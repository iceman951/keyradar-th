CREATE TABLE `editions` (
	`id` text PRIMARY KEY NOT NULL,
	`game_slug` text NOT NULL,
	`edition_key` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`steam_price_satang` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_slug`) REFERENCES `games`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editions_game_edition_key_idx` ON `editions` (`game_slug`,`edition_key`);--> statement-breakpoint
CREATE INDEX `editions_game_slug_idx` ON `editions` (`game_slug`);--> statement-breakpoint
CREATE TABLE `games` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`normalized_title` text NOT NULL,
	`year` integer NOT NULL,
	`developer` text NOT NULL,
	`publisher` text NOT NULL,
	`release_date` text NOT NULL,
	`genres_json` text NOT NULL,
	`review_percent` integer NOT NULL,
	`review_count` integer NOT NULL,
	`popularity` integer NOT NULL,
	`hue` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `games_normalized_title_idx` ON `games` (`normalized_title`);--> statement-breakpoint
CREATE INDEX `games_popularity_idx` ON `games` ("popularity" DESC);--> statement-breakpoint
CREATE TABLE `offers_current` (
	`id` text PRIMARY KEY NOT NULL,
	`game_slug` text NOT NULL,
	`edition_id` text NOT NULL,
	`store_id` text NOT NULL,
	`advertised_satang` integer NOT NULL,
	`fees_json` text NOT NULL,
	`final_satang` integer NOT NULL,
	`region` text NOT NULL,
	`region_status` text NOT NULL,
	`drm` text NOT NULL,
	`in_stock` integer NOT NULL,
	`observed_at` integer NOT NULL,
	`seller_rating_tenths` integer,
	`seller_review_count` integer,
	`is_historical_low` integer NOT NULL,
	`purchase_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_slug`) REFERENCES `games`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `offers_game_edition_price_idx` ON `offers_current` (`game_slug`,`edition_id`,`region_status`,`in_stock`,`final_satang`);--> statement-breakpoint
CREATE INDEX `offers_store_idx` ON `offers_current` (`store_id`);--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_slug` text NOT NULL,
	`edition_id` text NOT NULL,
	`observed_at` integer NOT NULL,
	`price_satang` integer NOT NULL,
	FOREIGN KEY (`game_slug`) REFERENCES `games`(`slug`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `price_history_unique_idx` ON `price_history` (`game_slug`,`edition_id`,`observed_at`);--> statement-breakpoint
CREATE INDEX `price_history_game_edition_time_idx` ON `price_history` (`game_slug`,`edition_id`,`observed_at`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`type` text NOT NULL,
	`payments_json` text NOT NULL,
	`fee_rate_bps` integer NOT NULL,
	`fee_label` text NOT NULL,
	`note` text NOT NULL,
	`website_url` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`records_received` integer DEFAULT 0 NOT NULL,
	`records_changed` integer DEFAULT 0 NOT NULL,
	`error_message` text
);
