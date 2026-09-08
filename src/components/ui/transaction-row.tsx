import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { CategoryIcon } from '@/components/ui/category-icon';
import { MotionPressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import { formatMoney } from '@/lib/money';
import { getTransactionPresentation } from '@/lib/presentation';
import type { Category, Transaction, Wallet } from '@/types/domain';

/**
 * A single transaction row used by the Home, History and Daily screens.
 * Renders the type-tinted category icon, the category name + wallet·note detail
 * and the signed amount + time. The entire row is pressable.
 */
export function TransactionRow({
  transaction,
  categories,
  wallets,
  onPress,
  accessibilityLabel,
  style,
}: {
  transaction: Transaction;
  categories: Category[];
  wallets: Wallet[];
  onPress?: () => void;
  /** Builds the accessibility label from the resolved category name; used only when `onPress` is set. */
  accessibilityLabel?: (categoryName: string) => string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const presentation = getTransactionPresentation(transaction, categories, wallets);
  const category = categories.find((item) => item.id === transaction.categoryId);
  const categoryName = category ? getCategoryLabel(category) : presentation.categoryName;
  const income = transaction.type === 'income';
  const expense = transaction.type === 'expense';
  const color = income ? theme.income : expense ? theme.expense : theme.gold;
  const background = income
    ? theme.incomeBackground
    : expense
      ? theme.expenseBackground
      : theme.transferBackground;
  const sign = income ? '+' : expense ? '−' : '↔';
  const detail = [presentation.walletName, transaction.note].filter(Boolean).join(' · ');

  return (
    <MotionPressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        onPress && accessibilityLabel ? accessibilityLabel(categoryName) : undefined
      }
      onPress={onPress}
      style={[styles.row, { borderBottomColor: theme.line }, style]}
    >
      <ThemedView style={[styles.icon, { backgroundColor: background }]}>
        <CategoryIcon name={presentation.categoryIcon} color={color} />
      </ThemedView>
      <View style={styles.copy}>
        <ThemedText type="smallBold" style={styles.name} numberOfLines={1}>
          {categoryName}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.detail} numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>
      <View style={styles.amount}>
        <ThemedText type="code" style={[styles.amountText, { color }]} numberOfLines={1}>
          {sign} {formatMoney(transaction.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.time}>
          {transaction.time}
        </ThemedText>
      </View>
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingHorizontal: 1,
    paddingVertical: 12,
  },
  icon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  copy: { flex: 1, minWidth: 0 },
  name: { fontSize: 12, lineHeight: 16 },
  detail: { fontSize: 10, lineHeight: 14, marginTop: Spacing.half },
  amount: { alignItems: 'flex-end' },
  amountText: { fontSize: 12, lineHeight: 16 },
  time: { fontSize: 10, lineHeight: 14 },
});
