import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { normalizeLocale } from '@/i18n';
import { AppError } from '@/utils/app-error';
import type { Locale } from '@/types/domain';

import { BACKUP_VERSION } from './backup-format';
import type {
  BackupPayload,
  BudgetPeriodRow,
  BudgetPlanRow,
  CategoryRow,
  GoalRow,
  PlanItemRow,
  SettingsRow,
  TransactionRow,
  WalletRow,
} from './backup-format';
import { parseBackupPayload } from './backup-validation';

export { BACKUP_MAX_JSON_LENGTH, BACKUP_MAX_RECORDS, BACKUP_VERSION } from './backup-format';
export type { BackupPayload } from './backup-format';
export { parseBackupPayload } from './backup-validation';

const TABLES = [
  'transactions',
  'income_items',
  'fixed_expense_items',
  'allocation_items',
  'expense_items',
  'goals',
  'budget_plans',
  'budget_periods',
  'settings',
  'categories',
  'wallets',
] as const;

export async function exportDatabase(database: SQLiteDatabase): Promise<BackupPayload> {
  // Seluruh tabel dibaca dalam satu transaksi eksklusif sehingga snapshot
  // konsisten (panduan seksi 19) — tidak ada writer yang menyela di tengah.
  let payload: BackupPayload | undefined;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const [
      wallets,
      categories,
      transactions,
      budgetPeriods,
      budgetPlans,
      incomeItems,
      fixedExpenseItems,
      allocationItems,
      expenseItems,
      goals,
      settings,
    ] = await Promise.all([
      transaction.getAllAsync<WalletRow>(
        'SELECT id, name, initial_balance, is_savings, archived FROM wallets ORDER BY id;',
      ),
      transaction.getAllAsync<CategoryRow>(
        'SELECT id, name, system_key, type, is_adjustment, icon, archived FROM categories ORDER BY id;',
      ),
      transaction.getAllAsync<TransactionRow>(
        'SELECT id, type, wallet_id, to_wallet_id, category_id, amount, date, time, note, is_initial, admin_fee, source_income_item_id, source_expense_item_id FROM transactions ORDER BY id;',
      ),
      transaction.getAllAsync<BudgetPeriodRow>(
        'SELECT id, start_date, end_date, duration_months FROM budget_periods ORDER BY id;',
      ),
      transaction.getAllAsync<BudgetPlanRow>(
        'SELECT id, budget_period_id FROM budget_plans ORDER BY id;',
      ),
      transaction.getAllAsync<PlanItemRow>(
        'SELECT id, budget_plan_id, name, category_id, target_amount FROM income_items ORDER BY id;',
      ),
      transaction.getAllAsync<PlanItemRow>(
        'SELECT id, budget_plan_id, name, category_id, target_amount FROM fixed_expense_items ORDER BY id;',
      ),
      transaction.getAllAsync<PlanItemRow>(
        'SELECT id, budget_plan_id, name, category_id, target_amount FROM allocation_items ORDER BY id;',
      ),
      transaction.getAllAsync<PlanItemRow>(
        'SELECT id, budget_plan_id, name, category_id, target_amount, is_paid FROM expense_items ORDER BY id;',
      ),
      transaction.getAllAsync<GoalRow>(
        'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals ORDER BY id;',
      ),
      transaction.getAllAsync<SettingsRow>(
        'SELECT id, currency, theme_mode, locale, budget_start_day FROM settings ORDER BY id;',
      ),
    ]);
    payload = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        wallets,
        categories,
        transactions,
        budgetPeriods,
        budgetPlans,
        incomeItems,
        fixedExpenseItems,
        allocationItems,
        expenseItems,
        goals,
        settings,
      },
    };
  });
  if (!payload) throw new AppError('storage');
  return payload;
}

async function insertRows(database: SQLiteDatabase, payload: BackupPayload) {
  const { data } = payload;
  for (const row of data.wallets)
    await database.runAsync(
      'INSERT INTO wallets (id, name, initial_balance, is_savings, archived) VALUES (?, ?, ?, ?, ?);',
      row.id,
      row.name,
      row.initial_balance,
      row.is_savings,
      row.archived,
    );
  for (const row of data.categories)
    await database.runAsync(
      'INSERT INTO categories (id, name, system_key, type, is_adjustment, icon, archived) VALUES (?, ?, ?, ?, ?, ?, ?);',
      row.id,
      row.name,
      row.system_key ?? null,
      row.type,
      row.is_adjustment,
      row.icon,
      row.archived,
    );
  for (const row of data.settings)
    await database.runAsync(
      'INSERT INTO settings (id, currency, theme_mode, locale, budget_start_day) VALUES (?, ?, ?, ?, ?);',
      row.id,
      row.currency,
      row.theme_mode,
      row.locale ?? 'en',
      row.budget_start_day,
    );
  for (const row of data.budgetPeriods)
    await database.runAsync(
      'INSERT INTO budget_periods (id, start_date, end_date, duration_months) VALUES (?, ?, ?, ?);',
      row.id,
      row.start_date,
      row.end_date,
      row.duration_months,
    );
  for (const row of data.budgetPlans)
    await database.runAsync(
      'INSERT INTO budget_plans (id, budget_period_id) VALUES (?, ?);',
      row.id,
      row.budget_period_id,
    );
  for (const row of data.incomeItems)
    await database.runAsync(
      'INSERT INTO income_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);',
      row.id,
      row.budget_plan_id,
      row.name,
      row.category_id,
      row.target_amount,
    );
  for (const row of data.fixedExpenseItems)
    await database.runAsync(
      'INSERT INTO fixed_expense_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);',
      row.id,
      row.budget_plan_id,
      row.name,
      row.category_id,
      row.target_amount,
    );
  for (const row of data.allocationItems)
    await database.runAsync(
      'INSERT INTO allocation_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);',
      row.id,
      row.budget_plan_id,
      row.name,
      row.category_id,
      row.target_amount,
    );
  for (const row of data.expenseItems ?? [])
    await database.runAsync(
      'INSERT INTO expense_items (id, budget_plan_id, name, category_id, target_amount, is_paid) VALUES (?, ?, ?, ?, ?, ?);',
      row.id,
      row.budget_plan_id,
      row.name,
      row.category_id,
      row.target_amount,
      row.is_paid ?? 0,
    );
  for (const row of data.goals)
    await database.runAsync(
      'INSERT INTO goals (id, name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, ?, ?);',
      row.id,
      row.name,
      row.target_amount,
      row.target_date,
      row.wallet_id,
      row.monthly_contribution,
      row.archived,
    );
  for (const row of data.transactions)
    await database.runAsync(
      'INSERT INTO transactions (id, type, wallet_id, to_wallet_id, category_id, amount, date, time, note, is_initial, admin_fee, source_income_item_id, source_expense_item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      row.id,
      row.type,
      row.wallet_id,
      row.to_wallet_id,
      row.category_id,
      row.amount,
      row.date,
      row.time,
      row.note,
      row.is_initial ?? 0,
      row.admin_fee ?? 0,
      row.source_income_item_id ?? null,
      row.source_expense_item_id ?? null,
    );
}

export async function restoreDatabase(
  database: SQLiteDatabase,
  value: BackupPayload | string,
): Promise<Locale> {
  const payload = parseBackupPayload(value);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const table of TABLES) await transaction.runAsync(`DELETE FROM ${table};`);
    await insertRows(transaction as unknown as SQLiteDatabase, payload);
  });
  return normalizeLocale(payload.data.settings[0]?.locale);
}

export async function createBackupFile(database: SQLiteDatabase): Promise<string> {
  // Ditulis ke cache (bukan documentDirectory) agar tidak menumpuk permanen;
  // pemanggil tetap menghapus setelah share sebagai best-effort.
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!directory) throw new AppError('storage');
  const payload = await exportDatabase(database);
  const fileUri = `${directory}spen-backup-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

export async function shareBackupFile(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new AppError('storage');
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Bagikan backup Spen',
  });
}

export async function pickBackupContent(): Promise<{ content: string; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { content, name: result.assets[0].name };
}
