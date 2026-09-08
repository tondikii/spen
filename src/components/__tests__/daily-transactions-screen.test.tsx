import { fireEvent, render, waitFor } from '@testing-library/react-native';

import DailyTransactionsScreen from '@/components/daily-transactions-screen';
import type { Category, Transaction, Wallet } from '@/types/domain';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const wallet: Wallet = {
  id: 'wallet-1',
  name: 'Tunai',
  initialBalance: 0,
  balance: 6475000,
  isSavings: false,
  archived: false,
  tint: 'pine',
};

const incomeCategory: Category = {
  id: 'category-income',
  name: 'Gaji',
  type: 'income',
  icon: 'briefcase-outline',
  archived: false,
  isAdjustment: false,
};

const foodCategory: Category = {
  id: 'category-food',
  name: 'Makan',
  type: 'expense',
  icon: 'cash-multiple',
  archived: false,
  isAdjustment: false,
};

const transactions: Transaction[] = [
  {
    id: 'transaction-2',
    type: 'expense',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-food',
    amount: 25000,
    date: '2026-09-01',
    time: '08:15',
    note: 'Kopi pagi',
  },
  {
    id: 'transaction-1',
    type: 'income',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-income',
    amount: 6500000,
    date: '2026-09-01',
    time: '07:00',
    note: 'Gaji bulan ini',
  },
];

function renderScreen() {
  return render(
    <DailyTransactionsScreen
      transactions={transactions}
      categories={[incomeCategory, foodCategory]}
      wallets={[wallet]}
      today="2026-09-01"
    />,
  );
}

describe('DailyTransactionsScreen', () => {
  it('menampilkan ringkasan dan transaksi pada hari aktif', async () => {
    const { getAllByText, getByLabelText, getByText, queryByLabelText } = await renderScreen();

    expect(getByText('Transaksi Harian')).toBeTruthy();
    expect(getByLabelText('Tutup form transaksi')).toBeTruthy();
    expect(getByText('Hari Ini')).toBeTruthy();
    expect(getAllByText(/Rp 6\.500\.000/).length).toBeGreaterThanOrEqual(1);
    expect(getByText(/Kopi pagi/)).toBeTruthy();
    expect(queryByLabelText('Lihat semua transaksi')).toBeNull();
  });

  it('berpindah hari dan menampilkan empty state', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Hari berikutnya'));
    await waitFor(() => expect(getByText('Belum ada catatan')).toBeTruthy());
    expect(getByText('Tidak ada transaksi pada 2 Sep.')).toBeTruthy();
  });

  it('membuka calendar picker dan memilih tanggal', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih tanggal'));
    await fireEvent.press(getByLabelText('Tanggal 2026-08-31'));
    await waitFor(() => expect(getByText('Kemarin')).toBeTruthy());
  });

  it('berpindah bulan dari calendar picker', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih tanggal'));
    await fireEvent.press(getByLabelText('Bulan sebelumnya'));

    await waitFor(() => expect(getByText('Agustus 2026')).toBeTruthy());
  });
});
