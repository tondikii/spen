import { fireEvent, render, waitFor } from '@testing-library/react-native';

import PlanScreen from '@/components/plan-screen';
import mockData from '@/data/mock-data';

describe('PlanScreen', () => {
  it('menampilkan saldo tersedia, spare budget, dan seluruh section plan', async () => {
    const { getByLabelText, getByText } = await render(<PlanScreen />);

    expect(getByText('SALDO TERSEDIA')).toBeTruthy();
    expect(getByText('SPARE BUDGET')).toBeTruthy();
    expect(getByText('Pendapatan')).toBeTruthy();
    expect(getByText('Pengeluaran')).toBeTruthy();
    expect(getByText('Goal')).toBeTruthy();
    expect(getByLabelText('SPARE BUDGET 44%')).toBeTruthy();
    expect(() => getByText('Fixed expense')).toThrow();
    expect(() => getByText('Alokasi')).toThrow();
    expect(getByText('Tercapai')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await render(<PlanScreen />);

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await waitFor(() => expect(getByText('5–30 Sep')).toBeTruthy());
    await fireEvent.press(getByLabelText('Saran AI'));
    await waitFor(() => expect(getByText('Membaca pola keuanganmu…')).toBeTruthy());
    await waitFor(() => expect(getAllByText('Terapkan').length).toBeGreaterThan(0));
    await fireEvent.press(getAllByText('Terapkan')[0]);
    expect(getByText('✓ Diterapkan')).toBeTruthy();
  });

  it('menampilkan Pendapatan sebagai realisasi tanpa progress', async () => {
    const onItemAction = jest.fn();
    const { getByText, queryByLabelText } = await render(
      <PlanScreen onItemAction={onItemAction} />,
    );

    expect(getByText('Dari transaksi')).toBeTruthy();
    expect(queryByLabelText('Catat Gaji')).toBeNull();
    expect(onItemAction).not.toHaveBeenCalled();
  });

  it('menyimpan nominal item Pendapatan tanpa progress', async () => {
    const onPlanItemSave = jest.fn();
    const { getByLabelText } = await render(
      <PlanScreen categories={mockData.categories} onPlanItemSave={onPlanItemSave} />,
    );

    await fireEvent.press(getByLabelText('+ Tambah Pendapatan'));
    await fireEvent.changeText(getByLabelText('Target item plan'), '14000000');
    await fireEvent.press(getByLabelText('Simpan item plan'));

    expect(onPlanItemSave).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        type: 'income',
        categoryId: 'category-gaji',
        targetAmount: 14000000,
        walletId: 'wallet-tunai',
      }),
    );
  });

  it('membuka dan menyimpan perubahan item Pengeluaran lewat Edit', async () => {
    const onPlanItemSave = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onPlanItemSave={onPlanItemSave} />);

    await fireEvent.press(getByLabelText('Aksi lainnya Internet'));
    await fireEvent.press(getByLabelText('Edit Internet'));
    await fireEvent.changeText(getByLabelText('Target item plan'), '500000');
    await fireEvent.press(getByLabelText('Simpan item plan'));

    expect(onPlanItemSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-internet', name: 'Internet' }),
      expect.objectContaining({
        type: 'expense',
        categoryId: 'category-internet',
        targetAmount: 500000,
      }),
    );
  });

  it('tidak menampilkan toggle pembayaran terpisah pada Pengeluaran', async () => {
    const { queryByLabelText } = await render(<PlanScreen />);

    expect(queryByLabelText('Tandai sudah dibayar Internet')).toBeNull();
  });

  it('membuka pembayaran Pengeluaran dengan nominal dan Wallet', async () => {
    const onItemAction = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onItemAction={onItemAction} />);

    await fireEvent.press(getByLabelText('Aksi lainnya Internet'));
    await fireEvent.press(getByLabelText('Bayar Internet'));
    await fireEvent.changeText(getByLabelText('Nominal pembayaran'), '175000');
    await fireEvent.press(getByLabelText('Simpan transaksi'));

    expect(onItemAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-internet' }),
      175000,
      'wallet-bca',
    );
  });

  it('menyembunyikan aksi Bayar setelah progress Pengeluaran mencapai 100% dan tetap menyediakan Edit', async () => {
    const { queryByLabelText, getByLabelText } = await render(<PlanScreen />);

    expect(queryByLabelText('Bayar Sewa kamar')).toBeNull();
    await fireEvent.press(getByLabelText('Aksi lainnya Sewa kamar'));
    expect(getByLabelText('Edit Sewa kamar')).toBeTruthy();
  });

  it('menawarkan edit dan hapus untuk setiap item plan', async () => {
    const onPlanItemDelete = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onPlanItemDelete={onPlanItemDelete} />);

    await fireEvent.press(getByLabelText('Aksi lainnya Gaji'));
    await fireEvent.press(getByLabelText('Hapus Gaji'));
    await fireEvent.press(getByLabelText('Hapus'));

    expect(onPlanItemDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'income-item-gaji', name: 'Gaji' }),
    );
  });

  it('membuka form Goal baru dan mengirim draft yang diisi pengguna', async () => {
    const onGoalSave = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onGoalSave={onGoalSave} />);

    await fireEvent.press(getByLabelText('+ Tambah Goal'));
    await fireEvent.changeText(getByLabelText('Nama Goal'), 'Dana Motor');
    await fireEvent.changeText(getByLabelText('Target Goal'), '10000000');
    await fireEvent.press(getByLabelText('Simpan Goal'));

    expect(onGoalSave).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ name: 'Dana Motor', targetAmount: 10000000 }),
    );
  });

  it('mengirim nominal Tabung Goal tanpa membuat transaksi dari UI', async () => {
    const onGoalAllocate = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onGoalAllocate={onGoalAllocate} />);

    await fireEvent.press(getByLabelText('Aksi lainnya Dana Nikah'));
    await fireEvent.press(getByLabelText('Tabung Dana Nikah'));
    await fireEvent.changeText(getByLabelText('Nominal pembayaran'), '250000');
    await fireEvent.press(getByLabelText('Tabung'));

    expect(onGoalAllocate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'goal-dana-nikah' }),
      250000,
    );
  });

});
