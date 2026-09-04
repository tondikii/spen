import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/category-icon';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { CurrencyMark } from '@/components/currency-mark';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SectionHeader } from '@/components/ui-primitives';
import {
  BottomTabInset,
  Fonts,
  Layout,
  MaxContentWidth,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/lib/money';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import {
  addMockWallet,
  getHomeRecentTransactions,
  getHomeSnapshot,
  getHomeWallets,
  getTransactionPresentation,
  getWalletTotal,
  restoreMockWallet,
  updateMockWallet,
} from '@/services/home-service';
import type {
  BudgetPeriod,
  Category,
  MockBudgetSnapshot,
  Transaction,
  Wallet,
  WalletTint,
} from '@/types/domain';

const tintSequence: WalletTint[] = ['pine', 'coral', 'gold', 'goal'];

function walletGlyph(wallet: Wallet) {
  if (wallet.tint === 'coral') return 'T';
  if (wallet.tint === 'pine') return 'B';
  if (wallet.tint === 'gold') return 'G';
  return 'D';
}

function walletTintColor(wallet: Wallet, theme: ReturnType<typeof useTheme>) {
  return {
    pine: theme.walletPine,
    coral: theme.walletCoral,
    gold: theme.walletGold,
    goal: theme.walletGoal,
  }[wallet.tint];
}

function HomeHeader({ today = new Date() }: { today?: Date }) {
  const label = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(today)
    .toUpperCase();
  return (
    <View style={styles.header}>
      <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
        {label}
      </ThemedText>
    </View>
  );
}

function BalanceCard({ total, period }: { total: number; period?: BudgetPeriod }) {
  const { t } = useTranslation();
  return (
    <FinanceHeroCard
      label={t('common.totalBalance')}
      marker="●"
      amount={total}
      footer={[
        {
          label: 'Budget period',
          value: period ? formatPeriod(period) : 'Budget period',
        },
      ]}
      style={styles.balanceCard}
    />
  );
}

function WalletCards({
  wallets,
  archivedWallets,
  onSelect,
  onAdd,
  onRestore,
}: {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  onSelect: (wallet: Wallet) => void;
  onAdd: () => void;
  onRestore: (wallet: Wallet) => void;
}) {
  const theme = useTheme();
  const [archivedOpen, setArchivedOpen] = useState(false);
  return (
    <View style={styles.walletSection}>
      <SectionHeader title="Wallet" action="Tambah Wallet" onPress={onAdd} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletRow}
      >
        {wallets.map((wallet) => (
          <Pressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={`Buka Wallet ${wallet.name}`}
            onPress={() => onSelect(wallet)}
            style={({ pressed }) => [
              styles.walletCard,
              {
                backgroundColor: theme.card,
                borderColor: walletTintColor(wallet, theme),
              },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText
              style={[styles.walletGlyph, { backgroundColor: theme.mint, color: theme.pine }]}
            >
              {walletGlyph(wallet)}
            </ThemedText>
            <ThemedText style={styles.walletName}>{wallet.name}</ThemedText>
            <ThemedText style={styles.walletBalance}>{formatMoney(wallet.balance)}</ThemedText>
          </Pressable>
        ))}
        {wallets.length === 0 && (
          <View style={[styles.walletEmpty, { backgroundColor: theme.mint }]}>
            <ThemedText type="smallBold" themeColor="pine">
              Belum ada Wallet aktif
            </ThemedText>
            <ThemedText type="small" themeColor="muted">
              Tambahkan tempat uangmu disimpan.
            </ThemedText>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah Wallet"
          onPress={onAdd}
          style={({ pressed }) => [
            styles.walletAdd,
            { borderColor: theme.line },
            pressed && styles.pressed,
          ]}
        >
          <ThemedText
            type="subtitle"
            themeColor="pine"
            style={[styles.walletAddIcon, { backgroundColor: theme.mint }]}
          >
            ＋
          </ThemedText>
          <ThemedText type="small" themeColor="muted" style={styles.walletAddLabel}>
            Tambah Wallet
          </ThemedText>
        </Pressable>
        {/*
          <ThemedText type="subtitle" themeColor="pine" style={[styles.walletAddIcon, { backgroundColor: theme.mint }]}>＋</ThemedText>
          <ThemedText type="small" themeColor="muted" style={styles.walletAddLabel}>Tambah Wallet</ThemedText>
        */}
      </ScrollView>
      {archivedWallets.length > 0 && (
        <View
          style={[styles.archivedWallets, { backgroundColor: theme.card, borderColor: theme.line }]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={archivedOpen ? 'Tutup Wallet diarsipkan' : 'Buka Wallet diarsipkan'}
            accessibilityHint="Menampilkan Wallet yang tidak ada di daftar aktif"
            onPress={() => setArchivedOpen((open) => !open)}
            style={({ pressed }) => [styles.archivedHeader, pressed && styles.pressed]}
          >
            <ThemedText
              type="smallBold"
              themeColor="pine"
              style={[styles.archivedGlyph, { backgroundColor: theme.mint }]}
            >
              □
            </ThemedText>
            <View style={styles.archivedHeaderCopy}>
              <ThemedText type="smallBold">Wallet diarsipkan</ThemedText>
              <ThemedText type="small" themeColor="muted">
                {archivedWallets.length} Wallet tersimpan · tidak tampil di daftar aktif
              </ThemedText>
            </View>
            <ThemedText type="subtitle" themeColor="muted">
              {archivedOpen ? '⌃' : '⌄'}
            </ThemedText>
          </Pressable>
          {archivedOpen && (
            <View style={[styles.archivedList, { borderTopColor: theme.line }]}>
              {archivedWallets.map((wallet) => (
                <View
                  key={wallet.id}
                  style={[styles.archivedWalletRow, { borderBottomColor: theme.line }]}
                >
                  <ThemedText
                    type="smallBold"
                    themeColor="pine"
                    style={[styles.archivedWalletGlyph, { backgroundColor: theme.mint }]}
                  >
                    {walletGlyph(wallet)}
                  </ThemedText>
                  <View style={styles.archivedWalletCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {wallet.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="muted">
                      {formatMoney(wallet.balance)} · Terarsip
                    </ThemedText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Kembalikan Wallet ${wallet.name}`}
                    accessibilityHint="Wallet akan muncul kembali di daftar aktif"
                    onPress={() => onRestore(wallet)}
                    style={({ pressed }) => [
                      styles.restoreButton,
                      { borderColor: theme.pine },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText type="smallBold" themeColor="pine">
                      Kembalikan
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(progress, 100)}%`, backgroundColor: theme.pine },
        ]}
      />
    </View>
  );
}

function PlanSnapshot({
  onPress,
  snapshot: snapshotProp,
}: {
  onPress: () => void;
  snapshot?: MockBudgetSnapshot;
}) {
  const theme = useTheme();
  const snapshot = snapshotProp ?? getHomeSnapshot();
  const progress =
    snapshot.totalIncome > 0 ? (snapshot.totalExpense / snapshot.totalIncome) * 100 : 0;
  return (
    <ThemedView type="card" style={[styles.planSnapshot, { borderColor: theme.line }]}>
      <View>
        <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
          SPARE BUDGET
        </ThemedText>
        <ThemedText type="subtitle" style={styles.planAmount}>
          {formatMoney(snapshot.spareBudget)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.planCaption}>
          masih bisa dialokasikan
        </ThemedText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lihat Rencana"
        onPress={onPress}
        style={styles.planLink}
      >
        <ThemedText type="smallBold" themeColor="pine" style={styles.planLinkText}>
          Lihat Rencana →
        </ThemedText>
      </Pressable>
      <ProgressBar progress={progress} />
      <View style={styles.miniStats}>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>
          Pendapatan{' '}
          <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalIncome)}</ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>
          Terpakai{' '}
          <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalExpense)}</ThemedText>
        </ThemedText>
      </View>
    </ThemedView>
  );
}

function RecentTransaction({
  transaction,
  wallets,
  categories,
  onPress,
}: {
  transaction: Transaction;
  wallets: Wallet[];
  categories?: Category[];
  onPress?: () => void;
}) {
  const theme = useTheme();
  const presentation = getTransactionPresentation(transaction, categories, wallets);
  const typeColor =
    transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'gold';
  const iconBackground =
    transaction.type === 'income'
      ? theme.incomeBackground
      : transaction.type === 'expense'
        ? theme.expenseBackground
        : theme.transferBackground;
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '↔';
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Edit transaksi ${presentation.categoryName}` : undefined}
      onPress={onPress}
      style={[styles.transactionRow, { borderBottomColor: theme.line }]}
    >
      <ThemedView style={[styles.categoryIcon, { backgroundColor: iconBackground }]}>
        <CategoryIcon name={presentation.categoryIcon} color={theme[typeColor]} />
      </ThemedView>
      <View style={styles.transactionDescription}>
        <ThemedText type="smallBold" style={styles.transactionName}>
          {presentation.categoryName}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor="muted"
          style={styles.transactionDetail}
          numberOfLines={1}
        >
          {presentation.walletName} · {transaction.note}
        </ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText type="smallBold" themeColor={typeColor} style={styles.transactionAmountText}>
          {sign} {formatMoney(transaction.amount)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.transactionTime}>
          {transaction.time}
        </ThemedText>
      </View>
    </Pressable>
  );
}

type WalletFormProps =
  | {
      mode: 'create';
      onClose: () => void;
      onSave: (name: string, balance: number) => void;
    }
  | {
      mode: 'edit';
      wallet: Wallet;
      onClose: () => void;
      onSave: (name: string, balance: number) => void;
      onArchive: () => void;
    };

function WalletForm(props: WalletFormProps) {
  const theme = useTheme();
  const wallet = props.mode === 'edit' ? props.wallet : undefined;
  const [name, setName] = useState(wallet?.name ?? '');
  const [amount, setAmount] = useState(wallet ? formatMoneyInput(wallet.balance) : '');
  return (
    <Modal animationType="slide" visible onRequestClose={props.onClose}>
      <ThemedView style={styles.formPage}>
        <View style={[styles.formHeader, { borderBottomColor: theme.line }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup form Wallet"
            onPress={props.onClose}
            style={styles.headerButton}
          >
            <ThemedText type="subtitle" themeColor="pine">
              ×
            </ThemedText>
          </Pressable>
          <ThemedText type="sectionHeading">
            {props.mode === 'edit' ? 'Edit Wallet' : 'Wallet baru'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Simpan Wallet"
            onPress={() => props.onSave(name.trim() || 'Wallet baru', parseMoneyInput(amount))}
            style={styles.headerButton}
          >
            <ThemedText type="smallBold" themeColor="pine">
              Simpan
            </ThemedText>
          </Pressable>
        </View>
        <KeyboardAvoidingView
          style={styles.formBody}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <ThemedText type="small" themeColor="muted" style={styles.formNote}>
              Wallet adalah tempat uangmu disimpan.
            </ThemedText>
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>
              NAMA WALLET
            </ThemedText>
            <ThemedInput
              accessibilityLabel="Nama Wallet"
              placeholder="Mis. Jago, Tunai, GoPay"
              value={name}
              onChangeText={setName}
            />
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>
              {props.mode === 'edit' ? 'SALDO SAAT INI' : 'SALDO AWAL'}
            </ThemedText>
            <View style={styles.moneyInputRow}>
              <CurrencyMark />
              <ThemedInput
                accessibilityLabel={props.mode === 'edit' ? 'Saldo Wallet' : 'Saldo awal'}
                keyboardType="numeric"
                placeholder="0"
                value={amount}
                onChangeText={(value) => setAmount(formatMoneyInput(value))}
                style={styles.moneyInput}
              />
            </View>
            {props.mode === 'edit' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Arsipkan Wallet"
                onPress={props.onArchive}
                style={[styles.archiveAction, { borderTopColor: theme.line }]}
              >
                <ThemedText
                  style={[
                    styles.archiveIcon,
                    {
                      backgroundColor: theme.dangerBackground,
                      color: theme.expense,
                    },
                  ]}
                >
                  □
                </ThemedText>
                <View style={styles.archiveCopy}>
                  <ThemedText type="smallBold" style={{ color: theme.expense }}>
                    Arsipkan Wallet
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    Transaksi tetap tersimpan
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" themeColor="muted">
                  ›
                </ThemedText>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

type HomeScreenProps = {
  onTransactionPress?: (transaction: Transaction) => void;
  onDailyPress?: () => void;
  onPlanPress?: () => void;
  wallets?: Wallet[];
  archivedWallets?: Wallet[];
  transactions?: Transaction[];
  categories?: Category[];
  snapshot?: MockBudgetSnapshot;
  period?: BudgetPeriod;
  onWalletSave?: (wallet: Wallet | null, name: string, balance: number) => void | Promise<void>;
  onWalletArchive?: (wallet: Wallet) => void | Promise<void>;
  onWalletRestore?: (wallet: Wallet) => void | Promise<void>;
};

export default function HomeScreen({
  onTransactionPress,
  onDailyPress,
  onPlanPress,
  wallets: walletsProp,
  archivedWallets: archivedWalletsProp,
  transactions: transactionsProp,
  categories: categoriesProp,
  snapshot,
  period,
  onWalletSave,
  onWalletArchive,
  onWalletRestore,
}: HomeScreenProps = {}) {
  const theme = useTheme();
  const [wallets, setWallets] = useState<Wallet[]>(walletsProp ?? getHomeWallets);
  const [archivedWallets, setArchivedWallets] = useState<Wallet[]>(archivedWalletsProp ?? []);
  const [formWallet, setFormWallet] = useState<Wallet | 'new' | null>(null);
  const [walletToArchive, setWalletToArchive] = useState<Wallet | null>(null);
  const recentTransactions = useMemo(
    () => transactionsProp ?? getHomeRecentTransactions(),
    [transactionsProp],
  );
  const total = useMemo(() => getWalletTotal(wallets), [wallets]);

  const saveWallet = async (name: string, balance: number) => {
    if (onWalletSave) {
      await onWalletSave(formWallet && formWallet !== 'new' ? formWallet : null, name, balance);
      setFormWallet(null);
      return;
    }
    if (formWallet && formWallet !== 'new') {
      setWallets((current) => updateMockWallet(current, formWallet.id, name, balance));
    } else {
      const tint = tintSequence[wallets.length % tintSequence.length];
      setWallets((current) => addMockWallet(current, name, balance ?? 0, tint));
    }
    setFormWallet(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HomeHeader />
          <BalanceCard total={total} period={period} />
          <WalletCards
            wallets={wallets}
            archivedWallets={archivedWallets}
            onSelect={(wallet) => setFormWallet(wallet)}
            onAdd={() => setFormWallet('new')}
            onRestore={(wallet) => {
              if (onWalletRestore) void onWalletRestore(wallet);
              else {
                setArchivedWallets((current) => current.filter((item) => item.id !== wallet.id));
                setWallets((current) => restoreMockWallet([...current, wallet], wallet.id));
              }
            }}
          />
          <PlanSnapshot snapshot={snapshot} onPress={onPlanPress ?? (() => undefined)} />
          <View style={styles.recent}>
            <View style={styles.sectionTitle}>
              <ThemedText type="sectionHeading">Terbaru</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Lihat Semua Transaksi"
                onPress={onDailyPress ?? (() => undefined)}
              >
                <ThemedText type="smallBold" themeColor="pine">
                  Lihat Semua
                </ThemedText>
              </Pressable>
            </View>
            {recentTransactions.length === 0 ? (
              <View style={styles.empty}>
                <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
                <ThemedText type="smallBold">Belum ada catatan</ThemedText>
                <ThemedText type="small" themeColor="muted">
                  Tambahkan transaksi pertama untuk melihat ringkasanmu.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tambah transaksi"
                  onPress={onDailyPress}
                  style={[styles.emptyButton, { backgroundColor: theme.pine }]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                    Tambah transaksi
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              recentTransactions.map((transaction) => (
                <RecentTransaction
                  key={transaction.id}
                  transaction={transaction}
                  wallets={wallets}
                  categories={categoriesProp}
                  onPress={onTransactionPress ? () => onTransactionPress(transaction) : undefined}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      {formWallet === 'new' && (
        <WalletForm mode="create" onClose={() => setFormWallet(null)} onSave={saveWallet} />
      )}
      {formWallet && formWallet !== 'new' && (
        <WalletForm
          mode="edit"
          wallet={formWallet}
          onClose={() => setFormWallet(null)}
          onSave={saveWallet}
          onArchive={() => setWalletToArchive(formWallet)}
        />
      )}
      <ConfirmationModal
        visible={walletToArchive !== null}
        title="Arsipkan Wallet?"
        message={
          walletToArchive
            ? `${walletToArchive.name} tidak akan tampil di daftar Wallet aktif. Transaksi tetap tersimpan.`
            : ''
        }
        confirmLabel="Arsipkan"
        destructive
        onCancel={() => setWalletToArchive(null)}
        onConfirm={async () => {
          if (!walletToArchive) return;
          if (onWalletArchive) await onWalletArchive(walletToArchive);
          else {
            setWallets((current) => current.filter((item) => item.id !== walletToArchive.id));
            setArchivedWallets((current) => [...current, { ...walletToArchive, archived: true }]);
          }
          setWalletToArchive(null);
          setFormWallet(null);
        }}
      />
    </ThemedView>
  );
}

function formatPeriod(period: BudgetPeriod) {
  const start = new Date(`${period.startDate}T12:00:00`);
  const end = new Date(`${period.endDate}T12:00:00`);
  return `${start.getDate()} — ${end.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(end)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: 24,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eyebrow: { ...Typography.eyebrow },
  balanceCard: { marginBottom: Layout.sectionGap },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  walletSection: {},
  archivedWallets: {
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 2,
    overflow: 'hidden',
  },
  archivedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  archivedGlyph: {
    borderRadius: 10,
    fontFamily: Fonts.mono,
    fontSize: 12,
    height: 31,
    lineHeight: 31,
    textAlign: 'center',
    width: 31,
  },
  archivedHeaderCopy: { flex: 1, gap: 3 },
  archivedList: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  archivedWalletRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  archivedWalletGlyph: {
    borderRadius: 9,
    fontFamily: Fonts.serif,
    fontSize: 13,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    width: 28,
  },
  archivedWalletCopy: { flex: 1, gap: 3, minWidth: 0 },
  restoreButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  walletRow: { gap: Layout.walletGap, paddingTop: 2, paddingBottom: 20 },
  walletCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: Layout.walletHeight,
    justifyContent: 'space-between',
    padding: 12,
    width: Layout.walletWidth,
    ...Shadows.card,
  },
  walletEmpty: {
    borderRadius: 18,
    gap: Spacing.one,
    height: Layout.walletHeight,
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: Layout.walletWidth * 1.8,
  },
  walletGlyph: {
    borderRadius: 10,
    fontFamily: Fonts.serif,
    fontSize: 15,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    width: 28,
  },
  walletName: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 14 },
  walletBalance: {
    fontFamily: Fonts.mono,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: -0.63,
  },
  walletAdd: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: Layout.walletHeight,
    justifyContent: 'space-between',
    padding: 12,
    width: Layout.walletWidth,
  },
  walletAddIcon: {
    borderRadius: 10,
    fontSize: 21,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    width: 28,
  },
  walletAddLabel: { fontSize: 10, lineHeight: 12 },
  quietAction: { fontSize: 12, lineHeight: 15 },
  pressed: { opacity: 0.7 },
  planSnapshot: {
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Layout.sectionGap,
    padding: 17,
  },
  planLink: { position: 'absolute', right: Spacing.three, top: Spacing.three },
  planAmount: { fontSize: 25, lineHeight: 28 },
  planCaption: { fontSize: 11, lineHeight: 14 },
  planLinkText: { fontSize: 11, lineHeight: 14 },
  progressTrack: {
    borderRadius: Radius.pill,
    height: 5,
    marginVertical: Spacing.three,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: Radius.pill, height: '100%' },
  miniStats: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStatValue: { fontFamily: Fonts.mono, fontSize: 10 },
  miniStat: { fontSize: 10, lineHeight: 14 },
  recent: { paddingBottom: Spacing.two },
  transactionRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingHorizontal: 1,
    paddingVertical: 12,
  },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  transactionDescription: { flex: 1, minWidth: 0 },
  transactionAmount: { alignItems: 'flex-end' },
  formPage: { flex: 1 },
  formHeader: {
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
    minWidth: 56,
  },
  formBody: { flex: 1 },
  formContent: { gap: Spacing.two, paddingHorizontal: 21, paddingVertical: 24 },
  formNote: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.five },
  archiveAction: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.five,
    paddingHorizontal: 3,
    paddingTop: Spacing.four,
  },
  archiveIcon: {
    alignItems: 'center',
    borderRadius: Radius.small,
    fontFamily: Fonts.mono,
    fontSize: 18,
    height: 35,
    justifyContent: 'center',
    paddingTop: 4,
    textAlign: 'center',
    width: 35,
  },
  archiveCopy: { flex: 1 },
  formLabel: { ...Typography.eyebrow, marginTop: Spacing.two },
  moneyInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  moneyInput: { flex: 1 },
  transactionName: { fontSize: 12, lineHeight: 16 },
  transactionDetail: { fontSize: 10, lineHeight: 14, marginTop: Spacing.half },
  transactionAmountText: { fontSize: 12, lineHeight: 16 },
  transactionTime: { fontSize: 10, lineHeight: 14 },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 34 },
  emptyGlyph: { fontSize: 38 },
  emptyButton: {
    borderRadius: 15,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});
