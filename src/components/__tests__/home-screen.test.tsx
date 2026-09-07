import { fireEvent, render, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/components/home-screen';
import { changeLocale } from '@/i18n';

describe('HomeScreen', () => {
  it('menampilkan label View all secara utuh pada locale English', async () => {
    await changeLocale('en');

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('View all', { exact: true })).toHaveProp('numberOfLines', 1);
  });

  it('menampilkan ringkasan saldo, Wallet, dan transaksi terbaru tanpa card Spare budget', async () => {
    const { getAllByLabelText, getByText, queryByText } = await render(<HomeScreen />);

    expect(getByText('Rp 9.275.000')).toBeTruthy();
    expect(getByText(/Saldo total/)).toBeTruthy();
    expect(getByText('Dompet')).toBeTruthy();
    expect(getAllByLabelText('Tambah Dompet')).toHaveLength(1);
    expect(queryByText('T')).toBeNull();
    expect(queryByText('B')).toBeNull();
    expect(queryByText('G')).toBeNull();
    expect(queryByText('D')).toBeNull();
    expect(queryByText('termasuk Dompet terarsip')).toBeNull();
    expect(queryByText('SISA ANGGARAN')).toBeNull();
    expect(queryByText('44% dari pendapatan')).toBeNull();
    expect(getByText('Gaji')).toBeTruthy();
    expect(getByText(/Kopi dan sarapan/)).toBeTruthy();
  });

  it('memasukkan saldo Wallet terarsip ke Saldo total dan memberi konteks', async () => {
    const archivedWallet = {
      id: 'wallet-arsip-total',
      name: 'Dompet Lama',
      initialBalance: 125000,
      balance: 100000,
      isSavings: false,
      archived: true,
      tint: 'gold' as const,
    };
    const { getByText } = await render(<HomeScreen archivedWallets={[archivedWallet]} />);

    expect(getByText('Rp 9.375.000')).toBeTruthy();
    expect(getByText('termasuk Dompet terarsip')).toBeTruthy();
  });

  it('membuka form edit langsung saat Wallet ditekan dan menyediakan archive', async () => {
    const { getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));

    await waitFor(() => expect(getByText('Edit Dompet')).toBeTruthy());
    expect(getByLabelText('Nama Dompet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Dompet').props.value).toBe('350.000');
    expect(getByText('Arsipkan Dompet')).toBeTruthy();
  });

  it('membuka form dan menambahkan Wallet ke daftar', async () => {
    const { getAllByLabelText, getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getAllByLabelText('Tambah Dompet')[0]);
    await waitFor(() => expect(getByLabelText('Nama Dompet')).toBeTruthy());
    await fireEvent.changeText(getByLabelText('Nama Dompet'), 'Jago');
    await fireEvent.changeText(getByLabelText('Saldo awal'), '500000');
    await fireEvent.press(getByLabelText('Simpan Dompet'));

    await waitFor(() => expect(getByText('Jago')).toBeTruthy());
    expect(getByText('Rp 500.000')).toBeTruthy();
  });

  it('mengedit nama dan saldo Wallet melalui form yang sama', async () => {
    const { getByLabelText, getByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));
    await waitFor(() => expect(getByText('Edit Dompet')).toBeTruthy());

    expect(getByLabelText('Nama Dompet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Dompet').props.value).toBe('350.000');
    await fireEvent.changeText(getByLabelText('Nama Dompet'), 'Tunai Baru');
    await fireEvent.changeText(getByLabelText('Saldo Dompet'), '400000');
    await fireEvent.press(getByLabelText('Simpan Dompet'));

    await waitFor(() => expect(getByText('Tunai Baru')).toBeTruthy());
    expect(getByText('Rp 400.000')).toBeTruthy();
  });

  it('mengarsipkan Wallet dari detail dan menghapusnya dari daftar aktif', async () => {
    const { getByLabelText, queryByText } = await render(<HomeScreen />);

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));
    await fireEvent.press(getByLabelText('Arsipkan Dompet'));
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

    expect(getByText('Dompet diarsipkan')).toBeTruthy();
    expect(queryByLabelText('Kembalikan Dompet Dompet Lama')).toBeNull();

    await fireEvent.press(getByLabelText('Buka Dompet diarsipkan'));
    expect(getByLabelText('Kembalikan Dompet Dompet Lama')).toBeTruthy();
    expect(getByText('Rp 100.000 · Terarsip')).toBeTruthy();

    await fireEvent.press(getByLabelText('Kembalikan Dompet Dompet Lama'));
    expect(onWalletRestore).toHaveBeenCalledWith(archivedWallet);
  });
});
