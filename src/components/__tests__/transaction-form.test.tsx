import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { TransactionForm } from '@/components/transaction-form';
import { todayISO } from '@/lib/date';
import type { Category, Transaction, Wallet } from '@/types/domain';

const wallets: Wallet[] = [
  {
    id: 'wallet-tunai',
    name: 'Tunai',
    initialBalance: 350000,
    balance: 350000,
    isSavings: false,
    archived: false,
    tint: 'pine',
  },
  {
    id: 'wallet-bca',
    name: 'BCA',
    initialBalance: 2000000,
    balance: 5095000,
    isSavings: false,
    archived: false,
    tint: 'pine',
  },
  {
    id: 'wallet-gopay',
    name: 'GoPay',
    initialBalance: 125000,
    balance: 80000,
    isSavings: false,
    archived: false,
    tint: 'gold',
  },
  {
    id: 'wallet-dana-nikah',
    name: 'Dana Nikah',
    initialBalance: 1250000,
    balance: 1750000,
    isSavings: true,
    archived: false,
    tint: 'goal',
  },
];

const categories: Category[] = [
  {
    id: 'category-gaji',
    name: 'Gaji',
    systemKey: 'salary',
    type: 'income',
    icon: 'cash-multiple',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-makan',
    name: 'Makan',
    systemKey: 'food',
    type: 'expense',
    icon: 'silverware-fork-knife',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-kesehatan',
    name: 'Kesehatan',
    systemKey: 'health',
    type: 'expense',
    icon: 'medical-bag',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-transfer',
    name: 'Transfer',
    systemKey: 'transfer',
    type: 'transfer',
    icon: 'bank-transfer',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-saldo-awal',
    name: 'Saldo Awal',
    systemKey: 'openingBalance',
    type: 'income',
    icon: 'wallet-plus-outline',
    archived: false,
    isAdjustment: true,
  },
];

const editTransaction: Transaction = {
  id: 'transaction-2',
  type: 'expense',
  walletId: 'wallet-gopay',
  toWalletId: null,
  categoryId: 'category-makan',
  amount: 45000,
  date: '2026-09-01',
  time: '08:15',
  note: 'Kopi dan sarapan',
};

const initialBalanceTransaction: Transaction = {
  id: 'transaction-awal',
  type: 'income',
  walletId: 'wallet-bca',
  toWalletId: null,
  categoryId: 'category-saldo-awal',
  amount: 1000000,
  date: '2026-09-01',
  time: '08:00',
  note: 'Saldo awal Dompet',
  isInitial: true,
};

function renderForm(props: Partial<ComponentProps<typeof TransactionForm>> = {}) {
  return render(
    <TransactionForm
      mode="create"
      wallets={wallets}
      categories={categories}
      existingTransactions={[]}
      onClose={jest.fn()}
      onSave={jest.fn()}
      onCategorySave={async (category) => category}
      onCategoryArchive={jest.fn()}
      {...props}
    />,
  );
}

describe('TransactionForm', () => {
  it('mencatat expense dengan wallet, kategori, nominal, dan catatan', async () => {
    const onSave = jest.fn();
    const { getByLabelText } = await renderForm({ onSave });

    await fireEvent.press(getByLabelText('Tipe Pengeluaran'));
    await fireEvent.press(getByLabelText('Pilih Dompet GoPay'));
    await fireEvent.press(getByLabelText('Kategori Makan'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '45000');
    await fireEvent.changeText(getByLabelText('Catatan transaksi'), 'Kopi');
    await fireEvent.press(getByLabelText('Simpan Transaksi'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          walletId: 'wallet-gopay',
          categoryId: 'category-makan',
          amount: 45000,
          note: 'Kopi',
        }),
      ),
    );
  });

  it('merender tiga tab tipe transaksi dengan wrapper yang membagi lebar secara merata', async () => {
    const { getAllByRole } = await renderForm();

    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs.every((tab) => tab.parent?.props.style?.[0]?.flex === 1)).toBe(true);
  });

  it('merender picker kategori dalam empat kolom', async () => {
    const { getByTestId } = await renderForm();

    expect(getByTestId('category-row-0').children).toHaveLength(4);
  });

  it('mencari kategori berdasarkan nama', async () => {
    const { getByLabelText, getByText, queryByLabelText } = await renderForm();

    await fireEvent.press(getByLabelText('Tipe Pengeluaran'));
    await fireEvent.changeText(getByLabelText('Cari kategori'), 'kesehatan');

    expect(getByLabelText('Kategori Kesehatan')).toBeTruthy();
    expect(queryByLabelText('Kategori Makan')).toBeNull();

    await fireEvent.changeText(getByLabelText('Cari kategori'), 'tidak ada');
    expect(getByText('Kategori tidak ditemukan.')).toBeTruthy();
  });

  it('membuka edit state dengan data terisi dan tombol hapus', async () => {
    const onDelete = jest.fn();
    const { getByLabelText, getByText } = await renderForm({
      mode: 'edit',
      transaction: editTransaction,
      onDelete,
    });

    expect(getByText('Edit')).toBeTruthy();
    expect(getByLabelText('Nominal transaksi').props.value).toBe('45.000');
    expect(getByLabelText('Catatan transaksi').props.value).toBe('Kopi dan sarapan');
    expect(getByText('Hapus Transaksi')).toBeTruthy();
  });

  it('menampilkan warning lembut saat expense melewati alokasi', async () => {
    const { getByLabelText, getByText } = await renderForm({ allocationLimit: 1_200_000 });

    await fireEvent.press(getByLabelText('Tipe Pengeluaran'));
    await fireEvent.press(getByLabelText('Kategori Makan'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '1300000');

    await waitFor(() => expect(getByText(/melebihi alokasi/)).toBeTruthy());
  });

  it('menampilkan peringatan saat income mirip sudah tercatat di hari yang sama', async () => {
    const existing: Transaction = {
      id: 'transaction-1',
      type: 'income',
      walletId: 'wallet-bca',
      toWalletId: null,
      categoryId: 'category-gaji',
      amount: 6500000,
      date: todayISO(),
      time: '07:00',
      note: '',
    };
    const { getByLabelText, getByText } = await renderForm({ existingTransactions: [existing] });

    await fireEvent.press(getByLabelText('Pilih Dompet BCA'));
    await fireEvent.press(getByLabelText('Kategori Gaji'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '6500000');

    await waitFor(() => expect(getByText(/mungkin dobel/)).toBeTruthy());
  });

  it('memungkinkan CRUD kategori inline tanpa menghapus data saat archive', async () => {
    const onCategoryArchive = jest.fn();
    const { getByLabelText, queryByLabelText } = await renderForm({ onCategoryArchive });

    await fireEvent.press(getByLabelText('Tipe Pengeluaran'));
    await fireEvent.press(getByLabelText('Kelola kategori'));
    await fireEvent.changeText(getByLabelText('Nama kategori baru'), 'Koleksi');
    await fireEvent.press(getByLabelText('Simpan kategori'));
    await fireEvent.press(getByLabelText('Kelola kategori'));
    await fireEvent(getByLabelText('Kategori Koleksi'), 'longPress');
    await fireEvent.press(getByLabelText('Arsipkan kategori Koleksi'));
    await fireEvent.press(getByLabelText('Arsipkan'));

    expect(onCategoryArchive).toHaveBeenCalled();
    expect(queryByLabelText('Kategori Koleksi')).toBeNull();
  });

  it('menerima preset dari aksi plan untuk membuka form transaksi siap catat', async () => {
    const { getByLabelText } = await renderForm({
      initialType: 'expense',
      initialCategoryId: 'category-makan',
      initialAmount: 175000,
    });

    expect(getByLabelText('Nominal transaksi').props.value).toBe('175.000');
    expect(getByLabelText('Kategori Makan')).toBeTruthy();
  });

  it('mengunci tujuan transfer saat transaksi berasal dari Goal', async () => {
    const { getAllByText, getByText } = await renderForm({
      initialType: 'transfer',
      initialToWalletId: 'wallet-dana-nikah',
      lockedToWalletId: 'wallet-dana-nikah',
    });

    expect(getByText('Tujuan Dompet Tabungan terkunci')).toBeTruthy();
    expect(getAllByText('Dana Nikah').length).toBeGreaterThan(0);
  });

  it('menyimpan biaya admin opsional pada Transfer', async () => {
    const onSave = jest.fn();
    const { getByLabelText } = await renderForm({ initialType: 'transfer', onSave });

    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '100000');
    await fireEvent.changeText(getByLabelText('Biaya admin transfer'), '2500');
    await fireEvent.press(getByLabelText('Simpan Transaksi'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'transfer', amount: 100000, adminFee: 2500 }),
    );
  });

  it('menyimpan perubahan transaksi saldo awal dengan kategori internalnya', async () => {
    const onSave = jest.fn();
    const { getByLabelText } = await renderForm({
      mode: 'edit',
      transaction: initialBalanceTransaction,
      onSave,
    });

    expect(getByLabelText('Kategori Saldo Awal')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '1200000');
    await fireEvent.press(getByLabelText('Simpan Perubahan'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          categoryId: 'category-saldo-awal',
          amount: 1200000,
        }),
      ),
    );
  });

  it('mengunci tipe dan kategori internal saat mengedit transaksi saldo awal', async () => {
    const { getByLabelText } = await renderForm({
      mode: 'edit',
      transaction: initialBalanceTransaction,
    });

    await fireEvent.press(getByLabelText('Tipe Pengeluaran'));

    expect(getByLabelText('Kategori Saldo Awal')).toBeTruthy();
    expect(getByLabelText('Tipe Pendapatan').props.accessibilityState?.selected).toBe(true);
  });
});
