import type { SQLiteDatabase } from 'expo-sqlite';

import { createWallet, getWallets } from '@/features/wallet';
import { getDatabaseTransactionCategories, saveDatabaseTransaction } from '@/features/transactions';
import {
  createDatabasePlanItem,
  deleteDatabasePlanItem,
  setDatabasePlanItemPaid,
  updateDatabasePlanItem,
} from '@/features/plan';

import {
  createDatabase,
  getDatabasePlanView,
  prepareDatabase,
  type TempSQLite,
} from './plan-repository-test-db';

describe('database plan transactions', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('menghapus transaksi sumber saat item income dan expense otomatis dihapus', async () => {
    const wallet = await createWallet(database, 'BCA', 1000);
    const categories = await getDatabaseTransactionCategories(database);
    const incomeCategory = categories.find((item) => item.name === 'Bonus')!;
    const expenseCategory = categories.find((item) => item.name === 'Transport')!;

    await saveDatabaseTransaction(database, {
      type: 'income',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: incomeCategory.id,
      amount: 500,
      date: '2026-09-03',
      time: '10:00',
      note: 'Bonus proyek',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: expenseCategory.id,
      amount: 200,
      date: '2026-09-04',
      time: '11:00',
      note: 'Ojek',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: expenseCategory.id,
      amount: 300,
      date: '2026-08-31',
      time: '12:00',
      note: 'Periode sebelumnya',
    });

    const view = await getDatabasePlanView(database, '2026-09-10');
    const incomeItem = view.plan.incomeItems.find((item) => item.categoryId === incomeCategory.id)!;
    const expenseItem = view.plan.expenseItems.find(
      (item) => item.categoryId === expenseCategory.id,
    )!;
    expect(incomeItem.isAutomatic).toBe(true);
    expect(expenseItem.isAutomatic).toBe(true);

    await deleteDatabasePlanItem(database, incomeItem, '2026-09-10');
    await deleteDatabasePlanItem(database, expenseItem, '2026-09-10');

    expect(
      await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? AND type = ? AND date BETWEEN ? AND ?;',
        Number(incomeCategory.id.replace('category-', '')),
        'income',
        '2026-09-01',
        '2026-09-30',
      ),
    ).toEqual({ count: 0 });
    expect(
      await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM transactions WHERE category_id = ? AND type = ?;',
        Number(expenseCategory.id.replace('category-', '')),
        'expense',
      ),
    ).toEqual({ count: 1 });
    expect((await getDatabasePlanView(database, '2026-09-10')).plan.incomeItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: incomeItem.id })]),
    );
    expect((await getDatabasePlanView(database, '2026-09-10')).plan.expenseItems).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: expenseItem.id })]),
    );
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
      `Pembayaran Rencana: ${item.name}`,
    );

    expect(transactions).toEqual([{ amount: 200, note: 'Pembayaran Rencana: Internet' }]);
  });

  it('removes the payment transaction even when unchecking on a later date', async () => {
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
    await setDatabasePlanItemPaid(database, item, false, wallet.id, '2026-09-10');

    expect(
      (await getWallets(database)).find((candidate) => candidate.id === wallet.id)?.balance,
    ).toBe(1000);
    expect(
      await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM transactions WHERE note = 'Pembayaran Rencana: Internet';",
      ),
    ).toEqual({ count: 0 });
  });

  it('updates the generated income transaction when an income Plan item changes', async () => {
    const wallet = await createWallet(database, 'BCA', 0);
    const otherWallet = await createWallet(database, 'Tunai', 0);
    const categories = await getDatabaseTransactionCategories(database);
    const salary = categories.find((item) => item.name === 'Gaji')!;
    const bonus = categories.find((item) => item.name === 'Bonus')!;
    await createDatabasePlanItem(database, {
      type: 'income',
      categoryId: salary.id,
      targetAmount: 1000,
      walletId: wallet.id,
    });
    const item = (await getDatabasePlanView(database, '2026-09-10')).plan.incomeItems.find(
      (candidate) => candidate.categoryId === salary.id,
    )!;

    await updateDatabasePlanItem(database, item, {
      type: 'income',
      categoryId: bonus.id,
      targetAmount: 2500,
      walletId: otherWallet.id,
    });

    expect((await getWallets(database)).map((candidate) => candidate.balance)).toEqual([0, 2500]);
    expect(
      await database.getFirstAsync<{ amount: number; wallet_id: number; category_id: number }>(
        'SELECT amount, wallet_id, category_id FROM transactions WHERE source_income_item_id = ?;',
        Number(item.id.replace('income-item-', '')),
      ),
    ).toEqual({
      amount: 2500,
      wallet_id: Number(otherWallet.id.replace('wallet-', '')),
      category_id: Number(bonus.id.replace('category-', '')),
    });
  });
});
