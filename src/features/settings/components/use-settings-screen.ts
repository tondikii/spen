import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CurrencyCode, Locale } from '@/types/domain';
import { getErrorTranslationKey } from '@/utils/app-error';

export type RestorePick = { content: string; name: string };

type SettingsActions = {
  onCurrencyChange: (option: CurrencyCode) => void | Promise<void>;
  onLocaleChange: (option: Locale) => void | Promise<void>;
  onBackup: () => void | Promise<void>;
  onPickRestore: () => Promise<RestorePick | null>;
  onConfirmRestore: (content: string) => void | Promise<void>;
  onOpenLink: (url: string) => void | Promise<void>;
};

/**
 * UI state + orkestrasi SettingsScreen (pure screen ADR-0008): layar tidak
 * memegang database — aksi datang sebagai callback dari route adapter, dan
 * hook ini hanya mengelola toggle dropdown, busy, modal konfirmasi restore,
 * serta toast hasil aksi.
 */
export function useSettingsScreen(actions: SettingsActions) {
  const { t } = useTranslation();
  const {
    onBackup,
    onConfirmRestore,
    onCurrencyChange,
    onLocaleChange,
    onOpenLink,
    onPickRestore,
  } = actions;
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<RestorePick | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  const chooseCurrency = async (option: CurrencyCode) => {
    try {
      await onCurrencyChange(option);
      setCurrencyOpen(false);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const chooseLocale = async (option: Locale) => {
    try {
      await onLocaleChange(option);
      setLanguageOpen(false);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const runBackup = async () => {
    setBusy(true);
    try {
      await onBackup();
      showToast(t('common.backupReady'));
    } catch {
      showToast(t('errors.storage'));
    } finally {
      setBusy(false);
    }
  };
  const runRestore = async () => {
    setBusy(true);
    try {
      const picked = await onPickRestore();
      if (picked) setRestoreFile(picked);
    } catch {
      showToast(t('common.backupUnreadable'));
    } finally {
      setBusy(false);
    }
  };
  const confirmRestore = async () => {
    if (!restoreFile) return;
    const file = restoreFile;
    setRestoreFile(null);
    setBusy(true);
    try {
      await onConfirmRestore(file.content);
      showToast(t('common.restored'));
    } catch (cause) {
      showToast(t(getErrorTranslationKey(cause)));
    } finally {
      setBusy(false);
    }
  };
  const openLink = async (url: string) => {
    try {
      await onOpenLink(url);
    } catch {
      showToast(t('common.pageCannotOpen'));
    }
  };

  return {
    busy,
    chooseCurrency,
    chooseLocale,
    confirmRestore,
    currencyOpen,
    languageOpen,
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
