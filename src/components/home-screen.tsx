import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Layout, MaxContentWidth, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Transaction, Wallet, WalletTint } from '@/types/domain';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/hooks/use-theme';
import { addMockWallet, archiveMockWallet, getHomeRecentTransactions, getHomeSnapshot, getHomeWallets, getTransactionPresentation, getWalletTotal, renameMockWallet } from '@/services/home-service';

const tintSequence: WalletTint[] = ['pine', 'coral', 'gold', 'goal'];

function walletGlyph(wallet: Wallet) {
  if (wallet.tint === 'coral') return 'T';
  if (wallet.tint === 'pine') return 'B';
  if (wallet.tint === 'gold') return 'G';
  return 'D';
}

function HomeHeader() {
  return (
    <View style={styles.header}>
      <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
        SELASA, 1 SEPTEMBER
      </ThemedText>
    </View>
  );
}

function BalanceCard({ total }: { total: number }) {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.balanceCard, { backgroundColor: theme.pine2 }]}>
      <ThemedText style={[styles.heroLabel, { color: theme.heroMuted }]}>Saldo total <ThemedText style={{ color: theme.heroMuted }}>●</ThemedText></ThemedText>
      <ThemedText style={[styles.heroAmount, { color: theme.heroText }]}>{formatMoney(total)}</ThemedText>
      <View style={[styles.balanceFooter, { borderTopColor: theme.heroDivider }]}>
        <ThemedText style={[styles.heroLabel, { color: theme.heroMuted }]}>Budget period</ThemedText>
        <ThemedText style={[styles.period, { color: theme.heroText }]}>1 — 30 Sep  ◫</ThemedText>
      </View>
    </ThemedView>
  );
}

function WalletCards({ wallets, onSelect, onAdd }: { wallets: Wallet[]; onSelect: (wallet: Wallet) => void; onAdd: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.walletSection}>
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">Wallet</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Tambah Wallet" onPress={onAdd}>
          <ThemedText type="smallBold" themeColor="pine" style={styles.quietAction}>Tambah</ThemedText>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
        {wallets.map((wallet) => (
          <Pressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={`Buka Wallet ${wallet.name}`}
            onPress={() => onSelect(wallet)}
            style={({ pressed }) => [styles.walletCard, { backgroundColor: theme.card, borderColor: theme.line }, pressed && styles.pressed]}>
            <ThemedText style={[styles.walletGlyph, { backgroundColor: theme.mint, color: theme.pine }]}>{walletGlyph(wallet)}</ThemedText>
            <ThemedText style={styles.walletName}>{wallet.name}</ThemedText>
            <ThemedText style={styles.walletBalance}>{formatMoney(wallet.balance)}</ThemedText>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Tambah Wallet" onPress={onAdd} style={[styles.walletAdd, { borderColor: theme.line }]}>
          <ThemedText type="subtitle" themeColor="pine" style={[styles.walletAddIcon, { backgroundColor: theme.mint }]}>＋</ThemedText>
          <ThemedText type="small" themeColor="muted" style={styles.walletAddLabel}>Tambah Wallet</ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
      <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: theme.pine }]} />
    </View>
  );
}

function PlanSnapshot({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const snapshot = getHomeSnapshot();
  const progress = (snapshot.totalExpense / snapshot.totalIncome) * 100;
  return (
    <ThemedView type="card" style={[styles.planSnapshot, { borderColor: theme.line }]}>
      <View>
        <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>SPARE BUDGET</ThemedText>
        <ThemedText type="subtitle" style={styles.planAmount}>{formatMoney(snapshot.spareBudget)}</ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.planCaption}>masih bisa dialokasikan</ThemedText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Lihat Rencana" onPress={onPress} style={styles.planLink}>
        <ThemedText type="smallBold" themeColor="pine" style={styles.planLinkText}>Lihat Rencana  →</ThemedText>
      </Pressable>
      <ProgressBar progress={progress} />
      <View style={styles.miniStats}>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>Pendapatan <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalIncome)}</ThemedText></ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>Terpakai <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalExpense)}</ThemedText></ThemedText>
      </View>
    </ThemedView>
  );
}

function RecentTransaction({ transaction }: { transaction: Transaction }) {
  const theme = useTheme();
  const presentation = getTransactionPresentation(transaction);
  const typeColor = transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'gold';
  const iconBackground = transaction.type === 'income' ? theme.incomeBackground : transaction.type === 'expense' ? theme.expenseBackground : theme.transferBackground;
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '↔';
  return (
    <View style={[styles.transactionRow, { borderBottomColor: theme.line }]}>
      <ThemedView style={[styles.categoryIcon, { backgroundColor: iconBackground }]}>
        <ThemedText themeColor={typeColor}>{presentation.categoryIcon}</ThemedText>
      </ThemedView>
      <View style={styles.transactionDescription}>
        <ThemedText type="smallBold" style={styles.transactionName}>{presentation.categoryName}</ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.transactionDetail} numberOfLines={1}>{presentation.walletName} · {transaction.note}</ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText type="smallBold" themeColor={typeColor} style={styles.transactionAmountText}>{sign} {formatMoney(transaction.amount)}</ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.transactionTime}>{transaction.time}</ThemedText>
      </View>
    </View>
  );
}

type WalletFormProps =
  | { mode: 'create'; onClose: () => void; onSave: (name: string, balance: number) => void }
  | { mode: 'edit'; wallet: Wallet; onClose: () => void; onSave: (name: string) => void; onArchive: () => void };

function WalletForm(props: WalletFormProps) {
  const theme = useTheme();
  const wallet = props.mode === 'edit' ? props.wallet : undefined;
  const [name, setName] = useState(wallet?.name ?? '');
  const [amount, setAmount] = useState('');
  return (
    <Modal animationType="slide" visible onRequestClose={props.onClose}>
      <ThemedView style={styles.formPage}>
        <View style={[styles.formHeader, { borderBottomColor: theme.line }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tutup form Wallet" onPress={props.onClose} style={styles.headerButton}><ThemedText type="subtitle" themeColor="pine">×</ThemedText></Pressable>
          <ThemedText type="sectionHeading">{props.mode === 'edit' ? 'Edit Wallet' : 'Wallet baru'}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Simpan Wallet" onPress={() => props.mode === 'edit' ? props.onSave(name.trim() || 'Wallet baru') : props.onSave(name.trim() || 'Wallet baru', Number(amount) || 0)} style={styles.headerButton}><ThemedText type="smallBold" themeColor="pine">Simpan</ThemedText></Pressable>
        </View>
        <View style={styles.formContent}>
          <ThemedText type="small" themeColor="muted" style={styles.formNote}>Wallet adalah tempat uangmu disimpan.</ThemedText>
          <ThemedText type="code" themeColor="muted" style={styles.formLabel}>NAMA WALLET</ThemedText>
          <TextInput accessibilityLabel="Nama Wallet" placeholder="Mis. Jago, Tunai, GoPay" placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.input, { borderBottomColor: theme.line, color: theme.ink, backgroundColor: theme.card }]} />
          {props.mode === 'create' && <>
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>SALDO AWAL</ThemedText>
            <TextInput accessibilityLabel="Saldo awal" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={amount} onChangeText={setAmount} style={[styles.input, { borderBottomColor: theme.line, color: theme.ink, backgroundColor: theme.card }]} />
          </>}
          {props.mode === 'edit' && <Pressable accessibilityRole="button" accessibilityLabel="Arsipkan Wallet" onPress={props.onArchive} style={[styles.archiveButton, { borderColor: theme.expense }]}><ThemedText type="smallBold" style={{ color: theme.expense }}>Arsipkan Wallet</ThemedText><ThemedText type="small" themeColor="muted">Transaksi tetap tersimpan</ThemedText></Pressable>}
        </View>
      </ThemedView>
    </Modal>
  );
}

export default function HomeScreen() {
  const [wallets, setWallets] = useState<Wallet[]>(getHomeWallets);
  const [formWallet, setFormWallet] = useState<Wallet | 'new' | null>(null);
  const recentTransactions = useMemo(getHomeRecentTransactions, []);
  const total = getWalletTotal(wallets);

  const saveWallet = (name: string, balance?: number) => {
    if (formWallet && formWallet !== 'new') {
      setWallets((current) => renameMockWallet(current, formWallet.id, name));
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
          <BalanceCard total={total} />
          <WalletCards wallets={wallets} onSelect={(wallet) => setFormWallet(wallet)} onAdd={() => setFormWallet('new')} />
          <PlanSnapshot onPress={() => undefined} />
          <View style={styles.recent}>
            <View style={styles.sectionTitle}><ThemedText type="sectionHeading">Terbaru</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Lihat Semua Transaksi" onPress={() => Alert.alert('Transaksi', 'View transaksi harian akan tersedia di layar Riwayat.')}><ThemedText type="smallBold" themeColor="pine">Lihat Semua</ThemedText></Pressable></View>
            {recentTransactions.map((transaction) => <RecentTransaction key={transaction.id} transaction={transaction} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
      {formWallet === 'new' && <WalletForm mode="create" onClose={() => setFormWallet(null)} onSave={saveWallet} />}
      {formWallet && formWallet !== 'new' && <WalletForm mode="edit" wallet={formWallet} onClose={() => setFormWallet(null)} onSave={saveWallet} onArchive={() => { setWallets((current) => archiveMockWallet(current, formWallet.id)); setFormWallet(null); }} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  content: { paddingHorizontal: Layout.pagePadding, paddingTop: 28, paddingBottom: BottomTabInset + Spacing.four, gap: 0 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  eyebrow: { ...Typography.eyebrow },
  balanceCard: { borderRadius: Radius.hero, marginBottom: Layout.sectionGap, padding: 21, ...Shadows.hero },
  heroLabel: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  heroAmount: { ...Typography.moneyHero, marginVertical: Spacing.three },
  balanceFooter: { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.two },
  period: { fontFamily: Fonts.monoMedium, fontSize: 11 },
  sectionTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  walletSection: {},
  walletRow: { gap: Layout.walletGap, paddingTop: 2, paddingBottom: 18 },
  walletCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, height: Layout.walletHeight, justifyContent: 'space-between', padding: 12, width: Layout.walletWidth, ...Shadows.card },
  walletGlyph: { borderRadius: 10, fontFamily: Fonts.serif, fontSize: 15, height: 28, lineHeight: 28, textAlign: 'center', width: 28 },
  walletName: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 14 },
  walletBalance: { fontFamily: Fonts.mono, fontSize: 10.5, lineHeight: 14, letterSpacing: -0.63 },
  walletAdd: { alignItems: 'flex-start', borderRadius: 18, borderStyle: 'dashed', borderWidth: StyleSheet.hairlineWidth, height: Layout.walletHeight, justifyContent: 'space-between', padding: 12, width: Layout.walletWidth },
  walletAddIcon: { borderRadius: 10, fontSize: 21, height: 28, lineHeight: 28, textAlign: 'center', width: 28 },
  walletAddLabel: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
  quietAction: { fontSize: 12, lineHeight: 15 },
  pressed: { opacity: 0.7 },
  planSnapshot: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, marginBottom: Layout.sectionGap, padding: 17 },
  planLink: { position: 'absolute', right: Spacing.three, top: Spacing.three },
  planAmount: { fontSize: 25, lineHeight: 28 },
  planCaption: { fontSize: 11, lineHeight: 14 },
  planLinkText: { fontSize: 11, lineHeight: 14 },
  progressTrack: { borderRadius: Radius.pill, height: 5, marginVertical: Spacing.three, overflow: 'hidden' },
  progressFill: { borderRadius: Radius.pill, height: '100%' },
  miniStats: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStatValue: { fontFamily: Fonts.mono, fontSize: 10 },
  miniStat: { fontSize: 10, lineHeight: 14 },
  recent: { paddingBottom: Spacing.two },
  transactionRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 11, paddingHorizontal: 1, paddingVertical: 12 },
  categoryIcon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  transactionDescription: { flex: 1, minWidth: 0 },
  transactionAmount: { alignItems: 'flex-end' },
  formPage: { flex: 1 },
  formHeader: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 65, justifyContent: 'space-between', paddingHorizontal: 20 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', minWidth: 56 },
  formContent: { gap: Spacing.two, paddingHorizontal: 21, paddingVertical: 24 },
  formNote: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.five },
  archiveButton: { borderRadius: Radius.small, borderWidth: 1, gap: 3, marginTop: Spacing.five, padding: 13 },
  formLabel: { ...Typography.eyebrow, marginTop: Spacing.two },
  input: { borderBottomWidth: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 52, paddingHorizontal: 0 },
  transactionName: { fontSize: 12, lineHeight: 16 },
  transactionDetail: { fontSize: 10, lineHeight: 14, marginTop: Spacing.half },
  transactionAmountText: { fontSize: 12, lineHeight: 16 },
  transactionTime: { fontSize: 10, lineHeight: 14 },
});
