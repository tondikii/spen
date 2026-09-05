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

  it('membuka form edit langsung saat Wallet ditekan dan menyediakan archive', async () => {
    const { getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Wallet Tunai'));

    await waitFor(() => expect(getByText('Edit Wallet')).toBeTruthy());
    expect(getByLabelText('Nama Wallet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Wallet').props.value).toBe('350.000');
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

  it('mengedit nama dan saldo Wallet melalui form yang sama', async () => {
    const { getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Wallet Tunai'));
    await waitFor(() => expect(getByText('Edit Wallet')).toBeTruthy());

    expect(getByLabelText('Nama Wallet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Wallet').props.value).toBe('350.000');
    await fireEvent.changeText(getByLabelText('Nama Wallet'), 'Tunai Baru');
    await fireEvent.changeText(getByLabelText('Saldo Wallet'), '400000');
    await fireEvent.press(getByLabelText('Simpan Wallet'));

    await waitFor(() => expect(getByText('Tunai Baru')).toBeTruthy());
    expect(getByText('Rp 400.000')).toBeTruthy();
  });

  it('mengarsipkan Wallet dari detail dan menghapusnya dari daftar aktif', async () => {
    const { getByLabelText, queryByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Wallet Tunai'));
    await fireEvent.press(getByLabelText('Arsipkan Wallet'));
    await fireEvent.press(getByLabelText('Arsipkan'));

    await waitFor(() => expect(queryByText('Buka Wallet Tunai')).toBeNull());
  });

  it('menyembunyikan Wallet arsip sampai dibuka dan menyediakan aksi kembalikan', async () => {
    const archivedWallet = {
      id: 'wallet-arsip',
      name: 'Dompet Lama',
      initialBalance: 125000,
      balance: 100000,
      isSavings: false,
      archived: true,
      tint: 'gold' as const,
    };
    const onWalletRestore = jest.fn();
    const { getByLabelText, getByText, queryByLabelText } = await render(
      <HomeScreen archivedWallets={[archivedWallet]} onWalletRestore={onWalletRestore} />,
    );

    expect(getByText('Wallet diarsipkan')).toBeTruthy();
    expect(queryByLabelText('Kembalikan Wallet Dompet Lama')).toBeNull();

    await fireEvent.press(getByLabelText('Buka Wallet diarsipkan'));
    expect(getByLabelText('Kembalikan Wallet Dompet Lama')).toBeTruthy();
    expect(getByText('Rp 100.000 · Terarsip')).toBeTruthy();

    await fireEvent.press(getByLabelText('Kembalikan Wallet Dompet Lama'));
    expect(onWalletRestore).toHaveBeenCalledWith(archivedWallet);
  });
});
