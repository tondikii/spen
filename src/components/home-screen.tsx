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
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Transaction, Wallet, WalletTint } from '@/types/domain';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/hooks/use-theme';
import { addMockWallet, archiveMockWallet, getHomeRecentTransactions, getHomeSnapshot, getHomeWallets, getTransactionPresentation, getWalletTotal, renameMockWallet } from '@/services/home-service';

const tintColors: Record<WalletTint, keyof ReturnType<typeof useTheme>> = {
  pine: 'walletPine',
  coral: 'walletCoral',
  gold: 'walletGold',
  goal: 'walletGoal',
};

const tintSequence: WalletTint[] = ['pine', 'coral', 'gold', 'goal'];

function HomeHeader() {
  return (
    <View style={styles.header}>
      <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
        SELASA, 1 SEPTEMBER
      </ThemedText>
      <ThemedText type="small" themeColor="muted" style={styles.headerPeriod}>1 — 30 Sep  ◫</ThemedText>
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
    <View>
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">Wallet</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Tambah Wallet" onPress={onAdd}>
          <ThemedText type="smallBold" themeColor="pine">Tambah</ThemedText>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
        {wallets.map((wallet) => (
          <Pressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={`Buka Wallet ${wallet.name}`}
            onPress={() => onSelect(wallet)}
            style={({ pressed }) => [styles.walletCard, { borderColor: theme[tintColors[wallet.tint]] }, pressed && styles.pressed]}>
            <ThemedText style={styles.walletName}>{wallet.name}</ThemedText>
            <ThemedText themeColor="muted" style={styles.walletBalance}>{formatMoney(wallet.balance)}</ThemedText>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Tambah Wallet" onPress={onAdd} style={[styles.walletAdd, { borderColor: theme.line }]}>
          <ThemedText type="subtitle" themeColor="pine">＋</ThemedText>
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
        <ThemedText type="subtitle">{formatMoney(snapshot.spareBudget)}</ThemedText>
        <ThemedText type="small" themeColor="muted">masih bisa dialokasikan</ThemedText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Lihat Rencana" onPress={onPress} style={styles.planLink}>
        <ThemedText type="smallBold" themeColor="pine">Lihat Rencana  →</ThemedText>
      </Pressable>
      <ProgressBar progress={progress} />
      <View style={styles.miniStats}>
        <ThemedText type="small" themeColor="muted">Pendapatan <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalIncome)}</ThemedText></ThemedText>
        <ThemedText type="small" themeColor="muted">Terpakai <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalExpense)}</ThemedText></ThemedText>
      </View>
    </ThemedView>
  );
}

function RecentTransaction({ transaction }: { transaction: Transaction }) {
  const theme = useTheme();
  const presentation = getTransactionPresentation(transaction);
  const typeColor = transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'gold';
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : '↔';
  return (
    <View style={styles.transactionRow}>
      <ThemedView style={[styles.categoryIcon, { backgroundColor: theme.mint }]}>
        <ThemedText themeColor={typeColor}>{presentation.categoryIcon}</ThemedText>
      </ThemedView>
      <View style={styles.transactionDescription}>
        <ThemedText type="smallBold">{presentation.categoryName}</ThemedText>
        <ThemedText type="small" themeColor="muted" numberOfLines={1}>{presentation.walletName} · {transaction.note}</ThemedText>
      </View>
      <View style={styles.transactionAmount}>
        <ThemedText type="smallBold" themeColor={typeColor}>{sign} {formatMoney(transaction.amount)}</ThemedText>
        <ThemedText type="small" themeColor="muted">{transaction.time}</ThemedText>
      </View>
    </View>
  );
}

function WalletSheet({ wallet, onClose, onCorrection, onEdit, onArchive }: { wallet: Wallet; onClose: () => void; onCorrection: () => void; onEdit: () => void; onArchive: () => void }) {
  const theme = useTheme();
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Tutup detail Wallet" onPress={onClose} style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <Pressable onPress={(event) => event.stopPropagation()} style={[styles.sheet, { backgroundColor: theme.card }]}>
          <View style={[styles.grabber, { backgroundColor: theme.line }]} />
          <View style={styles.walletSummary}>
            <View style={[styles.walletAvatar, { backgroundColor: theme[tintColors[wallet.tint]] }]}><ThemedText type="subtitle">{wallet.name[0]}</ThemedText></View>
            <ThemedText type="small" themeColor="muted">{wallet.name}</ThemedText>
            <ThemedText type="title" style={styles.sheetAmount}>{formatMoney(wallet.balance)}</ThemedText>
          </View>
          <View style={styles.sheetActions}>
            <SheetAction icon="±" title="Koreksi saldo" detail="Buat transaksi penyesuaian" onPress={onCorrection} />
            <SheetAction icon="⌕" title="Edit Wallet" detail="Ubah nama Wallet" onPress={onEdit} />
            <SheetAction icon="□" title="Arsipkan Wallet" detail="Transaksi tetap tersimpan" danger onPress={onArchive} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetAction({ icon, title, detail, onPress, danger = false }: { icon: string; title: string; detail: string; onPress: () => void; danger?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.sheetAction}>
      <ThemedText style={[styles.actionIcon, { backgroundColor: danger ? `${theme.expense}22` : theme.mint, color: danger ? theme.expense : theme.pine }]}>{icon}</ThemedText>
      <View style={styles.actionCopy}><ThemedText type="smallBold" style={danger && { color: theme.expense }}>{title}</ThemedText><ThemedText type="small" themeColor="muted">{detail}</ThemedText></View>
      <ThemedText type="subtitle" themeColor="muted">›</ThemedText>
    </Pressable>
  );
}

function WalletForm({ wallet, onClose, onSave }: { wallet?: Wallet; onClose: () => void; onSave: (name: string, balance?: number) => void }) {
  const theme = useTheme();
  const [name, setName] = useState(wallet?.name ?? '');
  const [amount, setAmount] = useState(wallet ? String(wallet.initialBalance) : '');
  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <ThemedView style={styles.formPage}>
        <View style={[styles.formHeader, { borderBottomColor: theme.line }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tutup form Wallet" onPress={onClose} style={styles.headerButton}><ThemedText type="subtitle" themeColor="pine">×</ThemedText></Pressable>
          <ThemedText type="sectionHeading">{wallet ? 'Edit Wallet' : 'Wallet baru'}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Simpan Wallet" onPress={() => onSave(name.trim() || 'Wallet baru', wallet ? undefined : Number(amount) || 0)} style={styles.headerButton}><ThemedText type="smallBold" themeColor="pine">Simpan</ThemedText></Pressable>
        </View>
        <View style={styles.formContent}>
          <ThemedText type="small" themeColor="muted" style={styles.formNote}>Wallet adalah tempat uangmu disimpan.</ThemedText>
          <ThemedText type="code" themeColor="muted" style={styles.formLabel}>NAMA WALLET</ThemedText>
          <TextInput accessibilityLabel="Nama Wallet" placeholder="Mis. Jago, Tunai, GoPay" placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.input, { borderBottomColor: theme.line, color: theme.ink, backgroundColor: theme.card }]} />
          {!wallet && <>
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>SALDO AWAL</ThemedText>
            <TextInput accessibilityLabel="Saldo awal" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={amount} onChangeText={setAmount} style={[styles.input, { borderBottomColor: theme.line, color: theme.ink, backgroundColor: theme.card }]} />
          </>}
        </View>
      </ThemedView>
    </Modal>
  );
}

export default function HomeScreen() {
  const [wallets, setWallets] = useState<Wallet[]>(getHomeWallets);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
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
    setSelectedWallet(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <HomeHeader />
          <BalanceCard total={total} />
          <WalletCards wallets={wallets} onSelect={setSelectedWallet} onAdd={() => setFormWallet('new')} />
          <PlanSnapshot onPress={() => undefined} />
          <View style={styles.recent}>
            <View style={styles.sectionTitle}><ThemedText type="sectionHeading">Terbaru</ThemedText><Pressable accessibilityRole="button" accessibilityLabel="Lihat Semua Transaksi" onPress={() => Alert.alert('Transaksi', 'View transaksi harian akan tersedia di layar Riwayat.')}><ThemedText type="smallBold" themeColor="pine">Lihat Semua</ThemedText></Pressable></View>
            {recentTransactions.map((transaction) => <RecentTransaction key={transaction.id} transaction={transaction} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
      {selectedWallet && <WalletSheet wallet={selectedWallet} onClose={() => setSelectedWallet(null)} onCorrection={() => Alert.alert('Koreksi saldo', 'Aksi ini akan membuat transaksi penyesuaian.')} onEdit={() => { setFormWallet(selectedWallet); setSelectedWallet(null); }} onArchive={() => { setWallets((current) => archiveMockWallet(current, selectedWallet.id)); setSelectedWallet(null); }} />}
      {formWallet && <WalletForm wallet={formWallet === 'new' ? undefined : formWallet} onClose={() => setFormWallet(null)} onSave={saveWallet} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: MaxContentWidth },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.four },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: -Spacing.two },
  headerPeriod: { fontFamily: Fonts.monoMedium, fontSize: 11 },
  eyebrow: { ...Typography.eyebrow },
  balanceCard: { borderRadius: Radius.hero, padding: Spacing.three, ...Shadows.hero },
  heroLabel: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  heroAmount: { ...Typography.moneyHero, marginVertical: Spacing.three },
  balanceFooter: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.two },
  period: { fontFamily: Fonts.monoMedium, fontSize: 11 },
  sectionTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  walletRow: { gap: Spacing.two, paddingBottom: Spacing.one },
  walletCard: { borderRadius: Radius.medium, borderWidth: 1, height: 107, justifyContent: 'space-between', padding: 13, width: 119, ...Shadows.card },
  walletName: { fontFamily: Fonts.sansSemiBold, fontSize: 12 },
  walletBalance: { ...Typography.money },
  walletAdd: { alignItems: 'center', borderRadius: Radius.medium, borderStyle: 'dashed', borderWidth: 1, height: 107, justifyContent: 'center', width: 105 },
  walletAddLabel: { fontSize: 10, marginTop: Spacing.one },
  pressed: { opacity: 0.7 },
  planSnapshot: { borderRadius: Radius.large, borderWidth: 1, padding: Spacing.three, ...Shadows.card },
  planLink: { position: 'absolute', right: Spacing.three, top: Spacing.three },
  progressTrack: { borderRadius: Radius.pill, height: 5, marginVertical: Spacing.three, overflow: 'hidden' },
  progressFill: { borderRadius: Radius.pill, height: '100%' },
  miniStats: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStatValue: { fontFamily: Fonts.mono, fontSize: 10 },
  recent: { paddingBottom: Spacing.two },
  transactionRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: Spacing.two, paddingVertical: 12 },
  categoryIcon: { alignItems: 'center', borderRadius: 12, height: 35, justifyContent: 'center', width: 35 },
  transactionDescription: { flex: 1, minWidth: 0 },
  transactionAmount: { alignItems: 'flex-end' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, padding: Spacing.four, paddingBottom: Spacing.five },
  grabber: { alignSelf: 'center', borderRadius: Radius.pill, height: 4, marginBottom: Spacing.four, width: 40 },
  walletSummary: { alignItems: 'center', gap: Spacing.two, paddingBottom: Spacing.four },
  walletAvatar: { alignItems: 'center', borderRadius: Radius.medium, height: 48, justifyContent: 'center', width: 48 },
  sheetAmount: { marginTop: Spacing.one },
  sheetActions: { gap: Spacing.one },
  sheetAction: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, paddingVertical: 12 },
  actionIcon: { alignItems: 'center', borderRadius: Radius.small, fontFamily: Fonts.mono, fontSize: 18, height: 35, justifyContent: 'center', paddingTop: 4, textAlign: 'center', width: 35 },
  actionCopy: { flex: 1 },
  formPage: { flex: 1 },
  formHeader: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.two },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', minWidth: 56 },
  formContent: { gap: Spacing.two, padding: Spacing.four },
  formNote: { marginBottom: Spacing.five },
  formLabel: { ...Typography.eyebrow, marginTop: Spacing.two },
  input: { borderBottomWidth: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 52, paddingHorizontal: Spacing.two },
});
