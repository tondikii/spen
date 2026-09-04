import { useMemo, useState, type ComponentProps } from 'react';
import { Modal, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomTabInset,
  Layout,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import {
  filterHistoryPeriod,
  filterHistoryTransactions,
  getHistoryPage,
  groupHistoryByDate,
  type HistoryFilter,
} from '@/services/history-service';
import { getTransactionPresentation } from '@/services/home-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type HistoryChip = HistoryFilter | 'makan';

const filterOptions: { key: HistoryChip; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'expense', label: 'Pengeluaran' },
  { key: 'income', label: 'Pendapatan' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'makan', label: 'Makan' },
];

function HistoryScreenContent({
  transactions: transactionsProp,
  categories,
  wallets,
}: { transactions?: Transaction[]; categories?: Category[]; wallets?: Wallet[] } = {}) {
  const theme = useTheme();
  const {
    categoryId: categoryParam,
    walletId: walletParam,
    startDate,
    endDate,
  } = useLocalSearchParams<{
    categoryId?: string;
    walletId?: string;
    startDate?: string;
    endDate?: string;
  }>();
  const [filter, setFilter] = useState<HistoryFilter>(categoryParam ? 'expense' : 'all');
  const [categoryId, setCategoryId] = useState<string | undefined>(categoryParam);
  const [walletId, setWalletId] = useState<string | undefined>(walletParam);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const transactions = useMemo(
    () =>
      getHistoryPage(
        page,
        5,
        filterHistoryPeriod(
          transactionsProp ?? getHistoryPage(1, Number.MAX_SAFE_INTEGER),
          startDate,
          endDate,
        ),
      ),
    [page, startDate, endDate, transactionsProp],
  );
  const filtered = filterHistoryTransactions(transactions, filter, categoryId, walletId);
  const groups = groupHistoryByDate(filtered);
  const sections = groups.map((group) => ({ title: group.date, data: group.data }));
  const chooseFilter = (key: HistoryChip) => {
    setFilter(key === 'makan' ? 'expense' : key);
    setCategoryId(key === 'makan' ? 'category-makan' : undefined);
    setWalletId(undefined);
    setPage(1);
    setFilterOpen(false);
  };
  const chooseWallet = (nextWalletId: string) => {
    setWalletId(nextWalletId);
    setCategoryId(undefined);
    setFilter('all');
    setPage(1);
    setFilterOpen(false);
  };

  return (
    <ThemedView style={styles.page}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        onEndReached={() =>
          setPage((current) =>
            Math.min(current + 1, Math.max(1, Math.ceil((transactionsProp?.length ?? 5) / 5))),
          )
        }
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => router.back()}
            >
              <ThemedText style={styles.back}>‹</ThemedText>
            </Pressable>
            <View style={styles.headerCopy}>
              <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                SEMUA TRANSAKSI
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                Riwayat
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText style={[styles.emptyGlyph, { color: theme.pine }]}>◌</ThemedText>
            <ThemedText type="subtitle">Belum ada catatan</ThemedText>
            <ThemedText type="small" themeColor="muted">
              Tidak ada transaksi yang cocok dengan filter ini.
            </ThemedText>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { backgroundColor: theme.background, borderBottomColor: theme.line },
            ]}
          >
            <ThemedText type="smallBold">{formatDate(section.title)}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              {formatMoney(
                section.data.reduce(
                  (sum, item) => sum + (item.type === 'income' ? item.amount : 0),
                  0,
                ),
              )}{' '}
              masuk
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => (
          <HistoryTransaction transaction={item} categories={categories} wallets={wallets} />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <ThemedText type="small" themeColor="muted">
              Geser untuk memuat lebih banyak
            </ThemedText>
          </View>
        }
      />
      <View style={[styles.filterBar, { backgroundColor: theme.card, borderTopColor: theme.line }]}>
        {
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            onPress={() => setFilterOpen(true)}
          >
            <ThemedText type="smallBold" themeColor="pine">
              Filter
            </ThemedText>
          </Pressable>
        }
      </View>
      <Modal
        transparent
        animationType="slide"
        visible={filterOpen}
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setFilterOpen(false)}
        >
          <View style={[styles.filterSheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">Filter transaksi</ThemedText>
            {filterOptions.map((option) => (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityLabel={`Pilih filter ${option.label}`}
                accessibilityState={{ selected: filter === option.key && !categoryId && !walletId }}
                onPress={() => chooseFilter(option.key)}
                style={[styles.filterOption, { borderTopColor: theme.line }]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor={
                    (
                      option.key === 'makan'
                        ? categoryId === 'category-makan'
                        : categoryId === undefined &&
                          walletId === undefined &&
                          filter === option.key
                    )
                      ? 'pine'
                      : 'ink'
                  }
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
            {categories?.map((category) => (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Pilih filter kategori ${category.name}`}
                accessibilityState={{ selected: categoryId === category.id }}
                onPress={() => {
                  setCategoryId(category.id);
                  setWalletId(undefined);
                  setFilter(
                    category.type === 'income'
                      ? 'income'
                      : category.type === 'transfer'
                        ? 'transfer'
                        : 'expense',
                  );
                  setPage(1);
                  setFilterOpen(false);
                }}
                style={[styles.filterOption, { borderTopColor: theme.line }]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor={categoryId === category.id ? 'pine' : 'ink'}
                >
                  {category.name}
                </ThemedText>
              </Pressable>
            ))}
            {wallets?.map((wallet) => (
              <Pressable
                key={wallet.id}
                accessibilityRole="button"
                accessibilityLabel={`Pilih filter Wallet ${wallet.name}`}
                accessibilityState={{ selected: walletId === wallet.id }}
                onPress={() => chooseWallet(wallet.id)}
                style={[styles.filterOption, { borderTopColor: theme.line }]}
              >
                <ThemedText type="smallBold" themeColor={walletId === wallet.id ? 'pine' : 'ink'}>
                  {wallet.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

export default function HistoryScreen(props: ComponentProps<typeof HistoryScreenContent>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <HistoryScreenContent {...props} />
    </SafeAreaView>
  );
}

function HistoryTransaction({
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
  const income = transaction.type === 'income';
  const transfer = transaction.type === 'transfer';
  const color = income ? theme.income : transfer ? theme.gold : theme.expense;
  const background = income
    ? theme.incomeBackground
    : transfer
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
      <View style={styles.copy}>
        <ThemedText type="smallBold">{presentation.categoryName}</ThemedText>
        <ThemedText type="small" themeColor="muted" numberOfLines={1}>
          {presentation.walletName} · {transaction.note}
        </ThemedText>
      </View>
      <View style={styles.amount}>
        <ThemedText type="smallBold" style={{ color }}>
          {income ? '+' : transfer ? '↔' : '−'} {formatMoney(transaction.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted">
          {transaction.time}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

const styles = StyleSheet.create({
  page: { alignSelf: 'center', flex: 1, maxWidth: MaxContentWidth, width: '100%' },
  safeArea: { flex: 1 },
  content: {
    paddingBottom: BottomTabInset + 24,
    paddingHorizontal: Layout.pagePadding,
    paddingTop: 24,
  },
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: 20 },
  back: { fontSize: 26, lineHeight: 30, padding: 6 },
  headerCopy: { flex: 1, marginLeft: 14 },
  eyebrow: { ...Typography.eyebrow },
  title: { fontSize: 29, lineHeight: 32 },
  sectionHeader: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  transaction: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingVertical: 12,
  },
  icon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  copy: { flex: 1, minWidth: 0 },
  amount: { alignItems: 'flex-end', marginLeft: Spacing.two },
  footer: { alignItems: 'center', padding: 22 },
  filterBar: {
    alignItems: 'center',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    paddingBottom: 12,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  chip: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 4, padding: 21 },
  filterOption: { borderTopWidth: 1, borderTopColor: '#E3E4DD', paddingVertical: 15 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 58 },
  emptyGlyph: { fontSize: 38 },
});
