import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { categories } from './category';

export const budgetPeriods = sqliteTable(
  'budget_periods',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    durationMonths: integer('duration_months').notNull().default(1),
  },
  (table) => ({
    startDateIndex: index('budget_periods_start_date_idx').on(table.startDate),
  }),
);

export const budgetPlans = sqliteTable(
  'budget_plans',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    budgetPeriodId: integer('budget_period_id')
      .notNull()
      .references(() => budgetPeriods.id),
  },
  (table) => ({
    periodUnique: uniqueIndex('budget_plans_period_unique').on(table.budgetPeriodId),
  }),
);

export const incomeItems = sqliteTable(
  'income_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    budgetPlanId: integer('budget_plan_id')
      .notNull()
      .references(() => budgetPlans.id),
    name: text('name').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    targetAmount: integer('target_amount').notNull(),
  },
  (table) => ({
    planIndex: index('income_items_plan_idx').on(table.budgetPlanId),
  }),
);

export const fixedExpenseItems = sqliteTable(
  'fixed_expense_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    budgetPlanId: integer('budget_plan_id')
      .notNull()
      .references(() => budgetPlans.id),
    name: text('name').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    targetAmount: integer('target_amount').notNull(),
  },
  (table) => ({
    planIndex: index('fixed_expense_items_plan_idx').on(table.budgetPlanId),
  }),
);

export const allocationItems = sqliteTable(
  'allocation_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    budgetPlanId: integer('budget_plan_id')
      .notNull()
      .references(() => budgetPlans.id),
    name: text('name').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    targetAmount: integer('target_amount').notNull(),
  },
  (table) => ({
    planIndex: index('allocation_items_plan_idx').on(table.budgetPlanId),
  }),
);

// Satu-satunya jenis item pengeluaran di Budget plan. Tabel lama dipertahankan
// untuk kompatibilitas migrasi, tetapi tidak lagi dipakai oleh service baru.
export const expenseItems = sqliteTable(
  'expense_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    budgetPlanId: integer('budget_plan_id')
      .notNull()
      .references(() => budgetPlans.id),
    name: text('name').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    targetAmount: integer('target_amount').notNull(),
    isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => ({
    planIndex: index('expense_items_plan_idx').on(table.budgetPlanId),
  }),
);
