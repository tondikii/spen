import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/domain';
import type { BudgetPlanItem, PlanItemState } from '../model';

import { PlanItem } from './plan-item';
import { EmptyPlan, PlanSection } from './plan-section';

/**
 * Bagian item rencana Pendapatan dan Pengeluaran: dua PlanSection dengan
 * daftar PlanItem (atau state kosong). Editor item dan aksi tetap menjadi
 * tanggung jawab layar lewat callback.
 */
export function PlanItemsSection({
  incomeItems,
  expenseItems,
  categories,
  itemStates,
  incomeMenuOpen,
  expenseMenuOpen,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onItemAction,
  onIncomeMenuOpenChange,
  onExpenseMenuOpenChange,
  dismissSignal,
}: {
  incomeItems: BudgetPlanItem[];
  expenseItems: BudgetPlanItem[];
  categories: Category[];
  itemStates: PlanItemState[];
  incomeMenuOpen: boolean;
  expenseMenuOpen: boolean;
  onAddItem: (type: 'income' | 'expense') => void;
  onEditItem: (item: BudgetPlanItem) => void;
  onDeleteItem: (item: BudgetPlanItem) => void | Promise<void>;
  onItemAction: (item: BudgetPlanItem) => void;
  onIncomeMenuOpenChange: (open: boolean) => void;
  onExpenseMenuOpenChange: (open: boolean) => void;
  dismissSignal: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const itemState = (item: BudgetPlanItem) => itemStates.find((state) => state.itemId === item.id);
  const renderItem = (item: BudgetPlanItem, kind: 'income' | 'expense') => (
    <PlanItem
      key={item.id}
      item={item}
      category={categories.find((category) => category.id === item.categoryId)}
      state={itemState(item)}
      action={
        kind === 'income'
          ? 'isAutomatic' in item && item.isAutomatic
            ? ''
            : t('common.addTransaction')
          : itemState(item)?.progressPercent && itemState(item)!.progressPercent >= 100
            ? ''
            : t('common.pay')
      }
      color={kind === 'income' ? theme.income : theme.expense}
      onAction={onItemAction}
      onEdit={() => onEditItem(item)}
      onDelete={onDeleteItem}
      onMenuOpenChange={kind === 'income' ? onIncomeMenuOpenChange : onExpenseMenuOpenChange}
      dismissSignal={dismissSignal}
    />
  );
  return (
    <>
      <PlanSection
        title={t('common.incomePlan')}
        action={t('common.add')}
        menuOpen={incomeMenuOpen}
        onAction={() => onAddItem('income')}
      >
        {incomeItems.length ? (
          incomeItems.map((item) => renderItem(item, 'income'))
        ) : (
          <EmptyPlan message={t('common.noIncomePlan')} />
        )}
      </PlanSection>
      <PlanSection
        title={t('common.expensePlan')}
        action={t('common.add')}
        menuOpen={expenseMenuOpen}
        testID="plan-section-expense"
        onAction={() => onAddItem('expense')}
      >
        {expenseItems.length ? (
          expenseItems.map((item) => renderItem(item, 'expense'))
        ) : (
          <EmptyPlan message={t('common.noExpensePlan')} />
        )}
      </PlanSection>
    </>
  );
}
