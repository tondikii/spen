ALTER TABLE `transactions` ADD `is_initial` integer DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO categories (name, type, icon, archived, is_adjustment)
SELECT 'Saldo Awal', 'income', '↺', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Saldo Awal' AND type = 'income')
  AND EXISTS (SELECT 1 FROM wallets WHERE initial_balance <> 0);
--> statement-breakpoint
INSERT INTO categories (name, type, icon, archived, is_adjustment)
SELECT 'Penyesuaian Saldo', 'expense', '±', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Penyesuaian Saldo' AND type = 'expense')
  AND EXISTS (SELECT 1 FROM wallets WHERE initial_balance <> 0);
--> statement-breakpoint
INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial)
SELECT CASE WHEN w.initial_balance >= 0 THEN 'income' ELSE 'expense' END,
       w.id,
       c.id,
       ABS(w.initial_balance),
       date('now'),
       time('now'),
       'Saldo awal Wallet',
       1
FROM wallets w
JOIN categories c ON c.name = 'Saldo Awal' AND c.is_adjustment = 1
WHERE w.initial_balance <> 0;
--> statement-breakpoint
UPDATE transactions
SET category_id = (SELECT id FROM categories WHERE name = 'Saldo Awal' AND is_adjustment = 1 LIMIT 1)
WHERE is_initial = 1;
--> statement-breakpoint
UPDATE wallets SET initial_balance = 0 WHERE initial_balance <> 0;
