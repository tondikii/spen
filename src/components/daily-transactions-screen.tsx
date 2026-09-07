import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import {
  MotionChevron,
  MotionCollapsible,
  MotionScreen,
  MotionPressable as Pressable,
} from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Layout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import i18n from '@/i18n';
import { getCategoryLabel } from '@/i18n/categories';
import { getIntlLocale } from '@/i18n/format';
import { formatMoney } from '@/lib/money';
import {
  getDailyLabel,
  getDailyTotals,
  getDailyTransactions,
  shiftDate,
} from '@/services/daily-service';
import { getTransactionPresentation } from '@/services/home-service';
import type { Category, Transaction, Wallet } from '@/types/domain';

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
  const [calendarMonth, setCalendarMonth] = useState((today ?? '2026-09-01').slice(0, 7));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const transactions = useMemo(
    () => getDailyTransactions(date, transactionsProp),
    [date, transactionsProp],
  );
  const totals = getDailyTotals(transactions);
  const calendarDates = useMemo(() => getCalendarDates(calendarMonth), [calendarMonth]);
  const weekdayLabels = getWeekdayLabels();

  const selectDate = (nextDate: string) => {
    setDate(nextDate);
    setCalendarMonth(nextDate.slice(0, 7));
  };

  const moveDay = (days: number) => selectDate(shiftDate(date, days));

  const toggleCalendar = () => {
    if (!calendarOpen) setCalendarMonth(date.slice(0, 7));
    setCalendarOpen((open) => !open);
  };

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { borderBottomColor: theme.line }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.closeTransactionForm')}
                onPress={() => router.back()}
                style={styles.headerButton}
              >
                <ThemedText style={styles.close}>×</ThemedText>
              </Pressable>
              <ThemedText type="sectionHeading">{t('common.dailyTransactions')}</ThemedText>
              <View accessible={false} style={styles.headerButton} />
            </View>

            <View
              style={[styles.dateCard, { borderColor: theme.mint, backgroundColor: theme.mint }]}
            >
              <View style={styles.dateNavigator}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.previousDay')}
                  hitSlop={6}
                  onPress={() => moveDay(-1)}
                  wrapperStyle={styles.stepperWrapper}
                  style={styles.stepperButton}
                >
                  <ThemedText style={[styles.stepperGlyph, { color: theme.pine }]}>‹</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.selectDate')}
                  accessibilityState={{ expanded: calendarOpen }}
                  onPress={toggleCalendar}
                  wrapperStyle={styles.dateButtonWrapper}
                  style={styles.dateButton}
                >
                  <ThemedText type="sectionHeading">{getDailyLabel(date, today)}</ThemedText>
                  <View style={styles.dateDetail}>
                    <ThemedText type="code" themeColor="muted" style={styles.dateDetailText}>
                      {formatFullDate(date)}
                    </ThemedText>
                    <MotionChevron expanded={calendarOpen} color={theme.muted} size={16} />
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.nextDay')}
                  hitSlop={6}
                  onPress={() => moveDay(1)}
                  wrapperStyle={styles.stepperWrapper}
                  style={styles.stepperButton}
                >
                  <ThemedText style={[styles.stepperGlyph, { color: theme.pine }]}>›</ThemedText>
                </Pressable>
              </View>
              <View
                style={[styles.dateCardSeparator, { backgroundColor: theme.walletAddBorder }]}
              />
              <View style={styles.dateCardFooter}>
                <SummaryItem label={t('common.income')} value={totals.income} />
                <SummaryItem label={t('common.expense')} value={totals.expense} alignRight />
              </View>
            </View>

            {calendarOpen && (
              <MotionCollapsible>
                <View
                  style={[
                    styles.calendar,
                    { borderColor: theme.line, backgroundColor: theme.card },
                  ]}
                >
                  <View style={styles.calendarHeader}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.previousMonth')}
                      onPress={() => setCalendarMonth((month) => shiftMonth(month, -1))}
                      wrapperStyle={styles.calendarMonthButton}
                      style={styles.calendarMonthButton}
                    >
                      <ThemedText style={[styles.calendarChevron, { color: theme.pine }]}>
                        ‹
                      </ThemedText>
                    </Pressable>
                    <ThemedText type="smallBold">{formatCalendarMonth(calendarMonth)}</ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.nextMonth')}
                      onPress={() => setCalendarMonth((month) => shiftMonth(month, 1))}
                      wrapperStyle={styles.calendarMonthButton}
                      style={styles.calendarMonthButton}
                    >
                      <ThemedText style={[styles.calendarChevron, { color: theme.pine }]}>
                        ›
                      </ThemedText>
                    </Pressable>
                  </View>
                  <View style={styles.calendarGrid}>
                    {weekdayLabels.map((label, index) => (
                      <View key={`${label}-${index}`} style={styles.calendarCell}>
                        <ThemedText type="code" themeColor="muted" style={styles.weekday}>
                          {label}
                        </ThemedText>
                      </View>
                    ))}
                    {calendarDates.map((calendarDate) => {
                      const selected = calendarDate.date === date;
                      return (
                        <Pressable
                          key={calendarDate.date}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.date', { date: calendarDate.date })}
                          accessibilityState={{ selected }}
                          onPress={() => {
                            selectDate(calendarDate.date);
                            setCalendarOpen(false);
                          }}
                          wrapperStyle={styles.calendarCell}
                          style={styles.calendarPressable}
                        >
                          <View
                            style={[
                              styles.calendarDay,
                              selected && { backgroundColor: theme.pine },
                            ]}
                          >
                            <ThemedText
                              type="smallBold"
                              themeColor={calendarDate.inMonth ? 'ink' : 'muted'}
                              style={selected ? { color: theme.heroText } : undefined}
                            >
                              {Number(calendarDate.date.slice(8))}
                            </ThemedText>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </MotionCollapsible>
            )}

            {transactions.length > 0 ? (
              <View>
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
                <View style={[styles.emptyIcon, { backgroundColor: theme.mint }]}>
                  <ThemedText style={[styles.emptyGlyph, { color: theme.pine }]}>◌</ThemedText>
                </View>
                <ThemedText type="sectionHeading" style={styles.emptyTitle}>
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
                    {t('common.addTransaction')}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </MotionScreen>
    </ThemedView>
  );
}

function SummaryItem({
  label,
  value,
  alignRight = false,
}: {
  label: string;
  value: number;
  alignRight?: boolean;
}) {
  return (
    <View style={[styles.summaryItem, alignRight && styles.summaryItemRight]}>
      <ThemedText
        type="small"
        themeColor="muted"
        style={[styles.summaryStat, alignRight && styles.summaryStatRight]}
      >
        {label} <ThemedText style={styles.summaryAmount}>{formatMoney(value)}</ThemedText>
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
  const isExpense = transaction.type === 'expense';
  const isTransfer = !isIncome && !isExpense;
  const typeColor = isIncome ? 'income' : isExpense ? 'expense' : 'gold';
  const color = theme[typeColor];
  const background = isIncome
    ? theme.incomeBackground
    : isExpense
      ? theme.expenseBackground
      : theme.transferBackground;
  const detail = [presentation.walletName, transaction.note].filter(Boolean).join(' · ');

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
        <CategoryIcon name={presentation.categoryIcon} color={color} />
      </ThemedView>
      <View style={styles.transactionCopy}>
        <ThemedText type="smallBold" style={styles.transactionName} numberOfLines={1}>
          {categoryName}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="muted"
          style={styles.transactionDetail}
          numberOfLines={1}
        >
          {detail}
        </ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText
          type="code"
          style={[styles.transactionAmountText, { color }]}
          numberOfLines={1}
        >
          {isIncome ? '+' : isTransfer ? '↔' : '−'} {formatMoney(transaction.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.transactionTime}>
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

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function formatCalendarMonth(month: string) {
  return new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00`));
}

function getWeekdayLabels() {
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
      weekday: 'narrow',
    }).format(new Date(`2026-09-${String(index + 7).padStart(2, '0')}T12:00:00`)),
  );
}

function getCalendarDates(month: string) {
  const firstDay = new Date(`${month}-01T12:00:00`);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const firstDate = shiftDate(`${month}-01`, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = shiftDate(firstDate, index);
    return { date, inMonth: date.startsWith(month) };
  });
}

function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingBottom: Spacing.six,
    paddingHorizontal: Layout.pagePadding,
    paddingTop: 0,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 65,
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    marginHorizontal: -Layout.pagePadding,
    paddingHorizontal: 20,
  },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', minWidth: 64 },
  close: { fontSize: 28, lineHeight: 32 },
  dateCard: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    overflow: 'hidden',
  },
  dateNavigator: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 82,
    paddingHorizontal: 0,
  },
  stepperWrapper: { width: 48 },
  stepperButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  stepperGlyph: { fontFamily: Fonts.sans, fontSize: 28, lineHeight: 31 },
  dateButtonWrapper: { alignSelf: 'stretch', flex: 1 },
  dateButton: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 68,
    width: '100%',
  },
  dateDetail: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  dateDetailText: { fontSize: 10, lineHeight: 14, textTransform: 'capitalize' },
  dateCardSeparator: { height: 1, marginHorizontal: 17 },
  dateCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  calendar: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.three,
    padding: 14,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarMonthButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  calendarChevron: { fontSize: 24, lineHeight: 27 },
  calendarGrid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calendarCell: {
    alignItems: 'center',
    flexBasis: '14.2857%',
    justifyContent: 'center',
    width: '14.2857%',
  },
  calendarPressable: { alignItems: 'center', alignSelf: 'stretch' },
  calendarDay: {
    alignItems: 'center',
    borderRadius: Radius.small,
    height: 34,
    justifyContent: 'center',
    marginVertical: 2,
    width: 34,
  },
  weekday: { fontSize: 9, lineHeight: 20, textTransform: 'uppercase' },
  summaryItem: { flex: 1, minWidth: 0 },
  summaryItemRight: { alignItems: 'flex-end' },
  summaryStat: { fontSize: 10, lineHeight: 14 },
  summaryStatRight: { textAlign: 'right' },
  summaryAmount: { fontFamily: Fonts.monoMedium, fontSize: 10, lineHeight: 14 },
  transaction: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingHorizontal: 1,
    paddingVertical: 12,
  },
  icon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  transactionCopy: { flex: 1, minWidth: 0 },
  transactionAmount: { alignItems: 'flex-end' },
  transactionName: { fontSize: 12, lineHeight: 16 },
  transactionDetail: { fontSize: 10, lineHeight: 14, marginTop: Spacing.half },
  transactionAmountText: { fontSize: 12, lineHeight: 16 },
  transactionTime: { fontSize: 10, lineHeight: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 15, paddingTop: 46 },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 25,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyGlyph: { fontSize: 34, lineHeight: 38 },
  emptyTitle: { marginTop: 15 },
  emptyDescription: { marginBottom: Spacing.four, marginTop: Spacing.one, textAlign: 'center' },
  primary: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 17,
    width: '100%',
  },
});
