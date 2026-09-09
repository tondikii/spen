import { render } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import PlanScreen, { type BudgetPlan } from '@/features/plan';
import { AppThemeProvider } from '@/providers/theme-provider';
import type { BudgetPeriod, Category, Goal, Wallet } from '@/types/domain';

export const period: BudgetPeriod = {
  id: 'period-1',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  durationMonths: 1,
};

export const wallets: Wallet[] = [
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

export const categories: Category[] = [
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

export const plan: BudgetPlan = {
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

export const goals: Goal[] = [
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

export function makePlanView() {
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

export function renderScreen(
  planView = makePlanView(),
  props: Partial<ComponentProps<typeof PlanScreen>> = {},
  initialMode: 'light' | 'dark' = 'light',
) {
  const screen = (
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
    />
  );
  return render(
    initialMode === 'dark' ? (
      <AppThemeProvider initialMode="dark">{screen}</AppThemeProvider>
    ) : (
      screen
    ),
  );
}
