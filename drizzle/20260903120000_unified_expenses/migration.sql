CREATE TABLE `expense_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_plan_id` integer NOT NULL REFERENCES `budget_plans`(`id`),
	`name` text NOT NULL,
	`category_id` integer NOT NULL REFERENCES `categories`(`id`),
	`target_amount` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expense_items_plan_idx` ON `expense_items` (`budget_plan_id`);
--> statement-breakpoint
INSERT INTO `expense_items` (`budget_plan_id`, `name`, `category_id`, `target_amount`)
SELECT `budget_plan_id`, `name`, `category_id`, `target_amount` FROM `fixed_expense_items`;
--> statement-breakpoint
INSERT INTO `expense_items` (`budget_plan_id`, `name`, `category_id`, `target_amount`)
SELECT `budget_plan_id`, `name`, `category_id`, `target_amount` FROM `allocation_items`;
