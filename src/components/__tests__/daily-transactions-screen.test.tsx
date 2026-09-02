jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import DailyTransactionsScreen from '@/components/daily-transactions-screen';

describe('DailyTransactionsScreen', () => {
  it('menampilkan ringkasan dan transaksi pada hari aktif', async () => {
    const { getAllByText, getByText } = await render(<DailyTransactionsScreen />);

    expect(getByText('Hari Ini')).toBeTruthy();
    expect(getAllByText(/Rp 6\.500\.000/).length).toBeGreaterThanOrEqual(1);
    expect(getByText(/Kopi dan sarapan/)).toBeTruthy();
  });

  it('berpindah hari dan menampilkan empty state', async () => {
    const { getByLabelText, getByText } = await render(<DailyTransactionsScreen />);

    await fireEvent.press(getByLabelText('Hari berikutnya'));
    await waitFor(() => expect(getByText('Belum ada catatan')).toBeTruthy());
    expect(getByText('Tidak ada transaksi pada 2 Sep.')).toBeTruthy();
  });

  it('membuka calendar picker dan memilih tanggal', async () => {
    const { getByLabelText, getByText } = await render(<DailyTransactionsScreen />);

    await fireEvent.press(getByLabelText('Pilih tanggal'));
    await fireEvent.press(getByLabelText('Tanggal 2026-08-31'));
    await waitFor(() => expect(getByText('Kemarin')).toBeTruthy());
  });
});
