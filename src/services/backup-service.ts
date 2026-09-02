import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

export const BACKUP_VERSION = 1;

type WalletRow = { id: number; name: string; initial_balance: number; is_savings: number; archived: number };
type CategoryRow = { id: number; name: string; type: string; is_adjustment: number; icon: string; archived: number };
type TransactionRow = { id: number; type: string; wallet_id: number | null; to_wallet_id: number | null; category_id: number | null; amount: number; date: string; time: string; note: string | null };
type BudgetPeriodRow = { id: number; start_date: string; end_date: string; duration_months: number };
type BudgetPlanRow = { id: number; budget_period_id: number };
type PlanItemRow = { id: number; budget_plan_id: number; name: string; category_id: number; target_amount: number };
type GoalRow = { id: number; name: string; target_amount: number; target_date: string | null; wallet_id: number; monthly_contribution: number; archived: number };
type SettingsRow = { id: number; currency: string; theme_mode: string; budget_start_day: number };

export type BackupPayload = {
  version: number;
  exportedAt: string;
  data: {
    wallets: WalletRow[];
    categories: CategoryRow[];
    transactions: TransactionRow[];
    budgetPeriods: BudgetPeriodRow[];
    budgetPlans: BudgetPlanRow[];
    incomeItems: PlanItemRow[];
    fixedExpenseItems: PlanItemRow[];
    allocationItems: PlanItemRow[];
    goals: GoalRow[];
    settings: SettingsRow[];
  };
};

const TABLES = [
  'transactions',
  'income_items',
  'fixed_expense_items',
  'allocation_items',
  'goals',
  'budget_plans',
  'budget_periods',
  'settings',
  'categories',
  'wallets',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArrayOfRecords(value: unknown) {
  return Array.isArray(value) && value.every(isRecord);
}

export function parseBackupPayload(value: string | unknown): BackupPayload {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new Error('File backup bukan JSON yang valid');
    }
  }
  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION || !isRecord(parsed.data)) {
    throw new Error(`Versi backup tidak didukung. Gunakan backup Spen versi ${BACKUP_VERSION}.`);
  }
  const data = parsed.data;
  const keys = ['wallets', 'categories', 'transactions', 'budgetPeriods', 'budgetPlans', 'incomeItems', 'fixedExpenseItems', 'allocationItems', 'goals', 'settings'];
  if (!keys.every((key) => isArrayOfRecords(data[key]))) {
    throw new Error('Struktur file backup tidak lengkap atau rusak');
  }
  return parsed as unknown as BackupPayload;
}

export async function exportDatabase(database: SQLiteDatabase): Promise<BackupPayload> {
  const [wallets, categories, transactions, budgetPeriods, budgetPlans, incomeItems, fixedExpenseItems, allocationItems, goals, settings] = await Promise.all([
    database.getAllAsync<WalletRow>('SELECT id, name, initial_balance, is_savings, archived FROM wallets ORDER BY id;'),
    database.getAllAsync<CategoryRow>('SELECT id, name, type, is_adjustment, icon, archived FROM categories ORDER BY id;'),
    database.getAllAsync<TransactionRow>('SELECT id, type, wallet_id, to_wallet_id, category_id, amount, date, time, note FROM transactions ORDER BY id;'),
    database.getAllAsync<BudgetPeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods ORDER BY id;'),
    database.getAllAsync<BudgetPlanRow>('SELECT id, budget_period_id FROM budget_plans ORDER BY id;'),
    database.getAllAsync<PlanItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM income_items ORDER BY id;'),
    database.getAllAsync<PlanItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM fixed_expense_items ORDER BY id;'),
    database.getAllAsync<PlanItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM allocation_items ORDER BY id;'),
    database.getAllAsync<GoalRow>('SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals ORDER BY id;'),
    database.getAllAsync<SettingsRow>('SELECT id, currency, theme_mode, budget_start_day FROM settings ORDER BY id;'),
  ]);
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: { wallets, categories, transactions, budgetPeriods, budgetPlans, incomeItems, fixedExpenseItems, allocationItems, goals, settings } };
}

async function insertRows(database: SQLiteDatabase, payload: BackupPayload) {
  const { data } = payload;
  for (const row of data.wallets) await database.runAsync('INSERT INTO wallets (id, name, initial_balance, is_savings, archived) VALUES (?, ?, ?, ?, ?);', row.id, row.name, row.initial_balance, row.is_savings, row.archived);
  for (const row of data.categories) await database.runAsync('INSERT INTO categories (id, name, type, is_adjustment, icon, archived) VALUES (?, ?, ?, ?, ?, ?);', row.id, row.name, row.type, row.is_adjustment, row.icon, row.archived);
  for (const row of data.settings) await database.runAsync('INSERT INTO settings (id, currency, theme_mode, budget_start_day) VALUES (?, ?, ?, ?);', row.id, row.currency, row.theme_mode, row.budget_start_day);
  for (const row of data.budgetPeriods) await database.runAsync('INSERT INTO budget_periods (id, start_date, end_date, duration_months) VALUES (?, ?, ?, ?);', row.id, row.start_date, row.end_date, row.duration_months);
  for (const row of data.budgetPlans) await database.runAsync('INSERT INTO budget_plans (id, budget_period_id) VALUES (?, ?);', row.id, row.budget_period_id);
  for (const row of data.incomeItems) await database.runAsync('INSERT INTO income_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);', row.id, row.budget_plan_id, row.name, row.category_id, row.target_amount);
  for (const row of data.fixedExpenseItems) await database.runAsync('INSERT INTO fixed_expense_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);', row.id, row.budget_plan_id, row.name, row.category_id, row.target_amount);
  for (const row of data.allocationItems) await database.runAsync('INSERT INTO allocation_items (id, budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?, ?);', row.id, row.budget_plan_id, row.name, row.category_id, row.target_amount);
  for (const row of data.goals) await database.runAsync('INSERT INTO goals (id, name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, ?, ?);', row.id, row.name, row.target_amount, row.target_date, row.wallet_id, row.monthly_contribution, row.archived);
  for (const row of data.transactions) await database.runAsync('INSERT INTO transactions (id, type, wallet_id, to_wallet_id, category_id, amount, date, time, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', row.id, row.type, row.wallet_id, row.to_wallet_id, row.category_id, row.amount, row.date, row.time, row.note);
}

export async function restoreDatabase(database: SQLiteDatabase, value: BackupPayload | string): Promise<void> {
  const payload = parseBackupPayload(value);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const table of TABLES) await transaction.runAsync(`DELETE FROM ${table};`);
    await insertRows(transaction as unknown as SQLiteDatabase, payload);
  });
}

export async function createBackupFile(database: SQLiteDatabase): Promise<string> {
  if (!FileSystem.documentDirectory) throw new Error('Penyimpanan file tidak tersedia');
  const payload = await exportDatabase(database);
  const fileUri = `${FileSystem.documentDirectory}spen-backup-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  return fileUri;
}

export async function shareBackupFile(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Share sheet tidak tersedia di perangkat ini');
  await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Bagikan backup Spen' });
}

export async function pickBackupContent(): Promise<{ content: string; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets[0]) return null;
  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
  return { content, name: result.assets[0].name };
}
