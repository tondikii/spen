import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
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
  MotionAnimatedView,
  MotionChevron,
  MotionCollapsible,
  MotionPressable,
  MotionPressable as Pressable,
  MotionProgressBar,
  MotionScreen,
  motionPresets,
} from '@/components/motion';
import {
  BottomTabInset,
  Fonts,
  Layout,
  MaxContentWidth,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { getCategoryLabel } from '@/i18n/categories';
import { getIntlLocale } from '@/i18n/format';
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

function HomeHeader({ today = new Date() }: { today?: Date }) {
  const { i18n } = useTranslation();
  const label = new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
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
          label: t('common.budgetPeriod'),
          value: period ? formatPeriod(period) : t('common.budgetPeriod'),
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
  const { t } = useTranslation();
  const [archivedOpen, setArchivedOpen] = useState(false);
  return (
    <View style={styles.walletSection}>
      <SectionHeader
        title={t('common.walletSection')}
        action={t('common.addWalletLabel')}
        onPress={onAdd}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walletRow}
      >
        {wallets.map((wallet) => (
          <MotionPressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
            onPress={() => onSelect(wallet)}
            style={[styles.walletCard, { backgroundColor: theme.card, borderColor: theme.line }]}
          >
            <ThemedText
              style={[styles.walletGlyph, { backgroundColor: theme.mint, color: theme.pine }]}
            >
              {walletGlyph(wallet)}
            </ThemedText>
            <ThemedText style={styles.walletName}>{wallet.name}</ThemedText>
            <ThemedText style={styles.walletBalance}>{formatMoney(wallet.balance)}</ThemedText>
          </MotionPressable>
        ))}
        {wallets.length === 0 && (
          <View style={[styles.walletEmpty, { backgroundColor: theme.mint }]}>
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.activeWalletEmpty')}
            </ThemedText>
            <ThemedText type="small" themeColor="muted">
              {t('common.activeWalletEmptyCopy')}
            </ThemedText>
          </View>
        )}
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.addWalletLabel')}
          onPress={onAdd}
          style={[styles.walletAdd, { borderColor: theme.line }]}
        >
          <ThemedText
            type="subtitle"
            themeColor="pine"
            style={[styles.walletAddIcon, { backgroundColor: theme.mint }]}
          >
            ＋
          </ThemedText>
          <ThemedText type="small" themeColor="muted" style={styles.walletAddLabel}>
            {t('common.addWalletLabel')}
          </ThemedText>
        </MotionPressable>
      </ScrollView>
      {archivedWallets.length > 0 && (
        <View
          style={[styles.archivedWallets, { backgroundColor: theme.card, borderColor: theme.line }]}
        >
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              archivedOpen ? t('common.closeArchivedWallets') : t('common.openArchivedWallets')
            }
            accessibilityHint={t('common.archivedWalletsHint')}
            onPress={() => setArchivedOpen((open) => !open)}
            style={styles.archivedHeader}
          >
            <ThemedText
              type="smallBold"
              themeColor="pine"
              style={[styles.archivedGlyph, { backgroundColor: theme.mint }]}
            >
              □
            </ThemedText>
            <View style={styles.archivedHeaderCopy}>
              <ThemedText type="smallBold">{t('common.archivedWallets')}</ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.archivedCount', { count: archivedWallets.length })}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" themeColor="muted">
              <MotionChevron expanded={archivedOpen} color={theme.muted} />
            </ThemedText>
          </MotionPressable>
          {archivedOpen && (
            <MotionCollapsible>
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
                        {formatMoney(wallet.balance)} · {t('common.archived')}
                      </ThemedText>
                    </View>
                    <MotionPressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.restoreWallet', { name: wallet.name })}
                      accessibilityHint={t('common.restoreWalletHint')}
                      onPress={() => onRestore(wallet)}
                      style={[styles.restoreButton, { borderColor: theme.pine }]}
                    >
                      <ThemedText type="smallBold" themeColor="pine">
                        {t('common.restore')}
                      </ThemedText>
                    </MotionPressable>
                  </View>
                ))}
              </View>
            </MotionCollapsible>
          )}
        </View>
      )}
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  return (
    <MotionProgressBar
      value={progress}
      color={theme.pine}
      trackColor={theme.line}
      style={styles.progressTrack}
    />
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
  const { t } = useTranslation();
  const snapshot = snapshotProp ?? getHomeSnapshot();
  const progress =
    snapshot.totalIncome > 0 ? (snapshot.totalExpense / snapshot.totalIncome) * 100 : 0;
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.planSnapshot, { backgroundColor: theme.card, borderColor: theme.line }]}
    >
      <View style={styles.planHeader}>
        <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
          {t('common.spareBudget')}
        </ThemedText>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.viewPlan')}
          onPress={onPress}
          style={styles.planLink}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.planLinkText}>
            {t('common.viewPlan')} →
          </ThemedText>
        </MotionPressable>
      </View>
      <View>
        <ThemedText type="subtitle" style={styles.planAmount}>
          {formatMoney(snapshot.spareBudget)}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.planCaption}>
          {t('common.stillAllocatable')}
        </ThemedText>
      </View>
      <ProgressBar progress={progress} />
      <View style={styles.miniStats}>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>
          {t('common.income')}{' '}
          <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalIncome)}</ThemedText>
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.miniStat}>
          {t('common.expense')}{' '}
          <ThemedText style={styles.miniStatValue}>{formatMoney(snapshot.totalExpense)}</ThemedText>
        </ThemedText>
      </View>
    </MotionAnimatedView>
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
  const { t } = useTranslation();
  const presentation = getTransactionPresentation(transaction, categories, wallets);
  const category = categories?.find((item) => item.id === transaction.categoryId);
  const categoryName = category ? getCategoryLabel(category) : presentation.categoryName;
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
    <MotionPressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? t('common.editTransaction', { name: categoryName }) : undefined}
      onPress={onPress}
      style={[styles.transactionRow, { borderBottomColor: theme.line }]}
    >
      <ThemedView style={[styles.categoryIcon, { backgroundColor: iconBackground }]}>
        <CategoryIcon name={presentation.categoryIcon} color={theme[typeColor]} />
      </ThemedView>
      <View style={styles.transactionDescription}>
        <ThemedText type="smallBold" style={styles.transactionName}>
          {categoryName}
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
    </MotionPressable>
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
  const { t } = useTranslation();
  const wallet = props.mode === 'edit' ? props.wallet : undefined;
  const [name, setName] = useState(wallet?.name ?? '');
  const [amount, setAmount] = useState(wallet ? formatMoneyInput(wallet.balance) : '');
  return (
    <Modal animationType="slide" visible onRequestClose={props.onClose}>
      <ThemedView style={styles.formPage}>
        <View style={[styles.formHeader, { borderBottomColor: theme.line }]}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={t('common.closeWalletForm')}
            onPress={props.onClose}
            style={styles.headerButton}
          >
            <ThemedText type="subtitle" themeColor="pine">
              ×
            </ThemedText>
          </MotionPressable>
          <ThemedText type="sectionHeading">
            {props.mode === 'edit' ? t('common.editWallet') : t('common.newWallet')}
          </ThemedText>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={t('common.saveWallet')}
            onPress={() =>
              props.onSave(name.trim() || t('common.newWallet'), parseMoneyInput(amount))
            }
            style={styles.headerButton}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.save')}
            </ThemedText>
          </MotionPressable>
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
              {t('common.walletFormNote')}
            </ThemedText>
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>
              {t('common.walletName').toUpperCase()}
            </ThemedText>
            <ThemedInput
              accessibilityLabel={t('common.walletName')}
              placeholder={t('common.walletNamePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <ThemedText type="code" themeColor="muted" style={styles.formLabel}>
              {props.mode === 'edit'
                ? t('common.currentBalanceLabel')
                : t('common.startingBalanceLabel')}
            </ThemedText>
            <View style={styles.moneyInputRow}>
              <CurrencyMark />
              <ThemedInput
                accessibilityLabel={
                  props.mode === 'edit'
                    ? t('common.walletBalance')
                    : t('common.walletInitialBalance')
                }
                keyboardType="numeric"
                placeholder="0"
                value={amount}
                onChangeText={(value) => setAmount(formatMoneyInput(value))}
                style={styles.moneyInput}
              />
            </View>
            {props.mode === 'edit' && (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={t('common.archiveWalletLabel')}
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
                    {t('common.archiveWalletLabel')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    {t('common.walletArchiveTransactionCopy')}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" themeColor="muted">
                  ›
                </ThemedText>
              </MotionPressable>
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
  const { t } = useTranslation();
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
      <MotionScreen>
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
                <ThemedText type="sectionHeading">{t('common.recent')}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.viewAllTransactions')}
                  onPress={onDailyPress ?? (() => undefined)}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    {t('common.viewAll')}
                  </ThemedText>
                </Pressable>
              </View>
              {recentTransactions.length === 0 ? (
                <View style={styles.empty}>
                  <ThemedText style={styles.emptyGlyph}>◌</ThemedText>
                  <ThemedText type="smallBold">{t('common.noRecords')}</ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    {t('common.firstTransactionCopy')}
                  </ThemedText>
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.addTransaction')}
                    onPress={onDailyPress}
                    style={[styles.emptyButton, { backgroundColor: theme.pine }]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                      {t('common.addTransaction')}
                    </ThemedText>
                  </MotionPressable>
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
      </MotionScreen>
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
        title={t('common.archiveWallet')}
        message={
          walletToArchive ? t('common.archiveConfirmCopy', { name: walletToArchive.name }) : ''
        }
        confirmLabel={t('common.archive')}
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
  return `${start.getDate()} — ${end.getDate()} ${new Intl.DateTimeFormat(
    getIntlLocale(i18n.language === 'en' ? 'en' : 'id'),
    { month: 'short' },
  ).format(end)}`;
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
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planLink: { minHeight: 32, justifyContent: 'center', paddingLeft: Spacing.two },
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
