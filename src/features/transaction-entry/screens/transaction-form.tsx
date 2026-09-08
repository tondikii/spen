import { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { CurrencyMark } from '@/components/ui/currency-mark';
import { FieldLabel } from '@/components/ui/form-fields';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { MotionPressable as Pressable, MotionScreen } from '@/components/ui/motion';
import { Fonts, Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayISO } from '@/lib/date';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { hasSimilarIncome } from '@/lib/presentation';
import type {
  Category,
  SystemCategoryKey,
  Transaction,
  TransactionDraft,
  TransactionType,
  Wallet,
} from '@/types/domain';

import { FormDateField } from './form-date-field';
import { TransactionCategoryPicker } from './transaction-category-picker';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  transaction?: Transaction;
  initialType?: Exclude<TransactionType, 'adjustment'>;
  initialCategoryId?: string;
  initialSystemCategoryKey?: SystemCategoryKey;
  initialAmount?: number;
  initialWalletId?: string;
  initialToWalletId?: string;
  lockedToWalletId?: string;
  wallets: Wallet[];
  categories: Category[];
  existingTransactions: Transaction[];
  allocationLimit?: number;
  onClose: () => void;
  onSave: (draft: TransactionDraft) => void;
  onDelete?: () => void;
  onCategorySave: (category: Category) => Category | Promise<Category>;
  onCategoryArchive: (category: Category) => void | Promise<void>;
};

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

const tabs: { type: TransactionType; translationKey: string }[] = [
  { type: 'income', translationKey: 'common.income' },
  { type: 'expense', translationKey: 'common.expense' },
  { type: 'transfer', translationKey: 'categories.transfer' },
];

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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState((transaction?.date ?? today).slice(0, 7));
  const [categories, setCategories] = useState<Category[]>(categoriesProp);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

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

  const toggleCalendar = () => {
    if (!calendarOpen) setCalendarMonth(date.slice(0, 7));
    setCalendarOpen((current) => !current);
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

  const submit = () => {
    if (!walletId || !numericAmount || (type !== 'transfer' && !categoryId)) return;
    onSave({
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
            onPress={onClose}
            style={styles.headerButton}
          >
            <ThemedText style={styles.close}>×</ThemedText>
          </Pressable>
          <ThemedText type="sectionHeading">
            {mode === 'edit' ? t('common.edit') : t('common.addTransaction')}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'edit' ? t('common.saveChanges') : t('common.saveTransaction')
            }
            onPress={submit}
            style={styles.headerButton}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.save')}
            </ThemedText>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
          >
            <View style={[styles.typeTabs, { borderBottomColor: theme.line }]}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.type}
                  wrapperStyle={styles.typeTabWrapper}
                  accessibilityRole="tab"
                  accessibilityLabel={t('common.transactionType', {
                    type: t(tab.translationKey),
                  })}
                  accessibilityState={{ selected: effectiveType === tab.type }}
                  accessibilityHint={t('common.transactionTypeHint')}
                  onPress={() => changeType(tab.type)}
                  style={[
                    styles.typeTab,
                    effectiveType === tab.type && {
                      borderBottomColor:
                        tab.type === 'income'
                          ? theme.income
                          : tab.type === 'expense'
                            ? theme.expense
                            : theme.pine,
                    },
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    themeColor={
                      effectiveType === tab.type
                        ? tab.type === 'income'
                          ? 'income'
                          : tab.type === 'expense'
                            ? 'expense'
                            : 'pine'
                        : 'muted'
                    }
                  >
                    {t(tab.translationKey)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {type === 'transfer' ? (
              <>
                <FieldLabel>{t('common.fromWallet')}</FieldLabel>
                <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.swapTransferWallet')}
                  onPress={() => {
                    setWalletId(toWalletId);
                    setToWalletId(walletId);
                  }}
                  style={styles.swap}
                >
                  <ThemedText type="subtitle" themeColor="gold">
                    ↕
                  </ThemedText>
                </Pressable>
                <FieldLabel>{t('common.toWallet')}</FieldLabel>
                {lockedToWalletId ? (
                  <View
                    style={[
                      styles.lockedWallet,
                      { borderColor: theme.line, backgroundColor: theme.mint },
                    ]}
                  >
                    <ThemedText type="smallBold">
                      {wallets.find((wallet) => wallet.id === lockedToWalletId)?.name ??
                        t('common.goalWallet')}
                    </ThemedText>
                    <ThemedText type="small" themeColor="muted">
                      {t('common.lockedGoalWallet')}
                    </ThemedText>
                  </View>
                ) : (
                  <WalletPicker
                    wallets={wallets}
                    selected={toWalletId}
                    onSelect={setToWalletId}
                    exclude={walletId}
                  />
                )}
                <FieldLabel>
                  {t('common.adminFee').toUpperCase()}{' '}
                  <ThemedText type="small" themeColor="muted">
                    ({t('common.optional')})
                  </ThemedText>
                </FieldLabel>
                <View style={styles.moneyInputRow}>
                  <CurrencyMark />
                  <ThemedInput
                    accessibilityLabel={t('common.adminFee')}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.muted}
                    value={adminFee}
                    onChangeText={(value) => setAdminFee(formatMoneyInput(value))}
                    style={[
                      styles.input,
                      styles.moneyInput,
                      { borderBottomColor: theme.line, color: theme.ink },
                    ]}
                  />
                </View>
              </>
            ) : (
              <>
                <FieldLabel>{t('common.wallet')}</FieldLabel>
                <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
                <TransactionCategoryPicker
                  type={type}
                  categories={categories}
                  onCategoriesChange={setCategories}
                  selectedId={categoryId}
                  onSelect={setCategoryId}
                  internalCategory={internalCategory}
                  onSaveCategory={onCategorySave}
                  onArchiveCategory={onCategoryArchive}
                />
              </>
            )}

            <FieldLabel>
              {type === 'transfer' ? t('common.transferAmount') : t('common.nominal')}
            </FieldLabel>
            <View style={styles.moneyInputRow}>
              <CurrencyMark />
              <ThemedInput
                accessibilityLabel={t('common.transactionAmount')}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.muted}
                value={amount}
                onChangeText={(value) => setAmount(formatMoneyInput(value))}
                style={[
                  styles.amountInput,
                  styles.moneyInput,
                  { borderBottomColor: theme.line, color: theme.ink },
                ]}
              />
            </View>
            {overBudget && (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.warning, { backgroundColor: theme.dangerBackground }]}
              >
                <ThemedText type="small" style={{ color: theme.expense }}>
                  {t('common.slowDown')}
                </ThemedText>
              </View>
            )}
            {possibleDuplicate && (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.warning, { backgroundColor: theme.transferBackground }]}
              >
                <ThemedText type="small" style={{ color: theme.gold }}>
                  {t('common.possibleDuplicate')}
                </ThemedText>
              </View>
            )}
            <FieldLabel>{t('common.transactionDate')}</FieldLabel>
            <FormDateField
              date={date}
              calendarOpen={calendarOpen}
              onToggle={toggleCalendar}
              onSelect={(candidate) => {
                setDate(candidate);
                setCalendarOpen(false);
              }}
              calendarMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              maxMonth={today.slice(0, 7)}
              styles={styles}
            />
            <FieldLabel>
              {t('common.notes')}{' '}
              <ThemedText type="small" themeColor="muted">
                ({t('common.optional')})
              </ThemedText>
            </FieldLabel>
            <ThemedInput
              accessibilityLabel={t('common.transactionNote')}
              placeholder={t('common.transactionNotePlaceholder')}
              placeholderTextColor={theme.muted}
              value={note}
              onChangeText={setNote}
              style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }]}
            />
            {mode === 'edit' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.deleteTransaction')}
                onPress={() =>
                  setConfirmation({
                    title: t('common.deleteTransactionConfirm'),
                    message: t('common.deleteTransactionCopy'),
                    confirmLabel: t('common.delete'),
                    destructive: true,
                    onConfirm: () => onDelete?.(),
                  })
                }
                style={styles.deleteAction}
              >
                <ThemedText type="smallBold" style={{ color: theme.expense }}>
                  {t('common.deleteTransaction')}
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        <ConfirmationModal
          visible={confirmation !== null}
          title={confirmation?.title ?? ''}
          message={confirmation?.message ?? ''}
          confirmLabel={confirmation?.confirmLabel ?? t('common.understand')}
          destructive={confirmation?.destructive}
          cancelLabel={
            confirmation?.confirmLabel === t('common.understand') ? undefined : t('common.cancel')
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={async () => {
            const action = confirmation?.onConfirm;
            setConfirmation(null);
            await action?.();
          }}
        />
      </MotionScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  body: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 65,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    minWidth: 64,
  },
  close: { fontSize: 28, lineHeight: 32 },
  content: {
    gap: Spacing.two,
    paddingHorizontal: 21,
    paddingTop: 24,
    paddingBottom: 40,
  },
  typeTabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.four,
  },
  typeTabWrapper: { flex: 1 },
  typeTab: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flex: 1,
    paddingVertical: 11,
  },
  lockedWallet: { borderRadius: 13, borderWidth: 1, gap: 2, padding: 11 },
  swap: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  dateButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  dateButtonText: { flex: 1 },
  amountInput: {
    borderBottomWidth: 1,
    fontFamily: Fonts.serif,
    fontSize: 29,
    lineHeight: 34,
    minHeight: 57,
    paddingHorizontal: 0,
  },
  warning: { borderRadius: 12, padding: 10 },
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 0,
  },
  moneyInputRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  moneyInput: { flex: 1 },
  deleteAction: { alignItems: 'center', paddingVertical: Spacing.four },
});
