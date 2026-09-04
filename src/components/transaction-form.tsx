import { useContext, useMemo, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/category-icon';
import { CurrencyMark } from '@/components/currency-mark';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/money';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { ThemedInput } from '@/components/themed-input';
import { ConfirmationModal } from '@/components/confirmation-modal';
import {
  archiveMockCategory,
  getActiveTransactionCategories,
  getActiveTransactionWallets,
  getAllocationLimit,
  getTransactionCategories,
  hasSimilarIncome,
  saveMockCategory,
} from '@/services/transaction-service';
import type {
  Category,
  Transaction,
  TransactionDraft,
  TransactionType,
  Wallet,
} from '@/types/domain';

type TransactionFormProps = {
  mode: 'create' | 'edit';
  transaction?: Transaction;
  initialType?: Exclude<TransactionType, 'adjustment'>;
  initialCategoryId?: string;
  initialAmount?: number;
  initialWalletId?: string;
  initialToWalletId?: string;
  lockedToWalletId?: string;
  wallets?: Wallet[];
  categories?: Category[];
  existingTransactions?: Transaction[];
  allocationLimit?: number;
  onClose: () => void;
  onSave: (draft: TransactionDraft) => void;
  onDelete?: () => void;
  onCategorySave?: (category: Category) => Category | Promise<Category>;
  onCategoryArchive?: (category: Category) => void | Promise<void>;
};

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

const tabs: { type: TransactionType; label: string }[] = [
  { type: 'income', label: 'Masuk' },
  { type: 'expense', label: 'Keluar' },
  { type: 'transfer', label: 'Transfer' },
];

export function TransactionForm({
  mode,
  transaction,
  initialType,
  initialCategoryId,
  initialAmount,
  initialWalletId,
  initialToWalletId,
  lockedToWalletId,
  wallets = getActiveTransactionWallets(),
  categories: categoriesProp,
  existingTransactions = [],
  allocationLimit: allocationLimitProp,
  onClose,
  onSave,
  onDelete,
  onCategorySave,
  onCategoryArchive,
}: TransactionFormProps) {
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext) ?? {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
  const resolvedInitialType: TransactionType =
    transaction?.type === 'adjustment' ? 'expense' : (transaction?.type ?? initialType ?? 'income');
  const [type, setType] = useState<TransactionType>(resolvedInitialType);
  const [walletId, setWalletId] = useState(
    transaction?.walletId ?? initialWalletId ?? wallets[0]?.id ?? null,
  );
  const [toWalletId, setToWalletId] = useState(
    transaction?.toWalletId ?? initialToWalletId ?? wallets[1]?.id ?? wallets[0]?.id ?? null,
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? initialCategoryId ?? null,
  );
  const [amount, setAmount] = useState(
    transaction ? formatMoneyInput(transaction.amount) : formatMoneyInput(initialAmount),
  );
  const [adminFee, setAdminFee] = useState(formatMoneyInput(transaction?.adminFee ?? ''));
  const [note, setNote] = useState(transaction?.note ?? '');
  const [categories, setCategories] = useState<Category[]>(
    categoriesProp ?? getActiveTransactionCategories(),
  );
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const [categoryActions, setCategoryActions] = useState<Category | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const selectedCategoryType = type === 'transfer' ? 'transfer' : type;
  const visibleCategories = useMemo(
    () => getTransactionCategories(categories, selectedCategoryType),
    [categories, selectedCategoryType],
  );
  const numericAmount = parseMoneyInput(amount);
  const allocationLimit = allocationLimitProp ?? getAllocationLimit(categoryId);
  const overBudget = type === 'expense' && allocationLimit > 0 && numericAmount > allocationLimit;

  const changeType = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'transfer') {
      setCategoryId(null);
    } else if (
      !categories.some((category) => category.id === categoryId && category.type === nextType)
    ) {
      setCategoryId(null);
    }
  };

  const saveCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    setCategorySaving(true);
    try {
      const categoryType = type === 'income' ? 'income' : 'expense';
      const category: Category = {
        id: editingCategoryId ?? `category-draft-${Date.now()}`,
        name: trimmedName,
        type: categoryType,
        icon: categoryIcon,
        archived: false,
        isAdjustment: false,
      };
      if (onCategorySave) {
        const saved = await Promise.resolve(onCategorySave(category));
        setCategories((current) => [...current.filter((item) => item.id !== saved.id), saved]);
        setCategoryId(saved.id);
      } else {
        setCategories((current) => saveMockCategory(current, category));
        setCategoryId(category.id);
      }
      setCategoryName('');
      setEditingCategoryId(null);
      setCategoryEditorOpen(false);
    } catch (error) {
      setConfirmation({
        title: 'Kategori belum tersimpan',
        message: error instanceof Error ? error.message : 'Coba lagi.',
        confirmLabel: 'Mengerti',
        onConfirm: () => undefined,
      });
    } finally {
      setCategorySaving(false);
    }
  };

  const editCategory = (category: Category) => {
    setCategoryActions(null);
    setCategoryEditorOpen(true);
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
      adminFee: type === 'transfer' ? parseMoneyInput(adminFee) : 0,
      date: transaction?.date ?? '2026-09-02',
      time: transaction?.time ?? '12:00',
      note: note.trim(),
    });
  };

  const possibleDuplicate = hasSimilarIncome(
    existingTransactions,
    {
      type,
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : null,
      categoryId: type === 'transfer' ? null : categoryId,
      amount: numericAmount,
      date: transaction?.date ?? '2026-09-02',
      time: transaction?.time ?? '12:00',
      note: note.trim(),
    },
    transaction?.id,
  );

  return (
    <ThemedView style={styles.page}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.line,
            paddingTop: Math.max(insets.top, Spacing.two),
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup form transaksi"
          onPress={onClose}
          style={styles.headerButton}
        >
          <ThemedText style={styles.close}>×</ThemedText>
        </Pressable>
        <ThemedText type="sectionHeading">
          {mode === 'edit' ? 'Edit Transaksi' : 'Tambah Transaksi'}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          onPress={submit}
          style={styles.headerButton}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
          </ThemedText>
        </Pressable>
      </View>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <View style={[styles.typeTabs, { borderBottomColor: theme.line }]}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.type}
                accessibilityRole="tab"
                accessibilityLabel={`Tipe ${tab.label}`}
                accessibilityState={{ selected: type === tab.type }}
                accessibilityHint="Memilih jenis transaksi"
                onPress={() => changeType(tab.type)}
                style={[
                  styles.typeTab,
                  type === tab.type && {
                    borderBottomColor:
                      tab.type === 'income'
                        ? theme.income
                        : tab.type === 'expense'
                          ? theme.expense
                          : theme.pine,
                  },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor={
                    type === tab.type
                      ? tab.type === 'income'
                        ? 'income'
                        : tab.type === 'expense'
                          ? 'expense'
                          : 'pine'
                      : 'muted'
                  }
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {type === 'transfer' ? (
            <>
              <FieldLabel>TRANSFER DARI</FieldLabel>
              <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tukar Wallet Transfer"
                onPress={() => {
                  setWalletId(toWalletId);
                  setToWalletId(walletId);
                }}
                style={styles.swap}
              >
                <ThemedText type="subtitle" themeColor="gold">
                  ↕
                </ThemedText>
              </Pressable>
              <FieldLabel>TRANSFER KE</FieldLabel>
              {lockedToWalletId ? (
                <View
                  style={[
                    styles.lockedWallet,
                    { borderColor: theme.line, backgroundColor: theme.mint },
                  ]}
                >
                  <ThemedText type="smallBold">
                    {wallets.find((wallet) => wallet.id === lockedToWalletId)?.name ??
                      'Wallet Goal'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    Tujuan Wallet Goal terkunci
                  </ThemedText>
                </View>
              ) : (
                <WalletPicker
                  wallets={wallets}
                  selected={toWalletId}
                  onSelect={setToWalletId}
                  exclude={walletId}
                />
              )}
              <FieldLabel>
                BIAYA ADMIN{' '}
                <ThemedText type="small" themeColor="muted">
                  (opsional)
                </ThemedText>
              </FieldLabel>
              <View style={styles.moneyInputRow}>
                <CurrencyMark />
                <ThemedInput
                  accessibilityLabel="Biaya admin transfer"
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                  value={adminFee}
                  onChangeText={(value) => setAdminFee(formatMoneyInput(value))}
                  style={[
                    styles.input,
                    styles.moneyInput,
                    { borderBottomColor: theme.line, color: theme.ink },
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              <FieldLabel>WALLET</FieldLabel>
              <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
              <View style={styles.labelLine}>
                <FieldLabel>
                  {type === 'income' ? 'KATEGORI PENDAPATAN' : 'KATEGORI PENGELUARAN'}
                </FieldLabel>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Kelola kategori"
                  onPress={() => {
                    setEditingCategoryId(null);
                    setCategoryName('');
                    setCategoryIcon(CATEGORY_ICON_CHOICES[0]);
                    setCategoryEditorOpen(true);
                  }}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    + Tambah
                  </ThemedText>
                </Pressable>
              </View>
              <ScrollView
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryGrid}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {visibleCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Kategori ${category.name}`}
                    onPress={() => setCategoryId(category.id)}
                    onLongPress={() => setCategoryActions(category)}
                    delayLongPress={350}
                    style={[
                      styles.category,
                      {
                        borderColor: category.id === categoryId ? theme.pine : theme.line,
                        backgroundColor: category.id === categoryId ? theme.mint : theme.card,
                      },
                    ]}
                  >
                    <CategoryIcon
                      name={category.icon}
                      color={type === 'income' ? theme.income : theme.expense}
                    />
                    <ThemedText type="small" style={styles.categoryName}>
                      {category.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
              {categoryEditorOpen && (
                <View
                  style={[
                    styles.categoryEditor,
                    { borderColor: theme.line, backgroundColor: theme.card },
                  ]}
                >
                  <View style={styles.categoryEditorHeader}>
                    <ThemedText type="smallBold">
                      {editingCategoryId ? 'Edit kategori' : 'Tambah kategori'}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Batal edit kategori"
                      disabled={categorySaving}
                      onPress={() => {
                        setCategoryEditorOpen(false);
                        setEditingCategoryId(null);
                        setCategoryName('');
                      }}
                      hitSlop={8}
                    >
                      <ThemedText type="smallBold" style={{ color: theme.expense }}>
                        Batal
                      </ThemedText>
                    </Pressable>
                  </View>
                  <ThemedInput
                    accessibilityLabel={editingCategoryId ? 'Nama kategori' : 'Nama kategori baru'}
                    placeholder="Nama kategori"
                    placeholderTextColor={theme.muted}
                    value={categoryName}
                    onChangeText={setCategoryName}
                    style={[
                      styles.editorInput,
                      { borderBottomColor: theme.line, color: theme.ink },
                    ]}
                  />
                  <ScrollView
                    style={styles.iconScroll}
                    contentContainerStyle={styles.iconLibrary}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {CATEGORY_ICON_CHOICES.map((icon) => (
                      <Pressable
                        key={icon}
                        accessibilityRole="button"
                        accessibilityLabel={`Pilih ikon ${icon}`}
                        onPress={() => setCategoryIcon(icon)}
                        style={[
                          styles.iconChoice,
                          {
                            borderColor: icon === categoryIcon ? theme.pine : theme.line,
                            backgroundColor: icon === categoryIcon ? theme.mint : theme.background,
                          },
                        ]}
                      >
                        <CategoryIcon name={icon} color={theme.pine} size={21} />
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Simpan kategori"
                    disabled={categorySaving || !categoryName.trim()}
                    onPress={() => void saveCategory()}
                    style={({ pressed }) => [
                      styles.saveCategoryButton,
                      {
                        backgroundColor: categoryName.trim() ? theme.pine : theme.line,
                        opacity: pressed || categorySaving ? 0.78 : 1,
                      },
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={{
                        color: categoryName.trim() ? theme.heroText : theme.muted,
                      }}
                    >
                      {categorySaving
                        ? 'Menyimpan…'
                        : editingCategoryId
                          ? 'Simpan perubahan'
                          : 'Simpan kategori'}
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <FieldLabel>{type === 'transfer' ? 'NOMINAL TRANSFER' : 'NOMINAL'}</FieldLabel>
          <View style={styles.moneyInputRow}>
            <CurrencyMark />
            <ThemedInput
              accessibilityLabel="Nominal transaksi"
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.muted}
              value={amount}
              onChangeText={(value) => setAmount(formatMoneyInput(value))}
              style={[
                styles.amountInput,
                styles.moneyInput,
                { borderBottomColor: theme.line, color: theme.ink },
              ]}
            />
          </View>
          {overBudget && (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.warning, { backgroundColor: theme.dangerBackground }]}
            >
              <ThemedText type="small" style={{ color: theme.expense }}>
                Perlahan ya — ini akan melebihi alokasi, tetapi tetap bisa dicatat.
              </ThemedText>
            </View>
          )}
          {possibleDuplicate && (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.warning, { backgroundColor: theme.transferBackground }]}
            >
              <ThemedText type="small" style={{ color: theme.gold }}>
                Transaksi ini mungkin dobel dengan catatan pendapatan hari ini.
              </ThemedText>
            </View>
          )}
          <FieldLabel>
            CATATAN{' '}
            <ThemedText type="small" themeColor="muted">
              (opsional)
            </ThemedText>
          </FieldLabel>
          <ThemedInput
            accessibilityLabel="Catatan transaksi"
            placeholder="Mis. makan siang"
            placeholderTextColor={theme.muted}
            value={note}
            onChangeText={setNote}
            style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }]}
          />
          {mode === 'edit' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hapus Transaksi"
              onPress={() =>
                setConfirmation({
                  title: 'Hapus transaksi?',
                  message: 'Transaksi ini akan dihapus dari catatan.',
                  confirmLabel: 'Hapus',
                  destructive: true,
                  onConfirm: () => onDelete?.(),
                })
              }
              style={styles.deleteAction}
            >
              <ThemedText type="smallBold" style={{ color: theme.expense }}>
                Hapus Transaksi
              </ThemedText>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        transparent
        animationType="slide"
        visible={Boolean(categoryActions)}
        onRequestClose={() => setCategoryActions(null)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setCategoryActions(null)}
        >
          <View style={[styles.categorySheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">{categoryActions?.name}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              Pilih aksi untuk kategori ini.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit kategori ${categoryActions?.name}`}
              onPress={() => categoryActions && editCategory(categoryActions)}
              style={[styles.sheetAction, { borderTopColor: theme.line }]}
            >
              <ThemedText type="smallBold" themeColor="pine">
                Edit kategori
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Arsipkan kategori ${categoryActions?.name}`}
              onPress={async () => {
                if (!categoryActions) return;
                const category = categoryActions;
                setCategoryActions(null);
                setConfirmation({
                  title: 'Arsipkan kategori?',
                  message: `${category.name} tidak akan muncul di pilihan baru. Transaksi lama tetap tersimpan.`,
                  confirmLabel: 'Arsipkan',
                  destructive: true,
                  onConfirm: async () => {
                    if (onCategoryArchive) await onCategoryArchive(category);
                    setCategories((current) => archiveMockCategory(current, category.id));
                    if (categoryId === category.id) setCategoryId(null);
                  },
                });
              }}
              style={[styles.sheetAction, { borderTopColor: theme.line }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.expense }}>
                Arsipkan kategori
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <ConfirmationModal
        visible={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Mengerti'}
        destructive={confirmation?.destructive}
        cancelLabel={confirmation?.confirmLabel === 'Mengerti' ? undefined : 'Batal'}
        onCancel={() => setConfirmation(null)}
        onConfirm={async () => {
          const action = confirmation?.onConfirm;
          setConfirmation(null);
          await action?.();
        }}
      />
    </ThemedView>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="code" themeColor="muted" style={styles.fieldLabel}>
      {children}
    </ThemedText>
  );
}

function WalletPicker({
  wallets,
  selected,
  onSelect,
  exclude,
}: {
  wallets: Wallet[];
  selected: string | null;
  onSelect: (id: string) => void;
  exclude?: string | null;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.walletPicker}
    >
      {wallets
        .filter((wallet) => wallet.id !== exclude)
        .map((wallet) => (
          <Pressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={`Pilih Wallet ${wallet.name}`}
            onPress={() => onSelect(wallet.id)}
            style={[
              styles.walletChoice,
              {
                borderColor: wallet.id === selected ? theme.pine : theme.line,
                backgroundColor: wallet.id === selected ? theme.mint : theme.card,
              },
            ]}
          >
            <ThemedText type="smallBold">{wallet.name}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              {formatMoney(wallet.balance)}
            </ThemedText>
          </Pressable>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { flex: 1 },
  header: {
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
    minWidth: 64,
  },
  close: { fontSize: 28, lineHeight: 32 },
  content: {
    gap: Spacing.two,
    paddingHorizontal: 21,
    paddingTop: 24,
    paddingBottom: 40,
  },
  note: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.three },
  typeTabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.four,
  },
  typeTab: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flex: 1,
    paddingVertical: 11,
  },
  fieldLabel: { ...Typography.eyebrow, marginTop: Spacing.two },
  walletPicker: { gap: Spacing.two, paddingVertical: Spacing.one },
  walletChoice: {
    borderRadius: 13,
    borderWidth: 1,
    gap: 2,
    minWidth: 120,
    padding: 11,
  },
  lockedWallet: { borderRadius: 13, borderWidth: 1, gap: 2, padding: 11 },
  swap: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  labelLine: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  categoryScroll: {
    maxHeight: 236,
    width: '100%',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'flex-start',
    width: '100%',
  },
  category: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    gap: 3,
    flexGrow: 0,
    width: '31%',
    padding: 9,
  },
  categoryName: { fontSize: 10, lineHeight: 13, textAlign: 'center' },
  categoryEditor: {
    alignSelf: 'stretch',
    borderRadius: 13,
    borderWidth: 1,
    gap: Spacing.two,
    padding: 11,
    width: '100%',
  },
  categoryEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  categoryManageList: { gap: Spacing.one },
  editorInput: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  iconLibrary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'flex-start',
    width: '100%',
  },
  iconScroll: {
    maxHeight: 196,
    width: '100%',
  },
  iconChoice: {
    alignItems: 'center',
    borderRadius: Radius.small,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '18%',
  },
  saveCategoryButton: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  categorySheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    gap: Spacing.two,
    padding: 21,
  },
  sheetAction: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    paddingVertical: 15,
  },
  amountInput: {
    borderBottomWidth: 1,
    fontFamily: Fonts.serif,
    fontSize: 29,
    lineHeight: 34,
    minHeight: 57,
    paddingHorizontal: 0,
  },
  warning: { borderRadius: 12, padding: 10 },
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 0,
  },
  moneyInputRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  moneyInput: { flex: 1 },
  deleteAction: { alignItems: 'center', paddingVertical: Spacing.four },
});
