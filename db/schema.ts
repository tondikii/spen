// Skema awal Spen — fondasi tabel inti (lengkap di tiket #17 Data foundation).
// Invariant: angka uang integer (rupiah tanpa desimal). Lihat ADR-0001/0003/0004/0005.
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
  isAdjustment: integer('is_adjustment', { mode: 'boolean' }).notNull().default(false),
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
  time: text('time').notNull().default(''),
  note: text('note'),
  isInitial: integer('is_initial', { mode: 'boolean' }).notNull().default(false),
  adminFee: integer('admin_fee').notNull().default(0),
}, (table) => ({
  dateIndex: index('transactions_date_idx').on(table.date),
  walletIndex: index('transactions_wallet_idx').on(table.walletId),
  categoryIndex: index('transactions_category_idx').on(table.categoryId),
}));

export const budgetPeriods = sqliteTable('budget_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  durationMonths: integer('duration_months').notNull().default(1),
}, (table) => ({
  startDateIndex: index('budget_periods_start_date_idx').on(table.startDate),
}));

export const budgetPlans = sqliteTable('budget_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetPeriodId: integer('budget_period_id').notNull().references(() => budgetPeriods.id),
}, (table) => ({
  periodUnique: uniqueIndex('budget_plans_period_unique').on(table.budgetPeriodId),
}));

export const incomeItems = sqliteTable('income_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetPlanId: integer('budget_plan_id').notNull().references(() => budgetPlans.id),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  targetAmount: integer('target_amount').notNull(),
}, (table) => ({
  planIndex: index('income_items_plan_idx').on(table.budgetPlanId),
}));

export const fixedExpenseItems = sqliteTable('fixed_expense_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetPlanId: integer('budget_plan_id').notNull().references(() => budgetPlans.id),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  targetAmount: integer('target_amount').notNull(),
}, (table) => ({
  planIndex: index('fixed_expense_items_plan_idx').on(table.budgetPlanId),
}));

export const allocationItems = sqliteTable('allocation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetPlanId: integer('budget_plan_id').notNull().references(() => budgetPlans.id),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  targetAmount: integer('target_amount').notNull(),
}, (table) => ({
  planIndex: index('allocation_items_plan_idx').on(table.budgetPlanId),
}));

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  targetAmount: integer('target_amount').notNull(),
  targetDate: text('target_date'),
  walletId: integer('wallet_id').notNull().references(() => wallets.id),
  monthlyContribution: integer('monthly_contribution').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  walletIndex: index('goals_wallet_idx').on(table.walletId),
}));

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  currency: text('currency', { enum: ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'] }).notNull().default('IDR'),
  themeMode: text('theme_mode', { enum: ['system', 'light', 'dark'] }).notNull().default('light'),
  budgetStartDay: integer('budget_start_day').notNull().default(1),
});

// Satu-satunya jenis item pengeluaran di Budget plan. Tabel lama dipertahankan
// untuk kompatibilitas migrasi, tetapi tidak lagi dipakai oleh service baru.
export const expenseItems = sqliteTable('expense_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetPlanId: integer('budget_plan_id').notNull().references(() => budgetPlans.id),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  targetAmount: integer('target_amount').notNull(),
  isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
}, (table) => ({
  planIndex: index('expense_items_plan_idx').on(table.budgetPlanId),
}));
