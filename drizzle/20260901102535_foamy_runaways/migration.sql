CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`icon` text DEFAULT '◇' NOT NULL,
	`archived` integer DEFAULT false NOT NULL
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
	`note` text,
	CONSTRAINT `fk_transactions_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`),
	CONSTRAINT `fk_transactions_to_wallet_id_wallets_id_fk` FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`),
	CONSTRAINT `fk_transactions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `wallets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`initial_balance` integer DEFAULT 0 NOT NULL,
	`is_savings` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
