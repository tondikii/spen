CREATE TABLE `expense_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_expense_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_expense_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `locale` text DEFAULT 'id' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`theme_mode` text DEFAULT 'light' NOT NULL,
	`locale` text DEFAULT 'id' NOT NULL,
	`budget_start_day` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings`(`id`, `currency`, `theme_mode`, `budget_start_day`) SELECT `id`, `currency`, `theme_mode`, `budget_start_day` FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `expense_items_plan_idx` ON `expense_items` (`budget_plan_id`);--> statement-breakpoint
CREATE INDEX `transactions_to_wallet_idx` ON `transactions` (`to_wallet_id`);