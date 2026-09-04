import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => router.back()}
            >
              <ThemedText style={styles.back}>‹</ThemedText>
            </Pressable>
            <View style={styles.headerCenter}>
              <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                TRANSAKSI HARIAN
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pilih tanggal"
                onPress={() => setCalendarOpen((open) => !open)}
              >
                <ThemedText type="sectionHeading">{formatDateLabel(date)}⌄</ThemedText>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Buka kalender"
              onPress={() => setCalendarOpen((open) => !open)}
            >
              <ThemedText style={[styles.calendarButton, { color: theme.pine }]}>▦</ThemedText>
            </Pressable>
          </View>
          <View style={styles.dayStepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hari sebelumnya"
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
              accessibilityLabel="Hari berikutnya"
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
            <View
              style={[styles.calendar, { borderColor: theme.line, backgroundColor: theme.card }]}
            >
              {calendarDates.map((calendarDate) => (
                <Pressable
                  key={calendarDate}
                  accessibilityRole="button"
                  accessibilityLabel={`Tanggal ${calendarDate}`}
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
          )}
          <View style={[styles.summary, { borderColor: theme.line, backgroundColor: theme.card }]}>
            <SummaryItem label="Masuk" value={totals.income} color={theme.income} sign="+" />
            <SummaryItem label="Keluar" value={totals.expense} color={theme.expense} sign="−" />
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
                Belum ada catatan
              </ThemedText>
              <ThemedText type="small" themeColor="muted" style={styles.emptyDescription}>
                Tidak ada transaksi pada {formatDateLabel(date)}.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tambah transaksi"
                onPress={() => router.push('/create')}
                style={[styles.primary, { backgroundColor: theme.pine }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                  Tambah transaksi →
                </ThemedText>
              </Pressable>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lihat Semua Transaksi"
            onPress={() => router.push('/history')}
            style={styles.allHistory}
          >
            <ThemedText type="smallBold" themeColor="pine">
              Lihat Semua Transaksi →
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
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
      accessibilityLabel={`Edit transaksi ${presentation.categoryName}`}
      onPress={() =>
        router.push({ pathname: '/create', params: { transactionId: transaction.id } })
      }
      style={[styles.transaction, { borderBottomColor: theme.line }]}
    >
      <ThemedView style={[styles.icon, { backgroundColor: background }]}>
        <ThemedText style={{ color }}>{presentation.categoryIcon}</ThemedText>
      </ThemedView>
      <View style={styles.transactionCopy}>
        <ThemedText type="smallBold">{presentation.categoryName}</ThemedText>
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
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );
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
