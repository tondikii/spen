import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  SettingsScreen,
  createBackupFile,
  getDatabaseSettings,
  pickBackupContent,
  restoreDatabase,
  setDatabaseCurrency,
  setDatabaseLocale,
  shareBackupFile,
} from '@/features/settings';
import { changeLocale } from '@/i18n';
import useAppDatabase from '@/providers/database-provider';
import {
  getSelectedCurrency,
  getSelectedLocale,
  setSelectedCurrency,
  setSelectedLocale,
} from '@/utils/selection';
import type { CurrencyCode, Locale } from '@/types/domain';
import { reconcileAllReminders } from '@/features/reminders';

export default function SettingsRoute() {
  const router = useRouter();
  const database = useAppDatabase();
  const [settings, setSettings] = useState(() => ({
    currency: getSelectedCurrency(),
    locale: getSelectedLocale(),
  }));

  // Bacaan awal dari tabel settings; layar tetap langsung tampil dengan nilai
  // mirror proses (selection) sebelum hasil query datang.
  useEffect(() => {
    let alive = true;
    void getDatabaseSettings(database)
      .then((value) => {
        if (!alive) return;
        setSelectedCurrency(value.currency);
        setSelectedLocale(value.locale);
        setSettings({ currency: value.currency, locale: value.locale });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [database]);

  const applyCurrency = async (option: CurrencyCode) => {
    await setDatabaseCurrency(database, option);
    setSettings((current) => ({ ...current, currency: option }));
  };
  const applyLocale = async (option: Locale) => {
    await setDatabaseLocale(database, option);
    await changeLocale(option);
    await reconcileAllReminders(database).catch(() => undefined);
    setSettings((current) => ({ ...current, locale: option }));
  };
  const runBackup = async () => {
    const fileUri = await createBackupFile(database);
    try {
      await shareBackupFile(fileUri);
    } finally {
      // Best-effort: file backup tidak menumpuk setelah dibagikan.
      await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
    }
  };
  const runRestore = async (content: string) => {
    const restoredLocale = await restoreDatabase(database, content);
    const restoredSettings = await getDatabaseSettings(database);
    setSelectedLocale(restoredLocale);
    setSelectedCurrency(restoredSettings.currency);
    await changeLocale(restoredLocale);
    await reconcileAllReminders(database).catch(() => undefined);
    setSettings({ currency: restoredSettings.currency, locale: restoredLocale });
  };
  const openLink = async (url: string) => {
    await Linking.openURL(url);
  };

  return (
    <SettingsScreen
      currency={settings.currency}
      locale={settings.locale}
      onCurrencyChange={applyCurrency}
      onLocaleChange={applyLocale}
      onBackup={runBackup}
      onPickRestore={pickBackupContent}
      onConfirmRestore={runRestore}
      onOpenLink={openLink}
      onFaqPress={() => router.push('/settings/faq')}
    />
  );
}
