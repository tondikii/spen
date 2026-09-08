import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { wallets } from './wallet';

export const goals = sqliteTable(
  'goals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    targetAmount: integer('target_amount').notNull(),
    targetDate: text('target_date'),
    walletId: integer('wallet_id')
      .notNull()
      .references(() => wallets.id),
    monthlyContribution: integer('monthly_contribution').notNull().default(0),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    walletIndex: index('goals_wallet_idx').on(table.walletId),
  }),
);
