import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmationModal } from '@/components/confirmation-modal';
import { EmptyState } from '@/components/empty-state';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { FieldLabel, MoneyField } from '@/components/form-fields';
import {
  MotionChevron,
  MotionCollapsible,
  MotionPressable,
  MotionScreen,
  MotionPressable as Pressable,
} from '@/components/motion';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionRow } from '@/components/transaction-row';
import { BoxedCard } from '@/components/ui-primitives';
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
import { useIntlLocale } from '@/hooks/use-locale';
import { formatMoney } from '@/lib/money';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import {
  addMockWallet,
  getHomeRecentTransactions,
  getHomeWallets,
  getWalletTotal,
  restoreMockWallet,
  updateMockWallet,
} from '@/services/home-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { WALLET_TINT_SEQUENCE } from '@/constants/domain';
import { useTranslation } from 'react-i18next';

const tintSequence = WALLET_TINT_SEQUENCE;

function HomeHeader({ today = new Date() }: { today?: Date }) {
  const intlLocale = useIntlLocale();
  const label = new Intl.DateTimeFormat(intlLocale, {
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

function BalanceCard({
  total,
  hasArchivedWallets,
}: {
  total: number;
  hasArchivedWallets: boolean;
}) {
  const { t } = useTranslation();
  return (
    <FinanceHeroCard
      label={t('common.totalBalance')}
      marker="●"
      amount={total}
      note={hasArchivedWallets ? t('common.totalBalanceIncludesArchived') : undefined}
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
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">{t('common.walletSection')}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.addWalletLabel')}
          hitSlop={8}
          onPress={onAdd}
          wrapperStyle={styles.sectionAction}
        >
          <ThemedText type="smallBold" themeColor="pine" numberOfLines={1}>
            {t('common.addWalletLabel')}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.walletList}>
        {wallets.map((wallet) => (
          <MotionPressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
            onPress={() => onSelect(wallet)}
            style={[styles.walletRow, { borderBottomColor: theme.line }]}
          >
            <View style={[styles.walletIcon, { backgroundColor: theme.mint }]}>
              <MaterialCommunityIcons name="wallet-bifold-outline" size={20} color={theme.pine} />
            </View>
            <View style={styles.walletCopy}>
              <ThemedText type="smallBold" style={styles.walletName} numberOfLines={1}>
                {wallet.name}
              </ThemedText>
              <ThemedText type="small" themeColor="muted" style={styles.walletMeta}>
                {t('common.walletBalance')}
              </ThemedText>
            </View>
            <View style={styles.walletValue}>
              <ThemedText
                type="code"
                style={styles.walletBalance}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {formatMoney(wallet.balance)}
              </ThemedText>
              <ThemedText type="small" themeColor="muted" style={styles.walletChevron}>
                ›
              </ThemedText>
            </View>
          </MotionPressable>
        ))}
        {wallets.length === 0 && (
          <View style={[styles.walletEmpty, { borderBottomColor: theme.line }]}>
            <View style={[styles.walletIcon, { backgroundColor: theme.mint }]}>
              <MaterialCommunityIcons name="wallet-bifold-outline" size={20} color={theme.pine} />
            </View>
            <View style={styles.walletCopy}>
              <ThemedText type="smallBold">{t('common.activeWalletEmpty')}</ThemedText>
              <ThemedText type="small" themeColor="muted" style={styles.walletMeta}>
                {t('common.activeWalletEmptyCopy')}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
      {archivedWallets.length > 0 && (
        <BoxedCard style={styles.archivedWallets}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={
              archivedOpen ? t('common.closeArchivedWallets') : t('common.openArchivedWallets')
            }
            accessibilityHint={t('common.archivedWalletsHint')}
            onPress={() => setArchivedOpen((open) => !open)}
            style={styles.archivedHeader}
          >
            <View style={[styles.archivedGlyph, { backgroundColor: theme.mint }]}>
              <MaterialCommunityIcons name="wallet-bifold-outline" size={18} color={theme.pine} />
            </View>
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
                    <View style={[styles.archivedWalletIcon, { backgroundColor: theme.mint }]}>
                      <MaterialCommunityIcons
                        name="wallet-bifold-outline"
                        size={17}
                        color={theme.pine}
                      />
                    </View>
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
        </BoxedCard>
      )}
    </View>
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
  const { t } = useTranslation();
  return (
    <TransactionRow
      transaction={transaction}
      categories={categories}
      wallets={wallets}
      onPress={onPress}
      accessibilityLabel={(name) => t('common.editTransaction', { name })}
    />
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
            <FieldLabel>{t('common.walletName')}</FieldLabel>
            <ThemedInput
              accessibilityLabel={t('common.walletName')}
              placeholder={t('common.walletNamePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <MoneyField
              label={
                props.mode === 'edit' ? t('common.currentBalanceLabel') : t('common.startingBalanceLabel')
              }
              value={amount}
              onChangeText={(value) => setAmount(formatMoneyInput(value))}
              accessibilityLabel={
                props.mode === 'edit' ? t('common.walletBalance') : t('common.walletInitialBalance')
              }
            />
            {props.mode === 'edit' && (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={t('common.archiveWalletLabel')}
                onPress={props.onArchive}
                style={styles.archiveAction}
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
  wallets?: Wallet[];
  archivedWallets?: Wallet[];
  transactions?: Transaction[];
  categories?: Category[];
  onWalletSave?: (wallet: Wallet | null, name: string, balance: number) => void | Promise<void>;
  onWalletArchive?: (wallet: Wallet) => void | Promise<void>;
  onWalletRestore?: (wallet: Wallet) => void | Promise<void>;
};

export default function HomeScreen({
  onTransactionPress,
  onDailyPress,
  wallets: walletsProp,
  archivedWallets: archivedWalletsProp,
  transactions: transactionsProp,
  categories: categoriesProp,
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
  const total = useMemo(
    () => getWalletTotal([...wallets, ...archivedWallets]),
    [archivedWallets, wallets],
  );

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
            <BalanceCard total={total} hasArchivedWallets={archivedWallets.length > 0} />
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
            <View style={styles.recent}>
              <View style={styles.sectionTitle}>
                <ThemedText type="sectionHeading">{t('common.recent')}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.viewAllTransactions')}
                  onPress={onDailyPress ?? (() => undefined)}
                  wrapperStyle={styles.sectionAction}
                >
                  <ThemedText type="smallBold" themeColor="pine" numberOfLines={1}>
                    {t('common.viewAll')}
                  </ThemedText>
                </Pressable>
              </View>
              {recentTransactions.length === 0 ? (
                <EmptyState
                  title={t('common.noRecords')}
                  description={t('common.firstTransactionCopy')}
                  actionLabel={t('common.addTransaction')}
                  onAction={onDailyPress}
                />
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
  sectionAction: { flexShrink: 0 },
  walletSection: { marginBottom: Spacing.six },
  archivedWallets: { borderRadius: 19, marginTop: 2, overflow: 'hidden' },
  archivedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  archivedGlyph: {
    alignItems: 'center',
    borderRadius: 10,
    height: 31,
    justifyContent: 'center',
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
  archivedWalletIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 28,
    justifyContent: 'center',
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
  walletList: {
    marginTop: 0,
  },
  walletRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingVertical: 12,
  },
  walletEmpty: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingVertical: 12,
  },
  walletIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  walletCopy: { flex: 1, minWidth: 0 },
  walletName: { fontSize: 12, lineHeight: 16 },
  walletMeta: { fontSize: 10, lineHeight: 14, marginTop: Spacing.half },
  walletValue: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    maxWidth: '56%',
  },
  walletBalance: {
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: -0.4,
  },
  walletChevron: { fontSize: 17, lineHeight: 18 },
  quietAction: { fontSize: 12, lineHeight: 15 },
  pressed: { opacity: 0.7 },
  recent: { paddingBottom: Spacing.two },
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
});
