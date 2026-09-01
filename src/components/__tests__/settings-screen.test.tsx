import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '@/components/settings-screen';
import { AppThemeProvider } from '@/components/theme-provider';

describe('SettingsScreen', () => {
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
});
