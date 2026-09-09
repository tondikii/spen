ALTER TABLE `settings` ADD `reminders_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `transaction_reminder_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `period_reminder_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `goal_reminder_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `transaction_reminder_time` text DEFAULT '20:00' NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `notification_permission_requested` integer DEFAULT false NOT NULL;