import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const wallets = sqliteTable('wallets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  initialBalance: integer('initial_balance').notNull().default(0),
  isSavings: integer('is_savings', { mode: 'boolean' }).notNull().default(false),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});
