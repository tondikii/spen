CREATE TABLE IF NOT EXISTS `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`is_savings` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`system_key` text,
	`type` text NOT NULL,
	`is_adjustment` integer DEFAULT false NOT NULL,
	`icon` text DEFAULT '◇' NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `budget_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`duration_months` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `budget_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_period_id` integer NOT NULL,
	CONSTRAINT `fk_budget_plans_budget_period_id_budget_periods_id_fk` FOREIGN KEY (`budget_period_id`) REFERENCES `budget_periods`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `goals` (
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
CREATE TABLE IF NOT EXISTS `income_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_income_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_income_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fixed_expense_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_fixed_expense_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_fixed_expense_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `allocation_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`budget_plan_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`target_amount` integer NOT NULL,
	CONSTRAINT `fk_allocation_items_budget_plan_id_budget_plans_id_fk` FOREIGN KEY (`budget_plan_id`) REFERENCES `budget_plans`(`id`),
	CONSTRAINT `fk_allocation_items_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `expense_items` (
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
CREATE TABLE IF NOT EXISTS `settings` (
	`id` integer PRIMARY KEY,
	`currency` text DEFAULT 'IDR' NOT NULL,
	`theme_mode` text DEFAULT 'light' NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`budget_start_day` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`type` text NOT NULL,
	`wallet_id` integer,
	`to_wallet_id` integer,
	`category_id` integer,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`time` text DEFAULT '' NOT NULL,
	`note` text,
	`is_initial` integer DEFAULT false NOT NULL,
	`admin_fee` integer DEFAULT 0 NOT NULL,
	`source_income_item_id` integer,
	`source_expense_item_id` integer,
	CONSTRAINT `fk_transactions_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`),
	CONSTRAINT `fk_transactions_to_wallet_id_wallets_id_fk` FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`),
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `goals_wallet_idx` ON `goals` (`wallet_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `allocation_items_plan_idx` ON `allocation_items` (`budget_plan_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `budget_periods_start_date_idx` ON `budget_periods` (`start_date`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `budget_plans_period_unique` ON `budget_plans` (`budget_period_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `expense_items_plan_idx` ON `expense_items` (`budget_plan_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `fixed_expense_items_plan_idx` ON `fixed_expense_items` (`budget_plan_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `income_items_plan_idx` ON `income_items` (`budget_plan_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_date_idx` ON `transactions` (`date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_wallet_idx` ON `transactions` (`wallet_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_to_wallet_idx` ON `transactions` (`to_wallet_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `transactions_category_idx` ON `transactions` (`category_id`);
