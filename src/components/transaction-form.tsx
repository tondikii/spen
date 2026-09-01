import { useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { formatMoney } from '@/lib/money';
import type { Category, Transaction, TransactionType, Wallet } from '@/types/domain';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { TRANSACTION_ICON_CHOICES, archiveMockCategory, getActiveTransactionCategories, getActiveTransactionWallets, getAllocationLimit, getTransactionCategories, saveMockCategory } from '@/services/transaction-service';

import type { TransactionDraft } from '@/types/domain';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  transaction?: Transaction;
  wallets?: Wallet[];
  onClose: () => void;
  onSave: (draft: TransactionDraft) => void;
  onDelete?: () => void;
};

const tabs: Array<{ type: TransactionType; label: string }> = [
  { type: 'income', label: 'Masuk' },
  { type: 'expense', label: 'Keluar' },
  { type: 'transfer', label: 'Transfer' },
];

export function TransactionForm({ mode, transaction, wallets = getActiveTransactionWallets(), onClose, onSave, onDelete }: TransactionFormProps) {
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const initialType: TransactionType = transaction?.type === 'adjustment' ? 'expense' : transaction?.type ?? 'income';
  const [type, setType] = useState<TransactionType>(initialType);
  const [walletId, setWalletId] = useState(transaction?.walletId ?? wallets[0]?.id ?? null);
  const [toWalletId, setToWalletId] = useState(transaction?.toWalletId ?? wallets[1]?.id ?? wallets[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? null);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [note, setNote] = useState(transaction?.note ?? '');
  const [categories, setCategories] = useState<Category[]>(getActiveTransactionCategories());
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState(TRANSACTION_ICON_CHOICES[0]);

  const selectedCategoryType = type === 'transfer' ? 'transfer' : type;
  const visibleCategories = useMemo(
    () => getTransactionCategories(categories, selectedCategoryType),
    [categories, selectedCategoryType],
  );
  const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const allocationLimit = getAllocationLimit(categoryId);
  const overBudget = type === 'expense' && allocationLimit > 0 && numericAmount > allocationLimit;

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'transfer') {
      setCategoryId(null);
    } else if (!categories.some((category) => category.id === categoryId && category.type === nextType)) {
      setCategoryId(null);
    }
  };

  const saveCategory = () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    const categoryType = type === 'income' ? 'income' : 'expense';
    const category: Category = {
      id: editingCategoryId ?? `category-${Date.now()}`,
      name: trimmedName,
      type: categoryType,
      icon: categoryIcon,
      archived: false,
      isAdjustment: false,
    };
    setCategories((current) => saveMockCategory(current, category));
    setCategoryId(category.id);
    setCategoryName('');
    setEditingCategoryId(null);
    setCategoryEditorOpen(false);
  };

  const editCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
  };

  const submit = () => {
    if (!walletId || !numericAmount || (type !== 'transfer' && !categoryId)) return;
    onSave({
      type,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : null,
      categoryId: type === 'transfer' ? 'category-transfer' : categoryId,
      amount: numericAmount,
      date: transaction?.date ?? '2026-09-02',
      time: transaction?.time ?? '12:00',
      note: note.trim(),
    });
  };

  return (
    <ThemedView style={styles.page}>
      <View style={[styles.header, { borderBottomColor: theme.line, paddingTop: Math.max(insets.top, Spacing.two) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup form transaksi" onPress={onClose} style={styles.headerButton}><ThemedText style={styles.close}>×</ThemedText></Pressable>
        <ThemedText type="sectionHeading">{mode === 'edit' ? 'Edit Transaksi' : 'Tambah Transaksi'}</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Transaksi'} onPress={submit} style={styles.headerButton}><ThemedText type="smallBold" themeColor="pine">{mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}</ThemedText></Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="muted" style={styles.note}>Catat setiap gerak uangmu dengan tenang.</ThemedText>
        <View style={[styles.typeTabs, { borderBottomColor: theme.line }]}>
          {tabs.map((tab) => (
            <Pressable key={tab.type} accessibilityRole="button" accessibilityLabel={`Tipe ${tab.label}`} onPress={() => changeType(tab.type)} style={[styles.typeTab, type === tab.type && { borderBottomColor: tab.type === 'income' ? theme.income : tab.type === 'expense' ? theme.expense : theme.pine }]}>
              <ThemedText type="smallBold" themeColor={type === tab.type ? tab.type === 'income' ? 'income' : tab.type === 'expense' ? 'expense' : 'pine' : 'muted'}>{tab.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {type === 'transfer' ? <>
          <FieldLabel>TRANSFER DARI</FieldLabel>
          <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
          <Pressable accessibilityRole="button" accessibilityLabel="Tukar Wallet Transfer" onPress={() => { setWalletId(toWalletId); setToWalletId(walletId); }} style={styles.swap}><ThemedText type="subtitle" themeColor="gold">↕</ThemedText></Pressable>
          <FieldLabel>TRANSFER KE</FieldLabel>
          <WalletPicker wallets={wallets} selected={toWalletId} onSelect={setToWalletId} exclude={walletId} />
        </> : <>
          <FieldLabel>WALLET</FieldLabel>
          <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
          <View style={styles.labelLine}><FieldLabel>{type === 'income' ? 'KATEGORI PENDAPATAN' : 'KATEGORI PENGELUARAN'}</FieldLabel><Pressable accessibilityRole="button" accessibilityLabel="Kelola kategori" onPress={() => setCategoryEditorOpen((open) => !open)}><ThemedText type="smallBold" themeColor="pine">Kelola</ThemedText></Pressable></View>
          <View style={styles.categoryGrid}>
            {visibleCategories.map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`Kategori ${category.name}`} onPress={() => setCategoryId(category.id)} style={[styles.category, { borderColor: category.id === categoryId ? theme.pine : theme.line, backgroundColor: category.id === categoryId ? theme.mint : theme.card }]}><ThemedText style={{ color: type === 'income' ? theme.income : theme.expense }}>{category.icon}</ThemedText><ThemedText type="small" style={styles.categoryName}>{category.name}</ThemedText></Pressable>)}
          </View>
          {categoryEditorOpen && <View style={[styles.categoryEditor, { borderColor: theme.line, backgroundColor: theme.card }]}>
            <ThemedText type="smallBold">{editingCategoryId ? 'Edit kategori' : 'Kelola kategori'}</ThemedText>
            <View style={styles.categoryManageList}>{visibleCategories.map((category) => <View key={category.id} style={styles.categoryManageRow}><ThemedText type="small" style={styles.categoryManageName}>{category.name}</ThemedText><Pressable accessibilityRole="button" accessibilityLabel={`Edit kategori ${category.name}`} onPress={() => editCategory(category)}><ThemedText type="smallBold" themeColor="pine">Edit</ThemedText></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Arsipkan kategori ${category.name}`} onPress={() => { setCategories((current) => archiveMockCategory(current, category.id)); if (categoryId === category.id) setCategoryId(null); }}><ThemedText type="smallBold" style={{ color: theme.expense }}>Arsipkan</ThemedText></Pressable></View>)}</View>
            <TextInput accessibilityLabel="Nama kategori baru" placeholder="Nama kategori" placeholderTextColor={theme.muted} value={categoryName} onChangeText={setCategoryName} style={[styles.editorInput, { borderBottomColor: theme.line, color: theme.ink }]} />
          <View style={styles.iconLibrary}>{Array.from({ length: Math.ceil(TRANSACTION_ICON_CHOICES.length / 5) }, (_, rowIndex) => <View key={`icon-row-${rowIndex}`} style={styles.iconRow}>{TRANSACTION_ICON_CHOICES.slice(rowIndex * 5, rowIndex * 5 + 5).map((icon) => <Pressable key={icon} accessibilityRole="button" accessibilityLabel={`Pilih ikon ${icon}`} onPress={() => setCategoryIcon(icon)} style={[styles.iconChoice, { borderColor: icon === categoryIcon ? theme.pine : theme.line, backgroundColor: icon === categoryIcon ? theme.mint : theme.background }]}><ThemedText>{icon}</ThemedText></Pressable>)}</View>)}</View>
            <Pressable accessibilityRole="button" accessibilityLabel="Simpan kategori" onPress={saveCategory}><ThemedText type="smallBold" themeColor="pine">{editingCategoryId ? 'Simpan perubahan' : 'Simpan kategori'}</ThemedText></Pressable>
          </View>}
        </>}

        <FieldLabel>NOMINAL</FieldLabel>
        <TextInput accessibilityLabel="Nominal transaksi" keyboardType="numeric" placeholder="0" placeholderTextColor={theme.muted} value={amount} onChangeText={setAmount} style={[styles.amountInput, { borderBottomColor: theme.line, color: theme.ink }]} />
        {overBudget && <View style={[styles.warning, { backgroundColor: theme.dangerBackground }]}><ThemedText type="small" style={{ color: theme.expense }}>Perlahan ya — ini akan melebihi alokasi, tetapi tetap bisa dicatat.</ThemedText></View>}
        <FieldLabel>CATATAN <ThemedText type="small" themeColor="muted">(opsional)</ThemedText></FieldLabel>
        <TextInput accessibilityLabel="Catatan transaksi" placeholder="Mis. makan siang" placeholderTextColor={theme.muted} value={note} onChangeText={setNote} style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }]} />
        {mode === 'edit' && <Pressable accessibilityRole="button" accessibilityLabel="Hapus Transaksi" onPress={() => Alert.alert('Hapus transaksi?', 'Transaksi ini akan dihapus dari catatan.', [{ text: 'Batal', style: 'cancel' }, { text: 'Hapus', style: 'destructive', onPress: onDelete }])} style={styles.deleteAction}><ThemedText type="smallBold" style={{ color: theme.expense }}>Hapus Transaksi</ThemedText></Pressable>}
      </ScrollView>
    </ThemedView>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>{children}</ThemedText>;
}

function WalletPicker({ wallets, selected, onSelect, exclude }: { wallets: Wallet[]; selected: string | null; onSelect: (id: string) => void; exclude?: string | null }) {
  const theme = useTheme();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletPicker}>{wallets.filter((wallet) => wallet.id !== exclude).map((wallet) => <Pressable key={wallet.id} accessibilityRole="button" accessibilityLabel={`Pilih Wallet ${wallet.name}`} onPress={() => onSelect(wallet.id)} style={[styles.walletChoice, { borderColor: wallet.id === selected ? theme.pine : theme.line, backgroundColor: wallet.id === selected ? theme.mint : theme.card }]}><ThemedText type="smallBold">{wallet.name}</ThemedText><ThemedText type="small" themeColor="muted">{formatMoney(wallet.balance)}</ThemedText></Pressable>)}</ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', height: 65, justifyContent: 'space-between', paddingHorizontal: 20 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', minWidth: 64 },
  close: { fontSize: 28, lineHeight: 32 },
  content: { gap: Spacing.two, paddingHorizontal: 21, paddingTop: 24, paddingBottom: 40 },
  note: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.three },
  typeTabs: { borderBottomWidth: 1, flexDirection: 'row', marginBottom: Spacing.four },
  typeTab: { alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', flex: 1, paddingVertical: 11 },
  fieldLabel: { ...Typography.eyebrow, marginTop: Spacing.two },
  walletPicker: { gap: Spacing.two, paddingVertical: Spacing.one },
  walletChoice: { borderRadius: 13, borderWidth: 1, gap: 2, minWidth: 120, padding: 11 },
  swap: { alignSelf: 'center', alignItems: 'center', borderRadius: Radius.pill, height: 34, justifyContent: 'center', width: 34 },
  labelLine: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  category: { alignItems: 'center', borderRadius: 13, borderWidth: 1, gap: 3, minWidth: '30%', padding: 9 },
  categoryName: { fontSize: 10, lineHeight: 13, textAlign: 'center' },
  categoryEditor: { borderRadius: 13, borderWidth: 1, gap: Spacing.two, padding: 11 },
  categoryManageList: { gap: Spacing.one },
  categoryManageRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, minHeight: 28 },
  categoryManageName: { flex: 1, fontSize: 11 },
  editorInput: { borderBottomWidth: 1, fontFamily: Fonts.sans, fontSize: 15, minHeight: 42, paddingHorizontal: 0 },
  iconLibrary: { gap: 7 },
  iconRow: { flexDirection: 'row', gap: 7 },
  iconChoice: { alignItems: 'center', borderRadius: Radius.small, borderWidth: 1, flex: 1, height: 35, justifyContent: 'center' },
  amountInput: { borderBottomWidth: 1, fontFamily: Fonts.serif, fontSize: 29, lineHeight: 34, minHeight: 57, paddingHorizontal: 0 },
  warning: { borderRadius: 12, padding: 10 },
  input: { borderBottomWidth: 1, fontFamily: Fonts.sans, fontSize: 16, minHeight: 52, paddingHorizontal: 0 },
  deleteAction: { alignItems: 'center', paddingVertical: Spacing.four },
});
