import type { CurrencyCode, ThemeMode } from '@/types/domain';
import type { SQLiteDatabase } from 'expo-sqlite';

let selectedCurrency: CurrencyCode = 'IDR';

export const currencyOptions: CurrencyCode[] = ['IDR', 'USD', 'SGD', 'MYR', 'EUR', 'GBP', 'JPY', 'AUD', 'SAR', 'AED'];

export function getSelectedCurrency() { return selectedCurrency; }
export function setSelectedCurrency(currency: CurrencyCode) { selectedCurrency = currency; return selectedCurrency; }

export async function getDatabaseSettings(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ currency: string; theme_mode: string }>('SELECT currency, theme_mode FROM settings WHERE id = 1 LIMIT 1;');
  return { currency: currencyOptions.includes(row?.currency as CurrencyCode) ? row!.currency as CurrencyCode : 'IDR' as CurrencyCode, themeMode: row?.theme_mode ?? 'system' };
}

export async function setDatabaseCurrency(database: SQLiteDatabase, currency: CurrencyCode) {
  await database.runAsync('UPDATE settings SET currency = ? WHERE id = 1;', currency);
  return setSelectedCurrency(currency);
}

export async function setDatabaseThemeMode(database: SQLiteDatabase, mode: ThemeMode) {
  await database.runAsync('UPDATE settings SET theme_mode = ? WHERE id = 1;', mode);
}
