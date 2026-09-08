import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { categories } from './category';
import { wallets } from './wallet';

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type', { enum: ['income', 'expense', 'transfer', 'adjustment'] }).notNull(),
    walletId: integer('wallet_id').references(() => wallets.id),
    toWalletId: integer('to_wallet_id').references(() => wallets.id),
    categoryId: integer('category_id').references(() => categories.id),
    amount: integer('amount').notNull(),
    date: text('date').notNull(),
    time: text('time').notNull().default(''),
    note: text('note'),
    isInitial: integer('is_initial', { mode: 'boolean' }).notNull().default(false),
    adminFee: integer('admin_fee').notNull().default(0),
    sourceIncomeItemId: integer('source_income_item_id'),
    sourceExpenseItemId: integer('source_expense_item_id'),
  },
  (table) => ({
    dateIndex: index('transactions_date_idx').on(table.date),
    walletIndex: index('transactions_wallet_idx').on(table.walletId),
    toWalletIndex: index('transactions_to_wallet_idx').on(table.toWalletId),
    categoryIndex: index('transactions_category_idx').on(table.categoryId),
  }),
);
