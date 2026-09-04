ALTER TABLE `settings` ADD `locale` text DEFAULT 'id' NOT NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_settings` (`id` integer PRIMARY KEY, `currency` text DEFAULT 'IDR' NOT NULL, `theme_mode` text DEFAULT 'light' NOT NULL, `locale` text DEFAULT 'id' NOT NULL, `budget_start_day` integer DEFAULT 1 NOT NULL);
--> statement-breakpoint
INSERT INTO `__new_settings`(`id`, `currency`, `theme_mode`, `locale`, `budget_start_day`) SELECT `id`, `currency`, `theme_mode`, 'id', `budget_start_day` FROM `settings`;
--> statement-breakpoint
DROP TABLE `settings`;
--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
