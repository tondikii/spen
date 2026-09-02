import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import PlanScreen from '@/components/plan-screen';

describe('PlanScreen', () => {
  it('menampilkan saldo tersedia, spare budget, dan seluruh section plan', async () => {
    const { getByText } = await render(<PlanScreen />);

    expect(getByText('SALDO TERSEDIA')).toBeTruthy();
    expect(getByText('Spare budget')).toBeTruthy();
    expect(getByText('Pendapatan')).toBeTruthy();
    expect(getByText('Fixed expense')).toBeTruthy();
    expect(getByText('Goal')).toBeTruthy();
    expect(getByText('Alokasi')).toBeTruthy();
    expect(getByText('Melebihi Budget')).toBeTruthy();
    expect(getByText('Tercapai')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await render(<PlanScreen />);

    await fireEvent.press(getByLabelText('Ubah Budget period'));
    await fireEvent.press(getByLabelText('Mulai tanggal 5'));
    await waitFor(() => expect(getByText('5–30 Sep⌄')).toBeTruthy());
    await fireEvent.press(getByLabelText('AI Suggestion'));
    await waitFor(() => expect(getByText('Membaca pola keuanganmu…')).toBeTruthy());
    await waitFor(() => expect(getAllByText('Terapkan').length).toBeGreaterThan(0));
    await fireEvent.press(getAllByText('Terapkan')[0]);
    expect(getByText('✓ Diterapkan')).toBeTruthy();
  });

  it('membuka form transaksi dari aksi item plan', async () => {
    const onItemAction = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onItemAction={onItemAction} />);

    await fireEvent.press(getByLabelText('Catat Gaji'));

    expect(onItemAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'income', name: 'Gaji' }), 6500000);
  });

  it('mengirim sisa nominal saat membayar fixed expense sebagian', async () => {
    const onItemAction = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onItemAction={onItemAction} />);

    await fireEvent.press(getByLabelText('Bayar Internet'));

    expect(onItemAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'fixedExpense', name: 'Internet' }), 175000);
  });

  it('menawarkan edit dan hapus untuk setiap item plan', async () => {
    const onPlanItemDelete = jest.fn();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === 'Hapus')?.onPress?.();
    });
    const { getByLabelText } = await render(<PlanScreen onPlanItemDelete={onPlanItemDelete} />);

    await fireEvent.press(getByLabelText('Hapus Gaji'));

    expect(onPlanItemDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'income-item-gaji', name: 'Gaji' }));
    alertSpy.mockRestore();
  });

  it('membuka form Goal baru dan mengirim draft yang diisi pengguna', async () => {
    const onGoalSave = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onGoalSave={onGoalSave} />);

    await fireEvent.press(getByLabelText('+ Tambah Goal'));
    await fireEvent.changeText(getByLabelText('Nama Goal'), 'Dana Motor');
    await fireEvent.changeText(getByLabelText('Target Goal'), '10000000');
    await fireEvent.press(getByLabelText('Simpan Goal'));

    expect(onGoalSave).toHaveBeenCalledWith(null, expect.objectContaining({ name: 'Dana Motor', targetAmount: 10000000 }));
  });

  it('meneruskan aksi Nabung Goal ke route transaksi', async () => {
    const onGoalSaveAction = jest.fn();
    const { getByLabelText } = await render(<PlanScreen onGoalSaveAction={onGoalSaveAction} />);

    await fireEvent.press(getByLabelText('Nabung ke Goal Dana Nikah'));

    expect(onGoalSaveAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'goal-dana-nikah' }));
  });
});
