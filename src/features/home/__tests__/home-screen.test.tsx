import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import HomeScreen from '@/features/home';
import { changeLocale } from '@/i18n';
import type { Category, Transaction, Wallet } from '@/types/domain';

const walletTunai: Wallet = {
  id: 'wallet-tunai',
  name: 'Tunai',
  initialBalance: 350000,
  balance: 350000,
  isSavings: false,
  archived: false,
  tint: 'pine',
};

const walletBca: Wallet = {
  id: 'wallet-bca',
  name: 'BCA',
  initialBalance: 8925000,
  balance: 8925000,
  isSavings: false,
  archived: false,
  tint: 'gold',
};

const categoryGaji: Category = {
  id: 'category-gaji',
  name: 'Gaji',
  type: 'income',
  icon: 'briefcase-outline',
  archived: false,
  isAdjustment: false,
};

const categoryMakan: Category = {
  id: 'category-makan',
  name: 'Makan',
  type: 'expense',
  icon: 'cash-multiple',
  archived: false,
  isAdjustment: false,
};

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'expense',
    walletId: 'wallet-tunai',
    toWalletId: null,
    categoryId: 'category-makan',
    amount: 25000,
    date: '2026-09-01',
    time: '08:15',
    note: 'Kopi dan sarapan',
  },
  {
    id: 'transaction-2',
    type: 'income',
    walletId: 'wallet-bca',
    toWalletId: null,
    categoryId: 'category-gaji',
    amount: 6500000,
    date: '2026-09-01',
    time: '07:00',
    note: '',
  },
];

function renderScreen(props: Partial<ComponentProps<typeof HomeScreen>> = {}) {
  return render(
    <HomeScreen
      wallets={[walletTunai, walletBca]}
      archivedWallets={[]}
      transactions={transactions}
      categories={[categoryGaji, categoryMakan]}
      onTransactionPress={jest.fn()}
      onDailyPress={jest.fn()}
      onWalletSave={jest.fn()}
      onWalletArchive={jest.fn()}
      onWalletRestore={jest.fn()}
      {...props}
    />,
  );
}

describe('HomeScreen', () => {
  it('menampilkan label View all secara utuh pada locale English', async () => {
    await changeLocale('en');

    const { getByText } = await renderScreen();

    expect(getByText('View all', { exact: true })).toHaveProp('numberOfLines', 1);
  });

  it('menampilkan ringkasan saldo, Wallet, dan transaksi terbaru tanpa card Spare budget', async () => {
    const { getAllByLabelText, getByText, queryByText } = await renderScreen();

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
    const archivedWallet: Wallet = {
      id: 'wallet-arsip-total',
      name: 'Dompet Lama',
      initialBalance: 125000,
      balance: 100000,
      isSavings: false,
      archived: true,
      tint: 'gold',
    };
    const { getByText } = await renderScreen({ archivedWallets: [archivedWallet] });

    expect(getByText('Rp 9.375.000')).toBeTruthy();
    expect(getByText('termasuk Dompet terarsip')).toBeTruthy();
  });

  it('membuka form edit langsung saat Wallet ditekan dan menyediakan archive', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));

    await waitFor(() => expect(getByText('Edit Dompet')).toBeTruthy());
    expect(getByLabelText('Nama Dompet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Dompet').props.value).toBe('350.000');
    expect(getByText('Arsipkan Dompet')).toBeTruthy();
  });

  it('meneruskan Wallet baru ke onWalletSave tanpa wallet sumber', async () => {
    const onWalletSave = jest.fn();
    const { getAllByLabelText, getByLabelText } = await renderScreen({ onWalletSave });

    await fireEvent.press(getAllByLabelText('Tambah Dompet')[0]!);
    await waitFor(() => expect(getByLabelText('Nama Dompet')).toBeTruthy());
    await fireEvent.changeText(getByLabelText('Nama Dompet'), 'Jago');
    await fireEvent.changeText(getByLabelText('Saldo awal'), '500000');
    await fireEvent.press(getByLabelText('Simpan Dompet'));

    await waitFor(() => expect(onWalletSave).toHaveBeenCalledWith(null, 'Jago', 500000));
  });

  it('meneruskan perubahan Wallet ke onWalletSave melalui form yang sama', async () => {
    const onWalletSave = jest.fn();
    const { getByLabelText } = await renderScreen({ onWalletSave });

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));
    await waitFor(() => expect(getByLabelText('Nama Dompet')).toBeTruthy());

    expect(getByLabelText('Nama Dompet').props.value).toBe('Tunai');
    expect(getByLabelText('Saldo Dompet').props.value).toBe('350.000');
    await fireEvent.changeText(getByLabelText('Nama Dompet'), 'Tunai Baru');
    await fireEvent.changeText(getByLabelText('Saldo Dompet'), '400000');
    await fireEvent.press(getByLabelText('Simpan Dompet'));

    await waitFor(() =>
      expect(onWalletSave).toHaveBeenCalledWith(walletTunai, 'Tunai Baru', 400000),
    );
  });

  it('meneruskan Wallet yang diarsipkan ke onWalletArchive', async () => {
    const onWalletArchive = jest.fn();
    const { getByLabelText } = await renderScreen({ onWalletArchive });

    await fireEvent.press(getByLabelText('Pilih Dompet Tunai'));
    await fireEvent.press(getByLabelText('Arsipkan Dompet'));
    await fireEvent.press(getByLabelText('Arsipkan'));

    await waitFor(() => expect(onWalletArchive).toHaveBeenCalledWith(walletTunai));
  });

  it('menyembunyikan Wallet arsip sampai dibuka dan menyediakan aksi kembalikan', async () => {
    const archivedWallet: Wallet = {
      id: 'wallet-arsip',
      name: 'Dompet Lama',
      initialBalance: 125000,
      balance: 100000,
      isSavings: false,
      archived: true,
      tint: 'gold',
    };
    const onWalletRestore = jest.fn();
    const { getByLabelText, getByText, queryByLabelText } = await renderScreen({
      archivedWallets: [archivedWallet],
      onWalletRestore,
    });

    expect(getByText('Dompet diarsipkan')).toBeTruthy();
    expect(queryByLabelText('Kembalikan Dompet Dompet Lama')).toBeNull();

    await fireEvent.press(getByLabelText('Buka Dompet diarsipkan'));
    expect(getByLabelText('Kembalikan Dompet Dompet Lama')).toBeTruthy();
    expect(getByText('Rp 100.000 · Terarsip')).toBeTruthy();

    await fireEvent.press(getByLabelText('Kembalikan Dompet Dompet Lama'));
    expect(onWalletRestore).toHaveBeenCalledWith(archivedWallet);
  });
});
