import type { SQLiteDatabase } from 'expo-sqlite';

import { createWallet } from '@/features/wallet';
import { getDatabaseTransactionCategories, saveDatabaseTransaction } from '@/features/transactions';
import {
  applyDatabaseBudgetSuggestion,
  createDatabasePlanItem,
  deleteDatabasePlanItem,
  ensureActiveBudgetPlan,
  updateDatabasePlanItem,
} from '@/features/plan';

import {
  createDatabase,
  getDatabasePlanView,
  prepareDatabase,
  type TempSQLite,
} from './plan-repository-test-db';

describe('database plan items', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

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
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('creates an income plan item and credits its selected Wallet', async () => {
    const wallet = await createWallet(database, 'BCA', 0);
    const category = (await getDatabaseTransactionCategories(database)).find(
      (item) => item.name === 'Gaji',
    )!;

    await createDatabasePlanItem(database, {
      type: 'income',
      categoryId: category.id,
      targetAmount: 14000000,
      walletId: wallet.id,
    });

    const view = await getDatabasePlanView(database, '2026-09-10');
    expect(view.wallets.find((item) => item.id === wallet.id)?.balance).toBe(14000000);
    expect(view.snapshot.planItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ realizedAmount: 14000000, progressPercent: 100 }),
      ]),
    );

    const item = view.plan.incomeItems.find((candidate) => candidate.categoryId === category.id)!;
    await deleteDatabasePlanItem(database, item);

    const afterDelete = await getDatabasePlanView(database, '2026-09-10');
    expect(afterDelete.wallets.find((candidate) => candidate.id === wallet.id)?.balance).toBe(0);
    expect(afterDelete.plan.incomeItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: item.id })]),
    );
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
    const item = view.plan.allocationItems[0]!;
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
    const item = (await getDatabasePlanView(database, '2026-09-10')).plan.allocationItems[0]!;

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
