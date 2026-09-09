import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { changeLocale } from '@/i18n';
import type { CurrencyCode, Locale } from '@/types/domain';
import { getErrorTranslationKey } from '@/utils/app-error';
import {
  getSelectedCurrency,
  getSelectedLocale,
  setSelectedCurrency,
  setSelectedLocale,
} from '@/utils/selection';

import {
  createBackupFile,
  pickBackupContent,
  restoreDatabase,
  shareBackupFile,
} from '../data/backup-repository';
import { setDatabaseCurrency, setDatabaseLocale } from '../data/settings-repository';

/**
 * Local state + actions for SettingsScreen: UI toggles (currency/language
 * dropdowns), backup/restore flow, toast and link opening.
 */
export function useSettingsScreen({ database }: { database?: SQLiteDatabase | undefined }) {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<CurrencyCode>(getSelectedCurrency());
  const [locale, setLocale] = useState<Locale>(getSelectedLocale());
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<{ content: string; name: string } | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  const chooseCurrency = async (option: CurrencyCode) => {
    try {
      setCurrency(
        database ? await setDatabaseCurrency(database, option) : setSelectedCurrency(option),
      );
      setCurrencyOpen(false);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const chooseLocale = async (option: Locale) => {
    try {
      const next = database ? await setDatabaseLocale(database, option) : setSelectedLocale(option);
      setLocale(next);
      await changeLocale(next);
      setLanguageOpen(false);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const runBackup = async () => {
    if (!database) {
      showToast(t('common.backupAvailableInMainApp'));
      return;
    }
    setBusy(true);
    try {
      const fileUri = await createBackupFile(database);
      try {
        await shareBackupFile(fileUri);
        showToast(t('common.backupReady'));
      } finally {
        // Best-effort: file backup tidak menumpuk setelah dibagikan.
        await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
      }
    } catch {
      showToast(t('errors.storage'));
    } finally {
      setBusy(false);
    }
  };
  const runRestore = async () => {
    if (!database) {
      showToast(t('common.restoreAvailableInMainApp'));
      return;
    }
    setBusy(true);
    try {
      const picked = await pickBackupContent();
      setBusy(false);
      if (!picked) return;
      setRestoreFile(picked);
    } catch {
      setBusy(false);
      showToast(t('common.backupUnreadable'));
    }
  };
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showToast(t('common.pageCannotOpen'));
    }
  };
  const confirmRestore = async () => {
    if (!database || !restoreFile) return;
    const file = restoreFile;
    setRestoreFile(null);
    setBusy(true);
    try {
      const restoredLocale = await restoreDatabase(database, file.content);
      setLocale(restoredLocale);
      setSelectedLocale(restoredLocale);
      await changeLocale(restoredLocale);
      showToast(t('common.restored'));
    } catch (cause) {
      showToast(t(getErrorTranslationKey(cause)));
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    chooseCurrency,
    chooseLocale,
    confirmRestore,
    currency,
    currencyOpen,
    languageOpen,
    locale,
    openLink,
    restoreFile,
    runBackup,
    runRestore,
    setCurrencyOpen,
    setLanguageOpen,
    setRestoreFile,
    toast,
  };
}
