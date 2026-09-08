import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  systemKey: text('system_key'),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  isAdjustment: integer('is_adjustment', { mode: 'boolean' }).notNull().default(false),
  icon: text('icon').notNull().default('◇'),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});
