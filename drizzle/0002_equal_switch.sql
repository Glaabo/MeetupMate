CREATE TABLE `feed_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_events_user_group_date_uq` ON `feed_events` (`user_id`,`group_id`,`date`);--> statement-breakpoint
CREATE INDEX `feed_events_user_idx` ON `feed_events` (`user_id`);--> statement-breakpoint
DROP INDEX `availability_group_user_date_uq`;--> statement-breakpoint
DROP INDEX `availability_group_date_idx`;--> statement-breakpoint
ALTER TABLE `availability` ADD `ciphertext` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `availability_group_user_uq` ON `availability` (`group_id`,`user_id`);--> statement-breakpoint
ALTER TABLE `availability` DROP COLUMN `date`;--> statement-breakpoint
ALTER TABLE `availability` DROP COLUMN `status`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT 'calendar' NOT NULL,
	`match_threshold` integer DEFAULT 0 NOT NULL,
	`key_verifier` text,
	`created_by_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_groups`("id", "name", "emoji", "match_threshold", "key_verifier", "created_by_id", "created_at") SELECT "id", "name", "emoji", "match_threshold", NULL, "created_by_id", "created_at" FROM `groups`;--> statement-breakpoint
DROP TABLE `groups`;--> statement-breakpoint
ALTER TABLE `__new_groups` RENAME TO `groups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `groups_created_by_idx` ON `groups` (`created_by_id`);