jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import HistoryScreen from '@/components/history-screen';

describe('HistoryScreen', () => {
  it('mengelompokkan transaksi berdasarkan hari dan menampilkan filter', async () => {
    const { getByText, getByLabelText } = await render(<HistoryScreen />);

    expect(getByText('Riwayat')).toBeTruthy();
    expect(getByText(/1 September/)).toBeTruthy();
    expect(getByLabelText('Filter')).toBeTruthy();
  });

  it('membuka filter sheet dan menyaring kategori', async () => {
    const { getByLabelText, getByText, queryByText } = await render(<HistoryScreen />);

    await fireEvent.press(getByLabelText('Filter'));
    await fireEvent.press(getByLabelText('Pilih filter Makan'));

    await waitFor(() => expect(getByText('Makan')).toBeTruthy());
    expect(queryByText('Gaji September')).toBeNull();
  });
});
