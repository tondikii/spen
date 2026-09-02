DROP INDEX IF EXISTS `budget_plans_period_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `budget_plans_period_unique` ON `budget_plans` (`budget_period_id`);