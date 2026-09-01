// Skema awal Spen — fondasi tabel inti (lengkap di tiket #17 Data foundation).
// Invariant: angka uang integer (rupiah tanpa desimal). Lihat ADR-0001/0003/0004/0005.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const wallets = sqliteTable('wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  initialBalance: integer('initial_balance').notNull().default(0),
  isSavings: integer('is_savings', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  icon: text('icon').notNull().default('◇'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['income', 'expense', 'transfer', 'adjustment'] }).notNull(),
  walletId: integer('wallet_id').references(() => wallets.id),
  toWalletId: integer('to_wallet_id').references(() => wallets.id),
  categoryId: integer('category_id').references(() => categories.id),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  note: text('note'),
});
