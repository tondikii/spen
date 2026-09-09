import { fireEvent } from '@testing-library/react-native';

import { makePlanView, renderScreen } from './plan-screen-test-utils';

describe('PlanScreen goals', () => {
  it('membuka form Goal baru dan mengirim draft yang diisi pengguna', async () => {
    const onGoalSave = jest.fn();
    const { getByLabelText } = await renderScreen(makePlanView(), { onGoalSave });

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
    const { getByLabelText } = await renderScreen(makePlanView(), { onGoalAllocate });

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
