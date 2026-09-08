import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/ui/category-icon';
import { DateField } from '@/components/ui/date-field';
import { SheetModal } from './sheet-modal';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { FieldLabel, MoneyField } from '@/components/ui/form-fields';
import { Radius } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import { chunk } from '@/utils/array';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import { todayISO } from '@/utils/date';
import type { PlanItemDraft } from '@/features/plan';
import type { BudgetPlanItem, Category, PlanItemType, Wallet } from '@/types/domain';

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
  item?: BudgetPlanItem;
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
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const iconRows = useMemo(() => chunk(CATEGORY_ICON_CHOICES, 5), []);
  const saveCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    const draft: Category = {
      id: `category-draft-${Date.now()}`,
      name,
      type: type === 'income' ? 'income' : 'expense',
      icon: categoryIcon,
      archived: false,
      isAdjustment: false,
    };
    const saved = await onCategorySave(draft);
    setCategories((current) => [...current, saved]);
    setCategoryId(saved.id);
    setCategoryEditorOpen(false);
    setCategoryName('');
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
        <View style={styles.categoryLabelRow}>
          <FieldLabel>{t('common.category')}</FieldLabel>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.addCategoryFromPlan')}
            onPress={() => setCategoryEditorOpen(true)}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.add')}
            </ThemedText>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.goalWallets}
        >
          {options.map((category) => (
            <Pressable
              key={category.id}
              wrapperStyle={styles.planCategoryCell}
              accessibilityRole="button"
              accessibilityLabel={t('common.categoryFor', {
                name: getCategoryLabel(category),
              })}
              onPress={() => setCategoryId(category.id)}
              style={[
                styles.planCategoryChoice,
                {
                  borderColor: categoryId === category.id ? theme.pine : theme.line,
                  backgroundColor: categoryId === category.id ? theme.mint : theme.card,
                },
              ]}
            >
              <CategoryIcon name={category.icon} color={theme.pine} size={18} />
              <ThemedText type="smallBold" style={styles.planCategoryName}>
                {getCategoryLabel(category)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
        {options.length === 0 && (
          <ThemedText type="small" style={{ color: theme.expense }}>
            {t('common.noMatchingCategory')}
          </ThemedText>
        )}
        {categoryEditorOpen && (
          <View
            style={[
              styles.inlineCategoryEditor,
              { borderColor: theme.line, backgroundColor: theme.background },
            ]}
          >
            <View style={styles.categoryEditorHeader}>
              <ThemedText type="smallBold">{t('common.addCategory')}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.cancelCategoryEdit')}
                onPress={() => {
                  setCategoryEditorOpen(false);
                  setCategoryName('');
                }}
                hitSlop={8}
              >
                <ThemedText type="smallBold" style={{ color: theme.expense }}>
                  {t('common.cancel')}
                </ThemedText>
              </Pressable>
            </View>
            <ThemedInput
              accessibilityLabel={t('common.newCategory')}
              placeholder={t('common.categoryName')}
              value={categoryName}
              onChangeText={setCategoryName}
              style={planSheetStyles.goalInput}
            />
            <ScrollView
              style={styles.planIconScroll}
              contentContainerStyle={styles.planIconGrid}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {iconRows.map((row, rowIndex) => (
                <View key={`plan-icon-row-${rowIndex}`} style={styles.planIconRow}>
                  {row.map((icon) => (
                    <Pressable
                      key={icon}
                      wrapperStyle={styles.planIconCell}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.chooseIcon', { icon })}
                      onPress={() => setCategoryIcon(icon)}
                      style={[
                        styles.planIconChoice,
                        {
                          borderColor: icon === categoryIcon ? theme.pine : theme.line,
                          backgroundColor: icon === categoryIcon ? theme.mint : theme.card,
                        },
                      ]}
                    >
                      <CategoryIcon name={icon} color={theme.pine} size={18} />
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.saveCategory')}
              disabled={!categoryName.trim()}
              onPress={() => void saveCategory()}
              style={({ pressed }) => [
                styles.planSaveCategory,
                {
                  backgroundColor: categoryName.trim() ? theme.pine : theme.line,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <ThemedText
                type="smallBold"
                style={{ color: categoryName.trim() ? theme.heroText : theme.muted }}
              >
                {t('common.saveCategory')}
              </ThemedText>
            </Pressable>
          </View>
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

const styles = StyleSheet.create({
  categoryEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  categoryLabelRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalWallets: { gap: 8, paddingVertical: 4 },
  planCategoryCell: { width: 132 },
  planCategoryChoice: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    height: 72,
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  planCategoryName: { textAlign: 'center', width: '100%' },
  inlineCategoryEditor: {
    alignSelf: 'stretch',
    borderRadius: 13,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
    padding: 11,
    width: '100%',
  },
  planIconScroll: { maxHeight: 196, width: '100%' },
  planIconGrid: {
    gap: 7,
    width: '100%',
  },
  planIconRow: { flexDirection: 'row', gap: 7, width: '100%' },
  planIconChoice: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '100%',
  },
  planIconCell: { flex: 1, minWidth: 0 },
  planSaveCategory: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
});
