import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';
import { useState } from 'react';

import { SettingsScreen } from '@/features/settings';
import { AppThemeProvider } from '@/providers/theme-provider';
import { changeLocale } from '@/i18n';
import {
  getSelectedCurrency,
  getSelectedLocale,
  setSelectedCurrency,
  setSelectedLocale,
} from '@/utils/selection';
import type { CurrencyCode, Locale } from '@/types/domain';

type HarnessOverrides = {
  onCurrencyChange?: (option: CurrencyCode) => void | Promise<void>;
  onLocaleChange?: (option: Locale) => void | Promise<void>;
  onOpenLink?: (url: string) => void | Promise<void>;
  onFaqPress?: () => void;
};

/** Wrapper yang mensimulasikan route adapter: nilai + callback tanpa database. */
function SettingsScreenHarness({
  onCurrencyChange,
  onLocaleChange,
  onOpenLink,
  onFaqPress,
}: HarnessOverrides) {
  const [currency, setCurrency] = useState(getSelectedCurrency());
  const [locale, setLocale] = useState(getSelectedLocale());
  return (
    <SettingsScreen
      currency={currency}
      locale={locale}
      onCurrencyChange={async (option) => {
        setSelectedCurrency(option);
        setCurrency(option);
        await onCurrencyChange?.(option);
      }}
      onLocaleChange={async (option) => {
        setSelectedLocale(option);
        setLocale(option);
        await changeLocale(option);
        await onLocaleChange?.(option);
      }}
      onBackup={async () => undefined}
      onPickRestore={async () => null}
      onConfirmRestore={async () => undefined}
      onOpenLink={async (url) => {
        await onOpenLink?.(url);
      }}
      onFaqPress={onFaqPress ?? (() => undefined)}
    />
  );
}

function renderScreen(overrides: HarnessOverrides = {}) {
  return render(
    <AppThemeProvider>
      <SettingsScreenHarness {...overrides} />
    </AppThemeProvider>,
  );
}

describe('SettingsScreen', () => {
  afterEach(async () => {
    cleanup();
    jest.restoreAllMocks();
    setSelectedLocale('id');
    await changeLocale('id');
  });

  it('menampilkan pengaturan tema, currency, data, dan footer', async () => {
    const { getByText } = await renderScreen();

    expect(getByText('Tema gelap')).toBeTruthy();
    expect(getByText('Mata Uang')).toBeTruthy();
    expect(getByText('$')).toBeTruthy();
    expect(getByText('Backup data')).toBeTruthy();
    expect(getByText('Spen')).toBeTruthy();
  });

  it('mengubah theme dan currency dari mock state', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Tema gelap'));
    await fireEvent.press(getByLabelText('Pilih mata uang'));
    await fireEvent.press(getByLabelText('Pilih mata uang USD'));

    await waitFor(() => expect(getByText('USD')).toBeTruthy());
  });

  it('mengubah bahasa lewat dropdown baru', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih bahasa aplikasi'));
    await fireEvent.press(getByLabelText('Pilih bahasa English'));

    await waitFor(() => expect(getByText('EN')).toBeTruthy());
  });

  it('meneruskan aksi FAQ ke navigasi screen baru', async () => {
    const onFaqPress = jest.fn();
    const { getByLabelText } = await renderScreen({ onFaqPress });

    await fireEvent.press(getByLabelText('FAQ'));

    expect(onFaqPress).toHaveBeenCalledTimes(1);
  });

  it('membuka dokumen legal di origin web yang dikonfigurasi', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText } = await renderScreen({
      onOpenLink: async (url) => {
        await Linking.openURL(url);
      },
    });

    await fireEvent.press(getByLabelText('Syarat & Ketentuan'));
    await fireEvent.press(getByLabelText('Kebijakan Privasi'));

    await waitFor(() => {
      expect(openURL).toHaveBeenNthCalledWith(1, 'http://10.89.182.246:8081/terms');
      expect(openURL).toHaveBeenNthCalledWith(2, 'http://10.89.182.246:8081/privacy');
    });
  });

  it('membaca origin web dari environment variable', async () => {
    const previousWebUrl = process.env.EXPO_PUBLIC_WEB_URL;
    process.env.EXPO_PUBLIC_WEB_URL = 'https://spen.app/';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    try {
      const { getByLabelText } = await renderScreen({
        onOpenLink: async (url) => {
          await Linking.openURL(url);
        },
      });
      await fireEvent.press(getByLabelText('Syarat & Ketentuan'));
      await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://spen.app/terms'));
    } finally {
      if (previousWebUrl === undefined) delete process.env.EXPO_PUBLIC_WEB_URL;
      else process.env.EXPO_PUBLIC_WEB_URL = previousWebUrl;
    }
  });
});
