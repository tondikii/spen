import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import {
  getDailyLabel,
  getDailyTotals,
  getDailyTransactions,
  shiftDate,
} from '@/services/daily-service';
import { getTransactionPresentation } from '@/services/home-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { getCategoryLabel } from '@/i18n/categories';
import { getIntlLocale } from '@/i18n/format';
import {
  MotionChevron,
  MotionCollapsible,
  MotionPressable as Pressable,
  MotionScreen,
} from '@/components/motion';

export default function DailyTransactionsScreen({
  transactions: transactionsProp,
  categories,
  wallets,
  today,
}: {
  transactions?: Transaction[];
  categories?: Category[];
  wallets?: Wallet[];
  today?: string;
} = {}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [date, setDate] = useState(today ?? '2026-09-01');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const transactions = useMemo(
    () => getDailyTransactions(date, transactionsProp),
    [date, transactionsProp],
  );
  const totals = getDailyTotals(transactions);
  const calendarDates = Array.from({ length: 7 }, (_, index) => shiftDate(date, index - 3));

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                onPress={() => router.back()}
              >
                <ThemedText style={styles.back}>‹</ThemedText>
              </Pressable>
              <View style={styles.headerCenter}>
                <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                  {t('common.daily')}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.selectDate')}
                  onPress={() => setCalendarOpen((open) => !open)}
                >
                  <View style={styles.datePickerLabel}>
                    <ThemedText type="sectionHeading">{formatDateLabel(date)}</ThemedText>
                    <MotionChevron expanded={calendarOpen} color={theme.ink} size={18} />
                  </View>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.openCalendar')}
                onPress={() => setCalendarOpen((open) => !open)}
              >
                <ThemedText style={[styles.calendarButton, { color: theme.pine }]}>▦</ThemedText>
              </Pressable>
            </View>
            <View style={styles.dayStepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.previousDay')}
                onPress={() => setDate((current) => shiftDate(current, -1))}
                style={[
                  styles.stepperButton,
                  { borderColor: theme.line, backgroundColor: theme.card },
                ]}
              >
                <ThemedText type="subtitle" themeColor="pine">
                  ‹
                </ThemedText>
              </Pressable>
              <ThemedText type="smallBold">{getDailyLabel(date, today)}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.nextDay')}
                onPress={() => setDate((current) => shiftDate(current, 1))}
                style={[
                  styles.stepperButton,
                  { borderColor: theme.line, backgroundColor: theme.card },
                ]}
              >
                <ThemedText type="subtitle" themeColor="pine">
                  ›
                </ThemedText>
              </Pressable>
            </View>
            {calendarOpen && (
              <MotionCollapsible>
                <View
                  style={[
                    styles.calendar,
                    { borderColor: theme.line, backgroundColor: theme.card },
                  ]}
                >
                  {calendarDates.map((calendarDate) => (
                    <Pressable
                      key={calendarDate}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.date', { date: calendarDate })}
                      onPress={() => {
                        setDate(calendarDate);
                        setCalendarOpen(false);
                      }}
                      style={[
                        styles.calendarDay,
                        calendarDate === date && { backgroundColor: theme.pine },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={calendarDate === date ? { color: theme.heroText } : undefined}
                      >
                        {calendarDate.slice(8)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </MotionCollapsible>
            )}
            <View
              style={[styles.summary, { borderColor: theme.line, backgroundColor: theme.card }]}
            >
              <SummaryItem
                label={t('common.income')}
                value={totals.income}
                color={theme.income}
                sign="+"
              />
              <SummaryItem
                label={t('common.expense')}
                value={totals.expense}
                color={theme.expense}
                sign="−"
              />
            </View>
            {transactions.length > 0 ? (
              <View style={[styles.list, { borderTopColor: theme.line }]}>
                {transactions.map((transaction) => (
                  <DailyTransaction
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                    wallets={wallets}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <ThemedText style={[styles.emptyGlyph, { color: theme.pine }]}>◌</ThemedText>
                <ThemedText type="subtitle" style={styles.emptyTitle}>
                  {t('common.noRecords')}
                </ThemedText>
                <ThemedText type="small" themeColor="muted" style={styles.emptyDescription}>
                  {t('common.noTransactionsOn', { date: formatDateLabel(date) })}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.addTransaction')}
                  onPress={() => router.push('/create')}
                  style={[styles.primary, { backgroundColor: theme.pine }]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                    {t('common.addTransaction')} →
                  </ThemedText>
                </Pressable>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.viewAllTransactions')}
              onPress={() => router.push('/history')}
              style={styles.allHistory}
            >
              <ThemedText type="smallBold" themeColor="pine">
                {t('common.allTransactions')} →
              </ThemedText>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </MotionScreen>
    </ThemedView>
  );
}

function SummaryItem({
  label,
  value,
  color,
  sign,
}: {
  label: string;
  value: number;
  color: string;
  sign: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <ThemedText type="small" themeColor="muted">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color, fontFamily: Fonts.mono }}>
        {sign} {formatMoney(value)}
      </ThemedText>
    </View>
  );
}
function DailyTransaction({
  transaction,
  categories,
  wallets,
}: {
  transaction: Transaction;
  categories?: Category[];
  wallets?: Wallet[];
}) {
  const theme = useTheme();
  const presentation = getTransactionPresentation(transaction, categories, wallets);
  const category = categories?.find((item) => item.id === transaction.categoryId);
  const categoryName = category ? getCategoryLabel(category) : presentation.categoryName;
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const color = isIncome ? theme.income : isTransfer ? theme.gold : theme.expense;
  const background = isIncome
    ? theme.incomeBackground
    : isTransfer
      ? theme.transferBackground
      : theme.expenseBackground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={i18n.t('common.editTransaction', { name: categoryName })}
      onPress={() =>
        router.push({ pathname: '/create', params: { transactionId: transaction.id } })
      }
      style={[styles.transaction, { borderBottomColor: theme.line }]}
    >
      <ThemedView style={[styles.icon, { backgroundColor: background }]}>
        <ThemedText style={{ color }}>{presentation.categoryIcon}</ThemedText>
      </ThemedView>
      <View style={styles.transactionCopy}>
        <ThemedText type="smallBold">{categoryName}</ThemedText>
        <ThemedText type="small" themeColor="muted" numberOfLines={1}>
          {presentation.walletName} · {transaction.note}
        </ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText type="smallBold" style={{ color }}>
          {isIncome ? '+' : isTransfer ? '↔' : '−'} {formatMoney(transaction.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted">
          {transaction.time}
        </ThemedText>
      </View>
    </Pressable>
  );
}
function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: 430,
    paddingHorizontal: 21,
    paddingTop: 24,
    paddingBottom: 48,
    width: '100%',
  },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 20 },
  back: { fontSize: 26, lineHeight: 30, padding: 6 },
  headerCenter: { alignItems: 'center', flex: 1 },
  datePickerLabel: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  calendarButton: { fontSize: 21, lineHeight: 29, padding: 6, width: 41 },
  eyebrow: { ...Typography.eyebrow, marginBottom: Spacing.one },
  dayStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: Spacing.one,
  },
  stepperButton: {
    alignItems: 'center',
    borderRadius: Radius.small,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  calendar: {
    alignSelf: 'center',
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    padding: 9,
    width: '100%',
  },
  calendarDay: {
    alignItems: 'center',
    borderRadius: Radius.small,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  summary: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryItem: { flex: 1, gap: Spacing.one },
  list: { borderTopWidth: 1 },
  transaction: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingVertical: 12,
  },
  icon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  transactionCopy: { flex: 1, minWidth: 0 },
  transactionAmount: { alignItems: 'flex-end', marginLeft: 8 },
  empty: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 58 },
  emptyGlyph: { fontSize: 38 },
  emptyTitle: { fontSize: 21, lineHeight: 24, marginTop: Spacing.two },
  emptyDescription: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: Spacing.four,
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  primary: {
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 17,
    paddingVertical: 15,
    width: '100%',
  },
  allHistory: { alignItems: 'center', paddingVertical: 25 },
});
