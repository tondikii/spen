import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';

import PlanScreen, { type BudgetPlan } from '@/features/plan';
import { AppThemeProvider } from '@/providers/theme-provider';
import { todayISO } from '@/utils/date';
import type { BudgetPeriod, Category, Goal, Wallet } from '@/types/domain';

const period: BudgetPeriod = {
  id: 'period-1',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  durationMonths: 1,
};

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
    initialBalance: 5095000,
    balance: 5095000,
    isSavings: false,
    archived: false,
    tint: 'pine',
  },
  {
    id: 'wallet-gopay',
    name: 'GoPay',
    initialBalance: 80000,
    balance: 80000,
    isSavings: false,
    archived: false,
    tint: 'gold',
  },
  {
    id: 'wallet-dana-nikah',
    name: 'Dana Nikah',
    initialBalance: 1750000,
    balance: 1750000,
    isSavings: true,
    archived: false,
    tint: 'goal',
  },
  {
    id: 'wallet-dana-liburan',
    name: 'Dana Liburan',
    initialBalance: 1000000,
    balance: 1000000,
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
    id: 'category-internet',
    name: 'Internet',
    type: 'expense',
    icon: 'wifi',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-sewa',
    name: 'Sewa kamar',
    type: 'expense',
    icon: 'home-outline',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-freelance',
    name: 'Freelance',
    systemKey: 'freelance',
    type: 'income',
    icon: 'laptop',
    archived: false,
    isAdjustment: false,
  },
  {
    id: 'category-transport',
    name: 'Transport',
    systemKey: 'transport',
    type: 'expense',
    icon: 'bus',
    archived: false,
    isAdjustment: false,
  },
];

const plan: BudgetPlan = {
  id: 'plan-1',
  budgetPeriodId: 'period-1',
  incomeItems: [
    {
      id: 'income-item-gaji',
      type: 'income',
      name: 'Gaji',
      categoryId: 'category-gaji',
      targetAmount: 6_500_000,
      walletId: 'wallet-tunai',
    },
  ],
  expenseItems: [
    {
      id: 'expense-internet',
      type: 'expense',
      name: 'Internet',
      categoryId: 'category-internet',
      targetAmount: 350_000,
    },
    {
      id: 'expense-sewa',
      type: 'expense',
      name: 'Sewa kamar',
      categoryId: 'category-sewa',
      targetAmount: 2_775_000,
    },
  ],
  fixedExpenseItems: [],
  allocationItems: [],
  goalIds: ['goal-dana-nikah', 'goal-dana-liburan'],
};

const goals: Goal[] = [
  {
    id: 'goal-dana-nikah',
    name: 'Dana Nikah',
    targetAmount: 15_000_000,
    targetDate: null,
    walletId: 'wallet-dana-nikah',
    monthlyContribution: 250_000,
    archived: false,
  },
  {
    id: 'goal-dana-liburan',
    name: 'Dana Liburan',
    targetAmount: 1_000_000,
    targetDate: null,
    walletId: 'wallet-dana-liburan',
    monthlyContribution: 0,
    archived: false,
  },
];

function makePlanView() {
  return {
    snapshot: {
      totalIncome: 6_500_000,
      totalExpense: 2_950_000,
      totalTransferIn: 0,
      totalTransferOut: 0,
      netSaving: 3_550_000,
      spareBudget: 3_375_000,
      availableBalance: 8_275_000,
      freeBalance: 5_525_000,
      goalBalance: 2_750_000,
      planItems: [
        {
          itemId: 'income-item-gaji',
          realizedAmount: 6_500_000,
          progressPercent: 100,
          overBudget: false,
        },
        {
          itemId: 'expense-internet',
          realizedAmount: 175_000,
          progressPercent: 50,
          overBudget: false,
        },
        {
          itemId: 'expense-sewa',
          realizedAmount: 2_775_000,
          progressPercent: 100,
          overBudget: false,
        },
      ],
    },
    plan,
    goals,
    wallets,
    period,
    startDay: 1,
  };
}

function renderScreen(
  planView = makePlanView(),
  props: Partial<ComponentProps<typeof PlanScreen>> = {},
) {
  return render(
    <PlanScreen
      planView={planView}
      categories={categories}
      onPeriodStartDayChange={jest.fn()}
      onItemAction={jest.fn()}
      onPlanItemSave={jest.fn()}
      onPlanItemDelete={jest.fn()}
      onCategorySave={async (category) => category}
      onGoalSave={jest.fn()}
      onGoalArchive={jest.fn()}
      onGoalAllocate={jest.fn()}
      onGoalWithdraw={jest.fn()}
      onSuggestionApply={jest.fn()}
      {...props}
    />,
  );
}

describe('PlanScreen', () => {
  it('menampilkan ringkasan plan yang ringkas bersama section plan', async () => {
    const { getAllByText, getByText, queryByLabelText, queryByText } = await renderScreen();

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

  it('mewarnai nominal Pengeluaran merah dan nominal Goal gold', async () => {
    const { getByText } = await renderScreen();

    expect(StyleSheet.flatten(getByText('Rp 175.000 / Rp 350.000').props.style)).toEqual(
      expect.objectContaining({ color: '#C85C55' }),
    );
    expect(StyleSheet.flatten(getByText('Rp 1.750.000 / Rp 15.000.000').props.style)).toEqual(
      expect.objectContaining({ color: '#BD8A30' }),
    );
  });

  it('membuat track progress Spare Budget tetap terlihat di dark mode', async () => {
    const { getByLabelText } = await render(
      <AppThemeProvider initialMode="dark">
        <PlanScreen
          planView={makePlanView()}
          categories={categories}
          onPeriodStartDayChange={jest.fn()}
          onItemAction={jest.fn()}
          onPlanItemSave={jest.fn()}
          onPlanItemDelete={jest.fn()}
          onCategorySave={async (category) => category}
          onGoalSave={jest.fn()}
          onGoalArchive={jest.fn()}
          onGoalAllocate={jest.fn()}
          onGoalWithdraw={jest.fn()}
          onSuggestionApply={jest.fn()}
        />
      </AppThemeProvider>,
    );

    expect(StyleSheet.flatten(getByLabelText('SISA ANGGARAN').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: '#FFFFFF1F' }),
    );
  });

  it('menjelaskan saat target Pengeluaran melebihi Pendapatan aktual', async () => {
    const planView = makePlanView();
    planView.snapshot = { ...planView.snapshot, spareBudget: -500000 };
    const { getByText } = await renderScreen(planView);

    expect(getByText('Rp -500.000')).toBeTruthy();
    expect(getByText('Target Pengeluaran melebihi Pendapatan aktual')).toBeTruthy();
  });

  it('mengubah Budget period dan menerapkan saran AI', async () => {
    const { getAllByText, getByLabelText, getByText } = await renderScreen();

    await fireEvent.press(getByLabelText('Pilih rentang Laporan'));
    await fireEvent.press(getByLabelText('Tanggal 5'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await fireEvent.press(getByLabelText('Terapkan'));
    await waitFor(() => expect(getByText('5 Sep–4 Okt')).toBeTruthy());
    await fireEvent.press(getByLabelText('Saran AI'));
    await waitFor(() => expect(getAllByText('Terapkan').length).toBeGreaterThan(0));
    await fireEvent.press(getAllByText('Terapkan')[0]!);
    expect(getByText('✓ Diterapkan')).toBeTruthy();
  });

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
