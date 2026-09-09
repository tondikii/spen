import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import SettingsScreen from '@/components/settings-screen';
import { AppThemeProvider } from '@/components/theme-provider';
import { changeLocale } from '@/i18n';
import {
  DEFAULT_REMINDER_SETTINGS,
  setReminderSettings,
  setSelectedLocale,
} from '@/services/settings-service';
import {
  cancelAllReminderNotifications,
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
} from '@/services/notification-service';

jest.mock('@/services/notification-service', () => ({
  cancelAllReminderNotifications: jest.fn(),
  getNotificationPermissionStatus: jest.fn().mockResolvedValue('granted'),
  openNotificationSettings: jest.fn(),
  requestNotificationPermission: jest.fn().mockResolvedValue('granted'),
}));

describe('SettingsScreen', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    setReminderSettings(DEFAULT_REMINDER_SETTINGS);
    setSelectedLocale('id');
    await changeLocale('id');
  });

  it('menampilkan pengaturan tema, currency, data, dan footer', async () => {
    const { getByText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    expect(getByText('Tema gelap')).toBeTruthy();
    expect(getByText('Mata Uang')).toBeTruthy();
    expect(getByText('$')).toBeTruthy();
    expect(getByText('Backup data')).toBeTruthy();
    expect(getByText('Spen')).toBeTruthy();
  });

  it('menampilkan dan menyimpan pengaturan Pengingat', async () => {
    const { getByDisplayValue, getByLabelText, getByText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    await waitFor(() => expect(getByText('Pengingat')).toBeTruthy());
    expect(getByDisplayValue('20:00')).toBeTruthy();

    await fireEvent.press(getByLabelText('Catat transaksi harian'));

    expect(getByLabelText('Catat transaksi harian').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
    expect(getByLabelText('Pengingat aktif').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });

  it('mematikan master membatalkan jadwal tanpa menghapus pilihan jenis Pengingat', async () => {
    setReminderSettings({
      ...DEFAULT_REMINDER_SETTINGS,
      remindersEnabled: true,
      transactionReminderEnabled: true,
    });
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    await waitFor(() =>
      expect(getByLabelText('Pengingat aktif').props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true }),
      ),
    );
    await fireEvent.press(getByLabelText('Pengingat aktif'));

    expect(cancelAllReminderNotifications).toHaveBeenCalledTimes(1);
    expect(getByLabelText('Pengingat aktif').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
    expect(getByLabelText('Catat transaksi harian').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
  });

  it('menampilkan aksi Settings perangkat saat izin notifikasi ditolak', async () => {
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('denied');
    const { getByLabelText, getByText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    await waitFor(() => expect(getByText('Izin notifikasi belum aktif')).toBeTruthy());
    expect(requestNotificationPermission).not.toHaveBeenCalled();
    await fireEvent.press(getByLabelText('Izin notifikasi belum aktif'));
    expect(openNotificationSettings).toHaveBeenCalledTimes(1);
  });

  it('mengubah theme dan currency dari mock state', async () => {
    const { getByLabelText, getByText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    await fireEvent.press(getByLabelText('Tema gelap'));
    await fireEvent.press(getByLabelText('Pilih mata uang'));
    await fireEvent.press(getByLabelText('Pilih mata uang USD'));

    await waitFor(() => expect(getByText('USD')).toBeTruthy());
  });

  it('mengubah bahasa lewat dropdown baru', async () => {
    const { getByLabelText, getByText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

    await fireEvent.press(getByLabelText('Pilih bahasa aplikasi'));
    await fireEvent.press(getByLabelText('Pilih bahasa English'));

    await waitFor(() => expect(getByText('EN')).toBeTruthy());
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
    const { getByLabelText } = await render(
      <AppThemeProvider>
        <SettingsScreen />
      </AppThemeProvider>,
    );

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
      const { getByLabelText } = await render(
        <AppThemeProvider>
          <SettingsScreen />
        </AppThemeProvider>,
      );
      await fireEvent.press(getByLabelText('Syarat & Ketentuan'));
      await waitFor(() => expect(openURL).toHaveBeenCalledWith('https://spen.app/terms'));
    } finally {
      if (previousWebUrl === undefined) delete process.env.EXPO_PUBLIC_WEB_URL;
      else process.env.EXPO_PUBLIC_WEB_URL = previousWebUrl;
    }
  });
});
