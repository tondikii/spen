import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import { createWallet, updateWallet } from '@/services/wallet-service';
import {
  getDatabaseTransactionCategories,
  saveDatabaseTransaction,
} from '@/services/transaction-service';
import {
  applyDatabaseBudgetSuggestion,
  createDatabasePlanItem,
  deleteDatabasePlanItem,
  ensureActiveBudgetPlan,
  getDatabasePlanView,
  setBudgetPeriodStartDay,
  setDatabasePlanItemPaid,
  updateDatabasePlanItem,
} from '@/services/plan-service';

type TempSQLite = {
  exec(source: string): void;
  prepare(source: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  };
  close(): void;
};

function createDatabase() {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => TempSQLite;
  };
  const sqlite = new DatabaseSync(':memory:');
  const database = {
    execAsync: async (source: string) => sqlite.exec(source),
    getFirstAsync: async <T>(source: string, ...params: unknown[]) =>
      sqlite.prepare(source).get(...params) as T | undefined,
    getAllAsync: async <T>(source: string, ...params: unknown[]) =>
      sqlite.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = sqlite.prepare(source).run(...params);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) =>
      task(database as unknown as SQLiteDatabase),
  } as unknown as SQLiteDatabase;
  return { database, sqlite };
}

async function prepareDatabase(database: SQLiteDatabase, sqlite: TempSQLite) {
  await configureDatabase(database);
  for (const migration of Object.values(migrations.migrations)) {
    for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
  }
  await seedDefaultCategories(database);
}

describe('database plan service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('creates one active global plan and rolls over to a new period', async () => {
    const first = await ensureActiveBudgetPlan(database, '2026-09-10');
    expect(first.period.start_date).toBe('2026-09-01');
    expect(first.period.end_date).toBe('2026-09-30');

    const rolled = await setBudgetPeriodStartDay(database, 5, '2026-09-10');
    expect(rolled.period?.start_date).toBe('2026-09-05');
    expect(rolled.period?.end_date).toBe('2026-10-04');
    expect(rolled.planId).not.toBe(first.planId);
    expect(
      await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM budget_plans;',
      ),
    ).toEqual({ count: 2 });
  });

  it('persists the selected start day and reuses the matching historical period', async () => {
    await setBudgetPeriodStartDay(database, 5, '2026-09-10');
    const nextPeriod = await ensureActiveBudgetPlan(database, '2026-10-10');
    expect(nextPeriod.period.start_date).toBe('2026-10-05');
    expect(nextPeriod.period.end_date).toBe('2026-11-04');

    const firstPeriod = await setBudgetPeriodStartDay(database, 1, '2026-09-10');
    expect(firstPeriod.period?.start_date).toBe('2026-09-01');
    expect(firstPeriod.period?.end_date).toBe('2026-09-30');
    expect((await getDatabasePlanView(database, '2026-09-10')).period.startDate).toBe('2026-09-01');
  });

  it('derives realisation, expense progress, spare, and balance split from the ledger', async () => {
    const active = await ensureActiveBudgetPlan(database, '2026-09-10');
    const wallet = await createWallet(database, 'BCA', 1000);
    const goalWallet = await createWallet(database, 'Dana Nikah', 800);
    const categories = await getDatabaseTransactionCategories(database);
    const incomeCategory = categories.find((item) => item.name === 'Gaji')!.id;
    const expenseCategory = categories.find((item) => item.name === 'Makan')!.id;
    const incomeId = Number(incomeCategory.replace('category-', ''));
    const expenseId = Number(expenseCategory.replace('category-', ''));
    const planId = active.planId;
    const goalWalletNumber = Number(goalWallet.id.replace('wallet-', ''));

    await database.runAsync(
      'INSERT INTO income_items (budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?);',
      planId,
      'Gaji',
      incomeId,
      1000,
    );
    await database.runAsync(
      'INSERT INTO fixed_expense_items (budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?);',
      planId,
      'Makan tetap',
      expenseId,
      200,
    );
    await database.runAsync(
      'INSERT INTO allocation_items (budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?);',
      planId,
      'Makan fleksibel',
      expenseId,
      300,
    );
    await database.runAsync(
      'INSERT INTO goals (name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, 0);',
      'Dana Nikah',
      500,
      null,
      goalWalletNumber,
      150,
    );

    await saveDatabaseTransaction(database, {
      type: 'income',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: incomeCategory,
      amount: 1000,
      date: '2026-09-02',
      time: '08:00',
      note: 'Gaji',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: expenseCategory,
      amount: 350,
      date: '2026-09-02',
      time: '09:00',
      note: 'Makan',
    });

    const view = await getDatabasePlanView(database, '2026-09-10');
    const expense = view.plan.expenseItems.find((item) => item.categoryId === expenseCategory)!;
    const expenseState = view.snapshot.planItems.find((item) => item.itemId === expense.id)!;

    expect(view.snapshot.totalIncome).toBe(2800);
    expect(view.snapshot.totalExpense).toBe(350);
    expect(expenseState.realizedAmount).toBe(350);
    expect(expenseState.progressPercent).toBe(175);
    expect(expenseState.overBudget).toBe(true);
    expect(view.snapshot.spareBudget).toBe(2600);
    expect(view.snapshot.availableBalance).toBe(2450);
    expect(view.snapshot.goalBalance).toBe(800);
    expect(view.snapshot.freeBalance).toBe(1650);
    expect(view.goals[0].walletId).toBe(goalWallet.id);
  });

  it('shows initial-balance income transactions in Pendapatan automatically', async () => {
    const wallet = await createWallet(database, 'BCA', 1000);

    const view = await getDatabasePlanView(database, '2026-09-10');

    expect(view.plan.incomeItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Saldo Awal',
          categoryId: expect.stringMatching(/^category-/),
        }),
      ]),
    );
    expect(view.snapshot.planItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ realizedAmount: 1000 })]),
    );
    expect(wallet.balance).toBe(1000);
  });

  it('puts balance adjustments into the matching Plan section', async () => {
    const wallet = await createWallet(database, 'BCA', 1000);
    await updateWallet(database, wallet.id, 'BCA', 500);

    const view = await getDatabasePlanView(database, '2026-09-10');

    expect(view.plan.incomeItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Saldo Awal' })]),
    );
    expect(view.plan.expenseItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Penyesuaian Saldo' })]),
    );
    expect(view.snapshot.planItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ realizedAmount: 1000, progressPercent: 0 }),
        expect.objectContaining({ realizedAmount: 500, progressPercent: 100 }),
      ]),
    );
  });

  it('uses category as the unique identity of a plan item', async () => {
    await ensureActiveBudgetPlan(database, '2026-09-10');
    const expense = (await getDatabaseTransactionCategories(database)).find(
      (item) => item.name === 'Makan',
    )!;

    await createDatabasePlanItem(database, {
      type: 'expense',
      categoryId: expense.id,
      targetAmount: 300,
    });
    const item = (await getDatabasePlanView(database, '2026-09-10')).plan.expenseItems[0];

    expect(item).toMatchObject({ name: 'Makan', categoryId: expense.id, targetAmount: 300 });
    await expect(
      createDatabasePlanItem(database, {
        type: 'expense',
        categoryId: expense.id,
        targetAmount: 500,
      }),
    ).rejects.toThrow(/sudah ada/);
  });

  it('starts an unplanned expense at 100 percent and recalculates after its target is raised', async () => {
    const wallet = await createWallet(database, 'BCA', 0);
    const transport = (await getDatabaseTransactionCategories(database)).find(
      (item) => item.name === 'Transport',
    )!;
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: transport.id,
      amount: 20,
      date: '2026-09-03',
      time: '10:00',
      note: 'Ojek',
    });

    let view = await getDatabasePlanView(database, '2026-09-10');
    const automatic = view.plan.expenseItems.find((item) => item.categoryId === transport.id)!;
    expect(automatic).toMatchObject({ isAutomatic: true, targetAmount: 20 });
    expect(
      view.snapshot.planItems.find((state) => state.itemId === automatic.id)?.progressPercent,
    ).toBe(100);

    await createDatabasePlanItem(database, {
      type: 'expense',
      categoryId: transport.id,
      targetAmount: 400,
    });
    view = await getDatabasePlanView(database, '2026-09-10');
    const planned = view.plan.expenseItems.find((item) => item.categoryId === transport.id)!;
    expect(
      view.snapshot.planItems.find((state) => state.itemId === planned.id)?.progressPercent,
    ).toBe(5);

    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: transport.id,
      amount: 20,
      date: '2026-09-04',
      time: '10:00',
      note: 'Ojek',
    });
    view = await getDatabasePlanView(database, '2026-09-10');
    expect(
      view.snapshot.planItems.find((state) => state.itemId === planned.id)?.progressPercent,
    ).toBe(10);
  });

  it('creates one expense transaction when the payment toggle is enabled', async () => {
    const wallet = await createWallet(database, 'BCA', 1000);
    const category = (await getDatabaseTransactionCategories(database)).find(
      (item) => item.name === 'Internet',
    )!;
    await createDatabasePlanItem(database, {
      type: 'expense',
      categoryId: category.id,
      targetAmount: 200,
    });
    const item = (await getDatabasePlanView(database, '2026-09-10')).plan.expenseItems.find(
      (candidate) => candidate.categoryId === category.id,
    )!;

    await setDatabasePlanItemPaid(database, item, true, wallet.id, '2026-09-03');
    await setDatabasePlanItemPaid(database, item, true, wallet.id, '2026-09-03');
    const transactions = await database.getAllAsync<{ amount: number; note: string }>(
      `SELECT amount, note FROM transactions WHERE category_id = ? AND note = ?;`,
      Number(category.id.replace('category-', '')),
      `Pembayaran Plan: ${item.name}`,
    );

    expect(transactions).toEqual([{ amount: 200, note: 'Pembayaran Plan: Internet' }]);
  });

  it('includes transfer directions in net saving without changing total wealth', async () => {
    const active = await ensureActiveBudgetPlan(database, '2026-09-10');
    const wallet = await createWallet(database, 'BCA', 0);
    const secondWallet = await createWallet(database, 'Tunai', 0);
    await saveDatabaseTransaction(database, {
      type: 'transfer',
      walletId: wallet.id,
      toWalletId: secondWallet.id,
      categoryId: null,
      amount: 100,
      date: '2026-09-02',
      time: '10:00',
      note: 'Pindah',
    });
    await saveDatabaseTransaction(database, {
      type: 'income',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: 'category-1',
      amount: 500,
      date: '2026-09-02',
      time: '11:00',
      note: 'Gaji',
    });

    const view = await getDatabasePlanView(database, '2026-09-10');
    expect(view.snapshot.totalTransferIn).toBe(100);
    expect(view.snapshot.totalTransferOut).toBe(100);
    expect(view.snapshot.netSaving).toBe(500);
    expect(view.snapshot.availableBalance).toBe(500);
    expect(active.planId).toBe(Number(view.plan.id.replace('plan-', '')));
  });

  it('creates and updates plan items using a matching active category', async () => {
    const active = await ensureActiveBudgetPlan(database, '2026-09-10');
    const categories = await getDatabaseTransactionCategories(database);
    const expense = categories.find((item) => item.name === 'Makan')!;
    await createDatabasePlanItem(database, {
      type: 'allocation',
      name: 'Makan fleksibel',
      categoryId: expense.id,
      targetAmount: 300,
    });
    let view = await getDatabasePlanView(database, '2026-09-10');
    const item = view.plan.allocationItems[0];
    expect(item).toMatchObject({ name: 'Makan', targetAmount: 300, categoryId: expense.id });

    await updateDatabasePlanItem(database, item, {
      type: 'allocation',
      name: 'Makan harian',
      categoryId: expense.id,
      targetAmount: 500,
    });
    view = await getDatabasePlanView(database, '2026-09-10');
    expect(view.plan.allocationItems[0]).toMatchObject({ name: 'Makan', targetAmount: 500 });
    expect(active.planId).toBe(Number(view.plan.id.replace('plan-', '')));
  });

  it('deletes an existing plan item through the public service seam', async () => {
    await ensureActiveBudgetPlan(database, '2026-09-10');
    const expense = (await getDatabaseTransactionCategories(database)).find(
      (item) => item.name === 'Makan',
    )!;
    await createDatabasePlanItem(database, {
      type: 'allocation',
      name: 'Makan fleksibel',
      categoryId: expense.id,
      targetAmount: 300,
    });
    const item = (await getDatabasePlanView(database, '2026-09-10')).plan.allocationItems[0];

    await deleteDatabasePlanItem(database, item);

    expect((await getDatabasePlanView(database, '2026-09-10')).plan.allocationItems).toHaveLength(
      0,
    );
  });

  it('applies an add_goal suggestion by creating a Wallet Goal when needed', async () => {
    const view = await getDatabasePlanView(database, '2026-09-10');
    const categories = await getDatabaseTransactionCategories(database);

    await applyDatabaseBudgetSuggestion(
      database,
      {
        action: 'add_goal',
        title: 'Dana Darurat',
        description: 'Bangun dana darurat.',
        targetAmount: 12000000,
        walletName: 'Tabungan Darurat',
        monthlyContribution: 1000000,
        amount: null,
        categoryName: null,
      },
      { ...view, categories },
    );

    const nextView = await getDatabasePlanView(database, '2026-09-10');
    expect(nextView.goals).toEqual([
      expect.objectContaining({
        name: 'Dana Darurat',
        targetAmount: 12000000,
        monthlyContribution: 1000000,
      }),
    ]);
    expect(nextView.wallets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Tabungan Darurat', isSavings: true }),
      ]),
    );
  });
});
