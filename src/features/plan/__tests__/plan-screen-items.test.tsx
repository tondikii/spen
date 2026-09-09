import { fireEvent } from '@testing-library/react-native';

import { todayISO } from '@/utils/date';

import { makePlanView, renderScreen } from './plan-screen-test-utils';

describe('PlanScreen items', () => {
  it('menampilkan Pendapatan sebagai realisasi tanpa progress', async () => {
    const onItemAction = jest.fn();
    const { getByText, queryByLabelText } = await renderScreen(makePlanView(), { onItemAction });

    expect(getByText('Dari transaksi')).toBeTruthy();
    expect(queryByLabelText('Catat Gaji')).toBeNull();
    expect(onItemAction).not.toHaveBeenCalled();
  });

  it('menyimpan nominal item Pendapatan tanpa progress', async () => {
    const onPlanItemSave = jest.fn();
    const { getByLabelText } = await renderScreen(makePlanView(), { onPlanItemSave });

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
    const { getByLabelText } = await renderScreen(makePlanView(), { onPlanItemSave });

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
    const { getByLabelText, getByTestId } = await renderScreen();

    await fireEvent.press(getByLabelText('Aksi lainnya Internet'));

    expect(getByTestId('plan-section-expense').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ zIndex: expect.any(Number) })]),
    );
  });

  it('menempatkan meatball di atas nominal item plan', async () => {
    const { getByTestId } = await renderScreen();

    expect(getByTestId('plan-value-actions-expense-internet').props.style).toEqual(
      expect.objectContaining({ flexDirection: 'column' }),
    );
  });

  it('tidak menampilkan toggle pembayaran terpisah pada Pengeluaran', async () => {
    const { queryByLabelText } = await renderScreen();

    expect(queryByLabelText('Tandai sudah dibayar Internet')).toBeNull();
  });

  it('membuka pembayaran Pengeluaran dengan nominal dan Wallet', async () => {
    const onItemAction = jest.fn();
    const { getByLabelText } = await renderScreen(makePlanView(), { onItemAction });

    await fireEvent.press(getByLabelText('Aksi lainnya Internet'));
    await fireEvent.press(getByLabelText('Bayar Internet'));
    await fireEvent.changeText(getByLabelText('Nominal pembayaran'), '175000');
    await fireEvent.press(getByLabelText('Simpan transaksi'));

    expect(onItemAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'expense-internet' }),
      175000,
      'wallet-bca',
      todayISO(),
    );
  });

  it('menyembunyikan aksi Bayar setelah progress Pengeluaran mencapai 100% dan tetap menyediakan Edit', async () => {
    const { queryByLabelText, getByLabelText } = await renderScreen();

    expect(queryByLabelText('Bayar Sewa kamar')).toBeNull();
    await fireEvent.press(getByLabelText('Aksi lainnya Sewa kamar'));
    expect(getByLabelText('Edit Sewa kamar')).toBeTruthy();
  });

  it('menawarkan edit dan hapus untuk setiap item plan', async () => {
    const onPlanItemDelete = jest.fn();
    const { getByLabelText } = await renderScreen(makePlanView(), { onPlanItemDelete });

    await fireEvent.press(getByLabelText('Aksi lainnya Gaji'));
    await fireEvent.press(getByLabelText('Hapus Gaji'));
    await fireEvent.press(getByLabelText('Hapus'));

    expect(onPlanItemDelete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'income-item-gaji', name: 'Gaji' }),
    );
  });

  it('menampilkan meatball untuk item income dan expense otomatis', async () => {
    const planView = makePlanView();
    planView.plan = {
      ...planView.plan,
      incomeItems: [
        ...planView.plan.incomeItems,
        {
          id: 'income-category-freelance',
          type: 'income',
          name: 'Freelance',
          categoryId: 'category-freelance',
          targetAmount: 0,
          isAutomatic: true,
        },
      ],
      expenseItems: [
        ...planView.plan.expenseItems,
        {
          id: 'expense-category-transport',
          type: 'expense',
          name: 'Transport',
          categoryId: 'category-transport',
          targetAmount: 180000,
          isAutomatic: true,
        },
      ],
    };
    const { getByLabelText } = await renderScreen(planView);

    expect(getByLabelText('Aksi lainnya Freelance')).toBeTruthy();
    expect(getByLabelText('Aksi lainnya Transport')).toBeTruthy();
  });
});
