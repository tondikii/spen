import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/utils/app-error';
import {
  currencyOptions,
  getSelectedLocale,
  setSelectedCurrency,
  setSelectedLocale,
} from '@/utils/selection';
import type { CurrencyCode, Locale } from '@/types/domain';

function isCurrency(value: string): value is CurrencyCode {
  return currencyOptions.includes(value as CurrencyCode);
}

export type SetupWalletDraft = { name: string; initialBalance: number };

const INITIAL_BALANCE_CATEGORY_NAME = 'Saldo Awal';

export async function getSetupState(database: SQLiteDatabase) {
  const walletCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM wallets;',
  );
  const setting = await database.getFirstAsync<{ currency: string }>(
    'SELECT currency FROM settings WHERE id = 1 LIMIT 1;',
  );
  const currency = setting && isCurrency(setting.currency) ? setting.currency : 'IDR';
  return { hasWallet: (walletCount?.count ?? 0) > 0, currency };
}

export async function completeSetup(
  database: SQLiteDatabase,
  wallets: SetupWalletDraft[],
  currency: CurrencyCode,
  locale: Locale = getSelectedLocale(),
) {
  if (wallets.length === 0) throw new AppError('validation');
  const drafts = wallets.map((wallet) => ({
    name: wallet.name.trim(),
    initialBalance: wallet.initialBalance,
  }));
  if (drafts.some((wallet) => !wallet.name)) throw new AppError('validation');
  if (drafts.some((wallet) => !Number.isSafeInteger(wallet.initialBalance)))
    throw new AppError('validation');

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const walletCount = await transaction.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM wallets;',
    );
    if ((walletCount?.count ?? 0) > 0) throw new AppError('validation');
    const category = drafts.some((wallet) => wallet.initialBalance !== 0)
      ? await transaction.getFirstAsync<{ id: number }>(
          'SELECT id FROM categories WHERE name = ? AND is_adjustment = 1 LIMIT 1;',
          INITIAL_BALANCE_CATEGORY_NAME,
        )
      : null;
    if (drafts.some((wallet) => wallet.initialBalance !== 0) && !category)
      throw new AppError('notFound');
    for (const draft of drafts) {
      const wallet = await transaction.runAsync(
        'INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, 0, 0, 0);',
        draft.name,
      );
      if (draft.initialBalance !== 0) {
        const now = new Date();
        await transaction.runAsync(
          `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
          draft.initialBalance > 0 ? 'income' : 'expense',
          wallet.lastInsertRowId,
          category!.id,
          Math.abs(draft.initialBalance),
          now.toISOString().slice(0, 10),
          now.toTimeString().slice(0, 5),
          i18n.t('common.openingBalanceNote'),
        );
      }
    }
    await transaction.runAsync(
      'UPDATE settings SET currency = ?, locale = ? WHERE id = 1;',
      currency,
      locale,
    );
  });
  setSelectedCurrency(currency);
  setSelectedLocale(locale);
}
