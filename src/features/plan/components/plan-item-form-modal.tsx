import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DateField } from '@/components/ui/date-field';
import { FieldLabel, MoneyField } from '@/components/ui/form-fields';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { useTheme } from '@/hooks/use-theme';
import { todayISO } from '@/utils/date';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import type { Category, Wallet } from '@/types/domain';
import type { PlanItemDraft } from '../data/plan-repository';
import type { BudgetPlanItem, PlanItemType } from '../model';

import { PlanCategoryEditor } from './plan-category-editor';
import { PlanCategoryPicker } from './plan-category-picker';
import { SheetModal } from './sheet-modal';
import { planSheetStyles } from './plan-sheet-styles';

export function PlanItemFormModal({
  item,
  type,
  categories: categoriesProp,
  wallets,
  minDate,
  onCategorySave,
  onClose,
  onSave,
}: {
  item?: BudgetPlanItem | undefined;
  type: PlanItemType;
  categories: Category[];
  wallets: Wallet[];
  minDate: string;
  onCategorySave: (category: Category) => Category | Promise<Category>;
  onClose: () => void;
  onSave: (draft: PlanItemDraft) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [categories, setCategories] = useState(categoriesProp);
  const [target, setTarget] = useState(item ? formatMoneyInput(item.targetAmount) : '');
  const [walletId, setWalletId] = useState<string | null>(
    item?.type === 'income' ? (item.walletId ?? wallets[0]?.id ?? null) : (wallets[0]?.id ?? null),
  );
  const transactionToday = todayISO();
  const [incomeDate, setIncomeDate] = useState(transactionToday);
  const options = categories.filter(
    (category) =>
      !category.archived &&
      category.type === (type === 'income' ? 'income' : 'expense') &&
      !category.isAdjustment,
  );
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? options[0]?.id ?? null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const createCategory = async (draft: Category) => {
    const saved = await onCategorySave(draft);
    setCategories((current) => [...current, saved]);
    setCategoryId(saved.id);
    setCategoryEditorOpen(false);
  };
  const submit = () => {
    const targetAmount = parseMoneyInput(target);
    if (
      !categoryId ||
      !Number.isSafeInteger(targetAmount) ||
      targetAmount <= 0 ||
      (type === 'income' && !walletId)
    )
      return;
    void onSave({
      type,
      categoryId,
      targetAmount,
      ...(type === 'income' ? { walletId: walletId as string } : {}),
      ...(type === 'income' ? { date: incomeDate } : {}),
    });
  };
  return (
    <SheetModal
      title={item ? t('common.itemPlanEdit') : t('common.itemPlanNew')}
      closeLabel={t('common.closePlanItemForm')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={planSheetStyles.goalSheet}
    >
      <ScrollView
        style={planSheetStyles.sheetScroll}
        contentContainerStyle={planSheetStyles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <ThemedText type="small" themeColor="muted">
          {type === 'income' ? t('common.incomePlanNote') : t('common.expensePlanNote')}
        </ThemedText>
        <MoneyField
          label={type === 'income' ? t('common.nominal') : t('common.targetNominal')}
          value={target}
          onChangeText={(value) => setTarget(formatMoneyInput(value))}
          accessibilityLabel={t('common.targetPlanItem')}
          inputStyle={planSheetStyles.goalInput}
        />
        {type === 'income' && (
          <>
            <FieldLabel>{t('common.incomeWallet')}</FieldLabel>
            <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
            <FieldLabel>{t('common.transactionDate')}</FieldLabel>
            <DateField
              date={incomeDate}
              onSelect={setIncomeDate}
              minDate={minDate}
              maxDate={transactionToday}
            />
          </>
        )}
        <PlanCategoryPicker
          options={options}
          selectedId={categoryId}
          onSelect={setCategoryId}
          onAdd={() => setCategoryEditorOpen(true)}
        />
        {categoryEditorOpen && (
          <PlanCategoryEditor
            type={type}
            onCancel={() => setCategoryEditorOpen(false)}
            onCreate={createCategory}
          />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.savePlanItem')}
          onPress={submit}
          style={[planSheetStyles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {item ? t('common.saveChanges') : t('common.saveItem')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
  );
}
