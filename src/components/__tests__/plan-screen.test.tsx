import { fireEvent, render, waitFor } from '@testing-library/react-native';

import PlanScreen from '@/components/plan-screen';
import mockData from '@/data/mock-data';
import { getPlanView } from '@/services/plan-service';
import { getLocalDateInput } from '@/services/transaction-service';

describe('PlanScreen', () => {
  it('menampilkan ringkasan plan yang ringkas bersama section plan', async () => {
    const { getAllByText, getByLabelText, getByText, queryByLabelText, queryByText } = await render(
      <PlanScreen />,
    );

    expect(getByText('SISA ANGGARAN')).toBeTruthy();
    expect(getByText('masih bisa dialokasikan')).toBeTruthy();
    expect(getByText('Pendapatan Rp 6.500.000')).toBeTruthy();
    expect(getByText('Pengeluaran Rp 2.950.000')).toBeTruthy();
    expect(getAllByText('45%').length).toBeGreaterThan(0);
    expect(getByText('Pendapatan')).toBeTruthy();
    expect(getByText('Pengeluaran')).toBeTruthy();
    expect(getByText('Tabungan')).toBeTruthy();
    expect(queryByText('Tersedia bebas')).toBeNull();
    expect(queryByText('Terikat goal')).toBeNull();
    expect(queryByText('SALDO TERSEDIA')).toBeNull();
    expect(queryByLabelText('SISA ANGGARAN 44%')).toBeNull();
    expect(queryByText('44% dari pendapatan')).toBeNull();
    expect(() => getByText('Fixed expense')).toThrow();
    expect(() => getByText('Alokasi')).toThrow();
    expect(getByText('Tercapai')).toBeTruthy();
  });

  it('menjelaskan saat target Pengeluaran melebihi Pendapatan aktual', async () => {
    const planView = getPlanView();
    const { getByText } = await render(
      <PlanScreen
        planView={{
          ...planView,
          snapshot: { ...planView.snapshot, spareBudget: -500000 },
        }}
      />,
    );

    expect(getByText('Rp -500.000')).toBeTruthy();
    expect(getByText('Target Pengeluaran melebihi Pendapatan aktual')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await render(<PlanScreen />);

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await waitFor(() => expect(getByText('5 Sep–4 Okt')).toBeTruthy());
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
    await fireEvent.changeText(getByLabelText('Target item rencana'), '14000000');
    await fireEvent.press(getByLabelText('Simpan item rencana'));

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
    await fireEvent.changeText(getByLabelText('Target item rencana'), '500000');
    await fireEvent.press(getByLabelText('Simpan item rencana'));

    expect(onPlanItemSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-internet', name: 'Internet' }),
      expect.objectContaining({
        type: 'expense',
        categoryId: 'category-internet',
        targetAmount: 500000,
      }),
    );
  });

  it('menaikkan section saat popup meatball dibuka', async () => {
    const { getByLabelText, getByTestId } = await render(<PlanScreen />);

    await fireEvent.press(getByLabelText('Aksi lainnya Internet'));

    expect(getByTestId('plan-section-expense').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ zIndex: expect.any(Number) })]),
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
      getLocalDateInput(),
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

    await fireEvent.press(getByLabelText('+ Tambah Tabungan'));
    await fireEvent.changeText(getByLabelText('Nama Tabungan'), 'Dana Motor');
    await fireEvent.changeText(getByLabelText('Target Tabungan'), '10000000');
    await fireEvent.press(getByLabelText('Simpan Tabungan'));

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
