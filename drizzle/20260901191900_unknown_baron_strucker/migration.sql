CREATE TABLE `allocation_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_allocation_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_allocation_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE `budget_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`duration_months` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `budget_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_period_id` integer NOT NULL,
	CONSTRAINT `fk_budget_plans_budget_period_id_budget_periods_id_fk` FOREIGN KEY (`budget_period_id`) REFERENCES `budget_periods`(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixed_expense_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_fixed_expense_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_fixed_expense_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`target_amount` integer NOT NULL,
	`target_date` text,
	`wallet_id` integer NOT NULL,
	`monthly_contribution` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_goals_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`)
);
--> statement-breakpoint
CREATE TABLE `income_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_income_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_income_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`theme_mode` text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `is_adjustment` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `time` text DEFAULT '' NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS `allocation_items_plan_idx`;--> statement-breakpoint
CREATE INDEX `allocation_items_plan_idx` ON `allocation_items` (`budget_plan_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `budget_periods_start_date_idx`;--> statement-breakpoint
CREATE INDEX `budget_periods_start_date_idx` ON `budget_periods` (`start_date`);--> statement-breakpoint
DROP INDEX IF EXISTS `budget_plans_period_idx`;--> statement-breakpoint
CREATE INDEX `budget_plans_period_idx` ON `budget_plans` (`budget_period_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `fixed_expense_items_plan_idx`;--> statement-breakpoint
CREATE INDEX `fixed_expense_items_plan_idx` ON `fixed_expense_items` (`budget_plan_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `goals_wallet_idx`;--> statement-breakpoint
CREATE INDEX `goals_wallet_idx` ON `goals` (`wallet_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `income_items_plan_idx`;--> statement-breakpoint
CREATE INDEX `income_items_plan_idx` ON `income_items` (`budget_plan_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_date_idx`;--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_wallet_idx`;--> statement-breakpoint
CREATE INDEX `transactions_wallet_idx` ON `transactions` (`wallet_id`);--> statement-breakpoint
DROP INDEX IF EXISTS `transactions_category_idx`;--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);
