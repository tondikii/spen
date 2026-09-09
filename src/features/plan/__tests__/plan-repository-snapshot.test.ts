import type { SQLiteDatabase } from 'expo-sqlite';

import { createWallet, updateWallet } from '@/features/wallet';
import { getDatabaseTransactionCategories, saveDatabaseTransaction } from '@/features/transactions';
import { ensureActiveBudgetPlan } from '@/features/plan';

import {
  createDatabase,
  getDatabasePlanView,
  prepareDatabase,
  type TempSQLite,
} from './plan-repository-test-db';

describe('database plan snapshot', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

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
      1000,
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
    expect(view.goals[0]!.walletId).toBe(goalWallet.id);
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
        expect.objectContaining({ realizedAmount: 1000, progressPercent: 100 }),
        expect.objectContaining({ realizedAmount: 500, progressPercent: 100 }),
      ]),
    );
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
});
