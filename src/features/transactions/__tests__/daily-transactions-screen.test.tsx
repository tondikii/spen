import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { DailyTransactionsScreen } from '@/features/transactions';
import type { Category, Transaction, Wallet } from '@/types/domain';

const onBack = jest.fn();
const onTransactionPress = jest.fn();
const onCreatePress = jest.fn();

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

async function renderScreen(onMonthChange = jest.fn()) {
  const screen = await render(
    <DailyTransactionsScreen
      transactions={transactions}
      categories={[incomeCategory, foodCategory]}
      wallets={[wallet]}
      today="2026-09-01"
      loadedMonth="2026-09"
      onMonthChange={onMonthChange}
      onBack={onBack}
      onTransactionPress={onTransactionPress}
      onCreatePress={onCreatePress}
    />,
  );
  return { screen, onMonthChange };
}

describe('DailyTransactionsScreen', () => {
  beforeEach(() => {
    onBack.mockClear();
    onTransactionPress.mockClear();
    onCreatePress.mockClear();
  });

  it('menampilkan ringkasan dan transaksi pada hari aktif', async () => {
    const { screen } = await renderScreen();
    const { getAllByText, getByLabelText, getByText, queryByLabelText } = screen;

    expect(getByText('Transaksi Harian')).toBeTruthy();
    expect(getByLabelText('Tutup form transaksi')).toBeTruthy();
    expect(getByText('Hari Ini')).toBeTruthy();
    expect(getAllByText(/Rp 6\.500\.000/).length).toBeGreaterThanOrEqual(1);
    expect(getByText(/Kopi pagi/)).toBeTruthy();
    expect(queryByLabelText('Lihat semua transaksi')).toBeNull();
  });

  it('berpindah hari dan menampilkan empty state', async () => {
    const { screen } = await renderScreen();
    const { getByLabelText, getByText } = screen;

    await fireEvent.press(getByLabelText('Hari berikutnya'));
    await waitFor(() => expect(getByText('Belum ada catatan')).toBeTruthy());
    expect(getByText('Tidak ada transaksi pada 2 Sep.')).toBeTruthy();
  });

  it('membuka calendar picker dan memilih tanggal', async () => {
    const { screen, onMonthChange } = await renderScreen();
    const { getByLabelText, getByText } = screen;

    await fireEvent.press(getByLabelText('Pilih tanggal'));
    await fireEvent.press(getByLabelText('Tanggal 2026-08-31'));
    await waitFor(() => expect(getByText('Kemarin')).toBeTruthy());
    expect(onMonthChange).toHaveBeenCalledWith('2026-08');
  });

  it('berpindah bulan dari calendar picker', async () => {
    const { screen } = await renderScreen();
    const { getByLabelText, getByText } = screen;

    await fireEvent.press(getByLabelText('Pilih tanggal'));
    await fireEvent.press(getByLabelText('Bulan sebelumnya'));

    await waitFor(() => expect(getByText('Agustus 2026')).toBeTruthy());
  });
});
