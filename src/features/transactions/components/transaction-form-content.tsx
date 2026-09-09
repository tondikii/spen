import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyMark } from '@/components/ui/currency-mark';
import { DateField } from '@/components/ui/date-field';
import { FieldLabel } from '@/components/ui/form-fields';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { Fonts, Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyInput } from '@/utils/money-input';
import type { Category, TransactionType, Wallet } from '@/types/domain';

import { TransactionCategoryPicker } from './transaction-category-picker';

const tabs: { type: TransactionType; translationKey: string }[] = [
  { type: 'income', translationKey: 'common.income' },
  { type: 'expense', translationKey: 'common.expense' },
  { type: 'transfer', translationKey: 'categories.transfer' },
];

type TransactionFormContentProps = {
  mode: 'create' | 'edit';
  type: TransactionType;
  effectiveType: TransactionType;
  onChangeType: (nextType: TransactionType) => void;
  wallets: Wallet[];
  walletId: string | null;
  onWalletChange: (walletId: string | null) => void;
  toWalletId: string | null;
  onToWalletChange: (toWalletId: string | null) => void;
  lockedToWalletId?: string | undefined;
  adminFee: string;
  onAdminFeeChange: (value: string) => void;
  categories: Category[];
  onCategoriesChange: (update: (current: Category[]) => Category[]) => void;
  categoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  internalCategory?: Category | undefined;
  onSaveCategory: (category: Category) => Category | Promise<Category>;
  onArchiveCategory: (category: Category) => void | Promise<void>;
  amount: string;
  onAmountChange: (value: string) => void;
  overBudget: boolean;
  possibleDuplicate: boolean;
  saveError: string | null;
  date: string;
  onDateChange: (date: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  today: string;
  bottomInset: number;
  onRequestDelete: () => void;
};

export function TransactionFormContent({
  mode,
  type,
  effectiveType,
  onChangeType,
  wallets,
  walletId,
  onWalletChange,
  toWalletId,
  onToWalletChange,
  lockedToWalletId,
  adminFee,
  onAdminFeeChange,
  categories,
  onCategoriesChange,
  categoryId,
  onCategorySelect,
  internalCategory,
  onSaveCategory,
  onArchiveCategory,
  amount,
  onAmountChange,
  overBudget,
  possibleDuplicate,
  saveError,
  date,
  onDateChange,
  note,
  onNoteChange,
  today,
  bottomInset,
  onRequestDelete,
}: TransactionFormContentProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <KeyboardAvoidingView
      style={styles.body}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {saveError && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.warning, { backgroundColor: theme.dangerBackground }]}
          >
            <ThemedText type="small" style={{ color: theme.expense }}>
              {saveError}
            </ThemedText>
          </View>
        )}
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
              onPress={() => onChangeType(tab.type)}
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
            <WalletPicker wallets={wallets} selected={walletId} onSelect={onWalletChange} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.swapTransferWallet')}
              accessibilityHint={t('common.swapTransferWalletHint')}
              onPress={() => {
                onWalletChange(toWalletId);
                onToWalletChange(walletId);
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
                onSelect={onToWalletChange}
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
                onChangeText={(value) => onAdminFeeChange(formatMoneyInput(value))}
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
            <WalletPicker wallets={wallets} selected={walletId} onSelect={onWalletChange} />
            <TransactionCategoryPicker
              type={type}
              categories={categories}
              onCategoriesChange={onCategoriesChange}
              selectedId={categoryId}
              onSelect={onCategorySelect}
              internalCategory={internalCategory}
              onSaveCategory={onSaveCategory}
              onArchiveCategory={onArchiveCategory}
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
            onChangeText={(value) => onAmountChange(formatMoneyInput(value))}
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
        <DateField date={date} onSelect={onDateChange} maxDate={today} />
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
          onChangeText={onNoteChange}
          style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }]}
        />
        {mode === 'edit' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.deleteTransaction')}
            onPress={onRequestDelete}
            style={styles.deleteAction}
          >
            <ThemedText type="smallBold" style={{ color: theme.expense }}>
              {t('common.deleteTransaction')}
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
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
