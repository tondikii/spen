import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import SettingsScreen from '@/components/settings-screen';
import { AppThemeProvider } from '@/components/theme-provider';

describe('SettingsScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('menampilkan pengaturan tema, currency, data, dan footer', async () => {
    const { getByText } = await render(<AppThemeProvider><SettingsScreen /></AppThemeProvider>);

    expect(getByText('Tema gelap')).toBeTruthy();
    expect(getByText('Mata uang')).toBeTruthy();
    expect(getByText('Backup data')).toBeTruthy();
    expect(getByText('Spen')).toBeTruthy();
  });

  it('mengubah theme dan currency dari mock state', async () => {
    const { getByLabelText, getByText } = await render(<AppThemeProvider><SettingsScreen /></AppThemeProvider>);

    await fireEvent.press(getByLabelText('Tema gelap'));
    await fireEvent.press(getByLabelText('Pilih mata uang'));
    await fireEvent.press(getByLabelText('Pilih mata uang USD'));

    await waitFor(() => expect(getByText('USD⌄')).toBeTruthy());
  });

  it('meneruskan aksi FAQ ke navigasi screen baru', async () => {
    const onFaqPress = jest.fn();
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <SettingsScreen onFaqPress={onFaqPress} />
      </AppThemeProvider>,
    );

    await fireEvent.press(getByLabelText('FAQ'));

    expect(onFaqPress).toHaveBeenCalledTimes(1);
  });

  it('membuka dokumen legal di origin web yang dikonfigurasi', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText } = await render(<AppThemeProvider><SettingsScreen /></AppThemeProvider>);

    await fireEvent.press(getByLabelText('Syarat & Ketentuan'));
    await fireEvent.press(getByLabelText('Kebijakan Privasi'));

    await waitFor(() => {
      expect(openURL).toHaveBeenNthCalledWith(1, 'http://localhost:8081/terms');
      expect(openURL).toHaveBeenNthCalledWith(2, 'http://localhost:8081/privacy');
    });
  });

  it('membaca origin web dari environment variable', async () => {
    const previousWebUrl = process.env.EXPO_PUBLIC_WEB_URL;
    process.env.EXPO_PUBLIC_WEB_URL = 'https://spen.app/';
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    try {
      const { getByLabelText } = await render(<AppThemeProvider><SettingsScreen /></AppThemeProvider>);
      await fireEvent.press(getByLabelText('Syarat & Ketentuan'));
      await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://spen.app/terms'));
    } finally {
      if (previousWebUrl === undefined) delete process.env.EXPO_PUBLIC_WEB_URL;
      else process.env.EXPO_PUBLIC_WEB_URL = previousWebUrl;
    }
  });
});
