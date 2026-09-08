import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import {
  MotionChevron,
  MotionCollapsible,
  MotionScreen,
  MotionPressable as Pressable,
} from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionRow } from '@/components/transaction-row';
import { MonthCalendar } from '@/components/month-calendar';
import { Fonts, Layout, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import i18n from '@/i18n';
import { formatDayLabel, getIntlLocale } from '@/i18n/format';
import { shiftDate } from '@/lib/calendar';
import { formatMoney } from '@/lib/money';
import { getDailyTotals, getDailyTransactions } from '@/lib/presentation';
import type { Category, Transaction, Wallet } from '@/types/domain';

export default function DailyTransactionsScreen({
  transactions,
  categories,
  wallets,
  today,
}: {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  today: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const [date, setDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dailyTransactions = useMemo(
    () => getDailyTransactions(date, transactions),
    [date, transactions],
  );
  const totals = getDailyTotals(dailyTransactions);

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
                  <ThemedText type="sectionHeading">
                    {formatDayLabel(date, today, locale)}
                  </ThemedText>
                  <View style={styles.dateDetail}>
                    <ThemedText type="code" themeColor="muted" style={styles.dateDetailText}>
                      {formatFullDate(date, locale)}
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
                <MonthCalendar
                  month={calendarMonth}
                  selected={date}
                  onSelect={(candidate) => {
                    selectDate(candidate);
                    setCalendarOpen(false);
                  }}
                  onMonthChange={setCalendarMonth}
                  dayAccessibilityLabel={(candidate) => t('common.date', { date: candidate })}
                  style={{ backgroundColor: theme.card }}
                />
              </MotionCollapsible>
            )}

            {dailyTransactions.length > 0 ? (
              <View>
                {dailyTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                    wallets={wallets}
                    onPress={() =>
                      router.push({
                        pathname: '/create',
                        params: { transactionId: transaction.id },
                      })
                    }
                    accessibilityLabel={(name) => i18n.t('common.editTransaction', { name })}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                boxed
                title={t('common.noRecords')}
                titleType="sectionHeading"
                description={t('common.noTransactionsOn', {
                  date: formatDateLabel(date, locale),
                })}
                actionLabel={t('common.addTransaction')}
                onAction={() => router.push('/create')}
                style={styles.empty}
              />
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

function formatDateLabel(date: string, locale: 'id' | 'en') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

function formatFullDate(date: string, locale: 'id' | 'en') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
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
  summaryItem: { flex: 1, minWidth: 0 },
  summaryItemRight: { alignItems: 'flex-end' },
  summaryStat: { fontSize: 10, lineHeight: 14 },
  summaryStatRight: { textAlign: 'right' },
  summaryAmount: { fontFamily: Fonts.monoMedium, fontSize: 10, lineHeight: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 15, paddingTop: 46 },
});
