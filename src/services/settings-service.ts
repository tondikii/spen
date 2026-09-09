import type { CurrencyCode, ThemeMode, Locale, ReminderSettings } from '@/types/domain';
import type { SQLiteDatabase } from 'expo-sqlite';

export type { ReminderSettings } from '@/types/domain';

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  remindersEnabled: false,
  transactionReminderEnabled: false,
  periodReminderEnabled: false,
  goalReminderEnabled: false,
  transactionReminderTime: '20:00',
  notificationPermissionRequested: false,
};

let selectedCurrency: CurrencyCode = 'IDR';
let selectedLocale: Locale = 'en';
let selectedReminderSettings: ReminderSettings = { ...DEFAULT_REMINDER_SETTINGS };

export const currencyOptions: CurrencyCode[] = [
  'IDR',
  'USD',
  'SGD',
  'MYR',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'SAR',
  'AED',
];

export function getSelectedCurrency() {
  return selectedCurrency;
}
export function setSelectedCurrency(currency: CurrencyCode) {
  selectedCurrency = currency;
  return selectedCurrency;
}
export function getSelectedLocale() {
  return selectedLocale;
}
export function setSelectedLocale(locale: Locale) {
  selectedLocale = locale;
  return locale;
}

export function getReminderSettings() {
  return { ...selectedReminderSettings };
}

export function setReminderSettings(settings: ReminderSettings) {
  selectedReminderSettings = { ...settings };
  return getReminderSettings();
}

export function isValidReminderTime(value: string) {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  return match;
}

function normalizeReminderSettings(row?: Partial<ReminderSettings>): ReminderSettings {
  const settings = {
    ...DEFAULT_REMINDER_SETTINGS,
    ...row,
  };
  return {
    ...settings,
    transactionReminderTime: isValidReminderTime(settings.transactionReminderTime)
      ? settings.transactionReminderTime
      : DEFAULT_REMINDER_SETTINGS.transactionReminderTime,
  };
}

export async function getDatabaseSettings(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{
    currency: string;
    theme_mode: string;
    locale: string;
    reminders_enabled: number;
    transaction_reminder_enabled: number;
    period_reminder_enabled: number;
    goal_reminder_enabled: number;
    transaction_reminder_time: string;
    notification_permission_requested: number;
  }>(
    `SELECT currency, theme_mode, locale, reminders_enabled, transaction_reminder_enabled,
            period_reminder_enabled, goal_reminder_enabled, transaction_reminder_time,
            notification_permission_requested
     FROM settings WHERE id = 1 LIMIT 1;`,
  );
  const reminderSettings = normalizeReminderSettings(
    row
      ? {
          remindersEnabled: Boolean(row.reminders_enabled),
          transactionReminderEnabled: Boolean(row.transaction_reminder_enabled),
          periodReminderEnabled: Boolean(row.period_reminder_enabled),
          goalReminderEnabled: Boolean(row.goal_reminder_enabled),
          transactionReminderTime: row.transaction_reminder_time,
          notificationPermissionRequested: Boolean(row.notification_permission_requested),
        }
      : undefined,
  );
  setReminderSettings(reminderSettings);
  return {
    currency: currencyOptions.includes(row?.currency as CurrencyCode)
      ? (row!.currency as CurrencyCode)
      : ('IDR' as CurrencyCode),
    themeMode: row?.theme_mode === 'dark' ? 'dark' : 'light',
    locale: row?.locale === 'id' ? 'id' : 'en',
    ...reminderSettings,
  };
}

export async function setDatabaseReminderSettings(
  database: SQLiteDatabase,
  settings: ReminderSettings,
) {
  const normalized = normalizeReminderSettings(settings);
  await database.runAsync(
    `UPDATE settings SET reminders_enabled = ?, transaction_reminder_enabled = ?,
       period_reminder_enabled = ?, goal_reminder_enabled = ?, transaction_reminder_time = ?,
       notification_permission_requested = ? WHERE id = 1;`,
    normalized.remindersEnabled ? 1 : 0,
    normalized.transactionReminderEnabled ? 1 : 0,
    normalized.periodReminderEnabled ? 1 : 0,
    normalized.goalReminderEnabled ? 1 : 0,
    normalized.transactionReminderTime,
    normalized.notificationPermissionRequested ? 1 : 0,
  );
  return setReminderSettings(normalized);
}
export async function setDatabaseLocale(database: SQLiteDatabase, locale: Locale) {
  await database.runAsync('UPDATE settings SET locale = ? WHERE id = 1;', locale);
  return setSelectedLocale(locale);
}

export async function setDatabaseCurrency(database: SQLiteDatabase, currency: CurrencyCode) {
  await database.runAsync('UPDATE settings SET currency = ? WHERE id = 1;', currency);
  return setSelectedCurrency(currency);
}

export async function setDatabaseThemeMode(database: SQLiteDatabase, mode: ThemeMode) {
  await database.runAsync('UPDATE settings SET theme_mode = ? WHERE id = 1;', mode);
}
