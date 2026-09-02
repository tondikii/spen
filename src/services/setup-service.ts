import type { SQLiteDatabase } from 'expo-sqlite';

import { setSelectedCurrency } from '@/services/settings-service';
import type { CurrencyCode } from '@/types/domain';

const currencies: CurrencyCode[] = ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'];

function isCurrency(value: string): value is CurrencyCode {
  return currencies.includes(value as CurrencyCode);
}

export async function getSetupState(database: SQLiteDatabase) {
  const walletCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM wallets;');
  const setting = await database.getFirstAsync<{ currency: string }>('SELECT currency FROM settings WHERE id = 1 LIMIT 1;');
  const currency = setting && isCurrency(setting.currency) ? setting.currency : 'IDR';
  return { hasWallet: (walletCount?.count ?? 0) > 0, currency };
}

export async function completeSetup(database: SQLiteDatabase, walletName: string, initialBalance: number, currency: CurrencyCode) {
  const name = walletName.trim();
  if (!name) throw new Error('Nama Wallet wajib diisi');
  if (!Number.isSafeInteger(initialBalance)) throw new Error('Saldo awal harus berupa angka bulat');

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const walletCount = await transaction.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM wallets;');
    if ((walletCount?.count ?? 0) > 0) throw new Error('Setup sudah selesai');
    await transaction.runAsync('INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, ?, 0, 0);', name, initialBalance);
    await transaction.runAsync('UPDATE settings SET currency = ? WHERE id = 1;', currency);
  });
  setSelectedCurrency(currency);
}
