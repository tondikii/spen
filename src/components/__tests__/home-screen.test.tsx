import { fireEvent, render, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/components/home-screen';

describe('HomeScreen', () => {
  it('menampilkan ringkasan saldo, Wallet, spare budget, dan transaksi terbaru', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Rp 9.275.000')).toBeTruthy();
    expect(getByText('Wallet')).toBeTruthy();
    expect(getByText('SPARE BUDGET')).toBeTruthy();
    expect(getByText('Gaji')).toBeTruthy();
    expect(getByText(/Kopi dan sarapan/)).toBeTruthy();
  });

  it('membuka detail Wallet dan menjelaskan transaksi penyesuaian', async () => {
    const { getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Buka Wallet Tunai'));

    await waitFor(() => expect(getByText('Koreksi saldo')).toBeTruthy());
    expect(getByText('Buat transaksi penyesuaian')).toBeTruthy();
    expect(getByText('Edit Wallet')).toBeTruthy();
    expect(getByText('Arsipkan Wallet')).toBeTruthy();
  });

  it('membuka form dan menambahkan Wallet ke daftar', async () => {
    const { getAllByLabelText, getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getAllByLabelText('Tambah Wallet')[0]);
    await waitFor(() => expect(getByLabelText('Nama Wallet')).toBeTruthy());
    await fireEvent.changeText(getByLabelText('Nama Wallet'), 'Jago');
    await fireEvent.changeText(getByLabelText('Saldo awal'), '500000');
    await fireEvent.press(getByLabelText('Simpan Wallet'));

    await waitFor(() => expect(getByText('Jago')).toBeTruthy());
    expect(getByText('Rp 500.000')).toBeTruthy();
  });
});
