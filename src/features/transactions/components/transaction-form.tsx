import { useContext, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MotionPressable as Pressable, MotionScreen } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorTranslationKey } from '@/utils/app-error';
import { todayISO } from '@/utils/date';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import { hasSimilarIncome } from '@/utils/presentation';
import type {
  Category,
  SystemCategoryKey,
  Transaction,
  TransactionDraft,
  TransactionType,
  Wallet,
} from '@/types/domain';

import {
  TransactionConfirmationDialog,
  type Confirmation,
} from './transaction-confirmation-dialog';
import { TransactionFormContent } from './transaction-form-content';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  transaction?: Transaction | undefined;
  initialType?: Exclude<TransactionType, 'adjustment'> | undefined;
  initialCategoryId?: string | undefined;
  initialSystemCategoryKey?: SystemCategoryKey | undefined;
  initialAmount?: number | undefined;
  initialWalletId?: string | undefined;
  initialToWalletId?: string | undefined;
  lockedToWalletId?: string | undefined;
  wallets: Wallet[];
  categories: Category[];
  existingTransactions: Transaction[];
  allocationLimit?: number;
  onClose: () => void;
  onSave: (draft: TransactionDraft) => void | Promise<void>;
  onDelete?: (() => void) | undefined;
  onCategorySave: (category: Category) => Category | Promise<Category>;
  onCategoryArchive: (category: Category) => void | Promise<void>;
};

export function TransactionForm({
  mode,
  transaction,
  initialType,
  initialCategoryId,
  initialSystemCategoryKey,
  initialAmount,
  initialWalletId,
  initialToWalletId,
  lockedToWalletId,
  wallets,
  categories: categoriesProp,
  existingTransactions,
  allocationLimit,
  onClose,
  onSave,
  onDelete,
  onCategorySave,
  onCategoryArchive,
}: TransactionFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useContext(SafeAreaInsetsContext) ?? {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  const resolvedInitialType: TransactionType =
    transaction?.type === 'adjustment'
      ? 'expense'
      : (transaction?.type ??
        initialType ??
        (initialSystemCategoryKey
          ? categoriesProp.find((category) => category.systemKey === initialSystemCategoryKey)?.type
          : undefined) ??
        'income');
  const [type, setType] = useState<TransactionType>(resolvedInitialType);
  const [walletId, setWalletId] = useState(
    transaction?.walletId ?? initialWalletId ?? wallets[0]?.id ?? null,
  );
  const [toWalletId, setToWalletId] = useState(
    transaction?.toWalletId ?? initialToWalletId ?? wallets[1]?.id ?? wallets[0]?.id ?? null,
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? initialCategoryId ?? null,
  );
  const [amount, setAmount] = useState(
    transaction ? formatMoneyInput(transaction.amount) : formatMoneyInput(initialAmount),
  );
  const [adminFee, setAdminFee] = useState(formatMoneyInput(transaction?.adminFee ?? ''));
  const [note, setNote] = useState(transaction?.note ?? '');
  const today = todayISO();
  const [date, setDate] = useState(transaction?.date ?? today);
  const [categories, setCategories] = useState<Category[]>(categoriesProp);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const internalCategory: Category | undefined = categories.find(
    (category) => category.id === categoryId && category.isAdjustment,
  );
  const isInternalCategory = internalCategory !== undefined;
  const effectiveType: TransactionType = isInternalCategory
    ? (internalCategory?.type ?? type)
    : type;

  const changeType = (nextType: TransactionType) => {
    if (isInternalCategory) return;
    setType(nextType);
    if (nextType === 'transfer') {
      setCategoryId(null);
    } else if (
      !categories.some((category) => category.id === categoryId && category.type === nextType)
    ) {
      setCategoryId(null);
    }
  };

  const numericAmount = parseMoneyInput(amount);
  const budgetLimit = allocationLimit ?? 0;
  const overBudget = type === 'expense' && budgetLimit > 0 && numericAmount > budgetLimit;
  const possibleDuplicate = hasSimilarIncome(
    existingTransactions,
    {
      type,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : null,
      categoryId: type === 'transfer' ? null : categoryId,
      amount: numericAmount,
      date,
      time: transaction?.time ?? '12:00',
      note: note.trim(),
    },
    transaction?.id,
  );

  const requestDelete = () =>
    setConfirmation({
      title: t('common.deleteTransactionConfirm'),
      message: t('common.deleteTransactionCopy'),
      confirmLabel: t('common.delete'),
      destructive: true,
      onConfirm: () => onDelete?.(),
    });

  const submit = async () => {
    if (savingRef.current) return;
    if (!walletId || !numericAmount || (type !== 'transfer' && !categoryId)) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        type,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : null,
        categoryId: type === 'transfer' ? 'category-transfer' : categoryId,
        amount: numericAmount,
        adminFee: type === 'transfer' ? parseMoneyInput(adminFee) : 0,
        date,
        time: transaction?.time ?? '12:00',
        note: note.trim(),
      });
    } catch (cause) {
      setSaveError(t(getErrorTranslationKey(cause)));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, styles.safeArea, { backgroundColor: theme.paper }]}
    >
      <MotionScreen>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.line,
              paddingTop: Spacing.two,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.closeTransactionForm')}
            accessibilityHint={t('common.closeWithoutSavingHint')}
            onPress={onClose}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color={theme.ink} />
          </Pressable>
          <ThemedText type="sectionHeading">
            {mode === 'edit' ? t('common.edit') : t('common.addTransaction')}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'edit' ? t('common.saveChanges') : t('common.saveTransaction')
            }
            accessibilityState={{ busy: saving, disabled: saving }}
            disabled={saving}
            onPress={submit}
            style={[styles.headerButton, styles.saveButton, { borderColor: theme.line }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.pine} />
            ) : (
              <ThemedText type="smallBold" themeColor="pine">
                {t('common.save')}
              </ThemedText>
            )}
          </Pressable>
        </View>
        <TransactionFormContent
          mode={mode}
          type={type}
          effectiveType={effectiveType}
          onChangeType={changeType}
          wallets={wallets}
          walletId={walletId}
          onWalletChange={setWalletId}
          toWalletId={toWalletId}
          onToWalletChange={setToWalletId}
          lockedToWalletId={lockedToWalletId}
          adminFee={adminFee}
          onAdminFeeChange={setAdminFee}
          categories={categories}
          onCategoriesChange={setCategories}
          categoryId={categoryId}
          onCategorySelect={setCategoryId}
          internalCategory={internalCategory}
          onSaveCategory={onCategorySave}
          onArchiveCategory={onCategoryArchive}
          amount={amount}
          onAmountChange={setAmount}
          overBudget={overBudget}
          possibleDuplicate={possibleDuplicate}
          saveError={saveError}
          date={date}
          onDateChange={setDate}
          note={note}
          onNoteChange={setNote}
          today={today}
          bottomInset={insets.bottom}
          onRequestDelete={requestDelete}
        />
        <TransactionConfirmationDialog
          confirmation={confirmation}
          onDismiss={() => setConfirmation(null)}
        />
      </MotionScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 65,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    minWidth: 64,
  },
  saveButton: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 12 },
});
