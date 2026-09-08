import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  currency: text('currency', {
    enum: ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'],
  })
    .notNull()
    .default('IDR'),
  themeMode: text('theme_mode', { enum: ['system', 'light', 'dark'] })
    .notNull()
    .default('light'),
  locale: text('locale', { enum: ['id', 'en'] })
    .notNull()
    .default('en'),
  budgetStartDay: integer('budget_start_day').notNull().default(1),
});
