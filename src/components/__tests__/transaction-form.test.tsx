import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { TransactionForm } from '@/components/transaction-form';
import mockData from '@/data/mock-data';

describe('TransactionForm', () => {
  it('mencatat expense dengan wallet, kategori, nominal, dan catatan', async () => {
    const onSave = jest.fn();
    const { getByLabelText } = await render(<TransactionForm mode="create" onClose={jest.fn()} onSave={onSave} />);

    await fireEvent.press(getByLabelText('Tipe Keluar'));
    await fireEvent.press(getByLabelText('Pilih Wallet GoPay'));
    await fireEvent.press(getByLabelText('Kategori Makan'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '45000');
    await fireEvent.changeText(getByLabelText('Catatan transaksi'), 'Kopi');
    await fireEvent.press(getByLabelText('Simpan Transaksi'));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      type: 'expense',
      walletId: 'wallet-gopay',
      categoryId: 'category-makan',
      amount: 45000,
      note: 'Kopi',
    })));
  });

  it('membuka edit state dengan data terisi dan tombol hapus', async () => {
    const onSave = jest.fn();
    const onDelete = jest.fn();
    const transaction = mockData.transactions[1];
    const { getByLabelText, getByText } = await render(<TransactionForm mode="edit" transaction={transaction} onClose={jest.fn()} onSave={onSave} onDelete={onDelete} />);

    expect(getByText('Edit Transaksi')).toBeTruthy();
    expect(getByLabelText('Nominal transaksi').props.value).toBe('45000');
    expect(getByLabelText('Catatan transaksi').props.value).toBe('Kopi dan sarapan');
    expect(getByText('Hapus Transaksi')).toBeTruthy();
  });

  it('menampilkan warning lembut saat expense melewati alokasi', async () => {
    const { getByLabelText, getByText } = await render(<TransactionForm mode="create" onClose={jest.fn()} onSave={jest.fn()} />);

    await fireEvent.press(getByLabelText('Tipe Keluar'));
    await fireEvent.press(getByLabelText('Kategori Makan'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '1300000');

    await waitFor(() => expect(getByText(/melebihi alokasi/)).toBeTruthy());
  });

  it('menampilkan peringatan saat income mirip sudah tercatat di hari yang sama', async () => {
    const existing = { ...mockData.transactions[0], date: '2026-09-02' };
    const { getByLabelText, getByText } = await render(<TransactionForm mode="create" wallets={mockData.wallets} existingTransactions={[existing]} onClose={jest.fn()} onSave={jest.fn()} />);

    await fireEvent.press(getByLabelText('Pilih Wallet BCA'));
    await fireEvent.press(getByLabelText('Kategori Gaji'));
    await fireEvent.changeText(getByLabelText('Nominal transaksi'), '6500000');

    await waitFor(() => expect(getByText(/mungkin dobel/)).toBeTruthy());
  });

  it('memungkinkan CRUD kategori inline tanpa menghapus data saat archive', async () => {
    const { getByLabelText, queryByLabelText } = await render(<TransactionForm mode="create" onClose={jest.fn()} onSave={jest.fn()} />);

    await fireEvent.press(getByLabelText('Tipe Keluar'));
    await fireEvent.press(getByLabelText('Kelola kategori'));
    await fireEvent.changeText(getByLabelText('Nama kategori baru'), 'Kesehatan');
    await fireEvent.press(getByLabelText('Simpan kategori'));
    await fireEvent.press(getByLabelText('Kelola kategori'));
    await fireEvent.press(getByLabelText('Arsipkan kategori Kesehatan'));

    expect(queryByLabelText('Kategori Kesehatan')).toBeNull();
  });
});
