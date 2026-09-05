jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import HistoryScreen from '@/components/history-screen';
import type { Transaction, Wallet } from '@/types/domain';

describe('HistoryScreen', () => {
  it('mengelompokkan transaksi berdasarkan hari dan menampilkan filter', async () => {
    const { getByText, getByLabelText } = await render(<HistoryScreen />);

    expect(getByText('Riwayat')).toBeTruthy();
    expect(getByText(/1 September/)).toBeTruthy();
    expect(getByLabelText('Filter')).toBeTruthy();
  });

  it('membuka filter sheet dan menyaring kategori', async () => {
    const { getByLabelText, getAllByText, queryByText } = await render(<HistoryScreen />);

    await fireEvent.press(getByLabelText('Filter'));
    await fireEvent.press(getByLabelText('Filter Kategori Makan'));

    await waitFor(() => expect(getAllByText('Makan').length).toBeGreaterThan(0));
    expect(queryByText('Gaji September')).toBeNull();
  });

  it('menyaring transaksi nyata berdasarkan wallet dan membuka form edit', async () => {
    const wallet: Wallet = {
      id: 'wallet-bca',
      name: 'BCA',
      initialBalance: 0,
      balance: 100,
      isSavings: false,
      archived: false,
      tint: 'pine',
    };
    const transaction: Transaction = {
      id: 'transaction-bca',
      type: 'expense',
      walletId: wallet.id,
      toWalletId: null,
      categoryId: 'category-makan',
      amount: 25_000,
      date: '2026-09-01',
      time: '12:00',
      note: 'Lunch',
    };
    const { getByLabelText, getByText } = await render(
      <HistoryScreen transactions={[transaction]} wallets={[wallet]} />,
    );

    expect(getByText(/BCA/)).toBeTruthy();
    await fireEvent.press(getByLabelText('Filter'));
    await fireEvent.press(getByLabelText('Pilih Wallet BCA'));
    expect(getByText(/Lunch/)).toBeTruthy();
    await fireEvent.press(getByLabelText('Edit transaksi Makan'));
    expect(require('expo-router').router.push).toHaveBeenCalledWith({
      pathname: '/create',
      params: { transactionId: 'transaction-bca' },
    });
  });
});
