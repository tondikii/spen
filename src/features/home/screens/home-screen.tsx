import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/confirmation-modal';
import { EmptyState } from '@/components/empty-state';
import { FinanceHeroCard } from '@/components/finance-hero-card';
import { MotionPressable as Pressable, MotionScreen } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionRow } from '@/components/transaction-row';
import { BottomTabInset, Layout, MaxContentWidth, Spacing, Typography } from '@/constants/theme';
import { useIntlLocale } from '@/hooks/use-locale';
import { walletTotal } from '@/lib/domain/ledger';
import type { Category, Transaction, Wallet } from '@/types/domain';

import { WalletCards } from './wallet-cards';
import { WalletForm } from './wallet-form';

type HomeScreenProps = {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  onTransactionPress: (transaction: Transaction) => void;
  onDailyPress: () => void;
  onWalletSave: (wallet: Wallet | null, name: string, balance: number) => void | Promise<void>;
  onWalletArchive: (wallet: Wallet) => void | Promise<void>;
  onWalletRestore: (wallet: Wallet) => void | Promise<void>;
};

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

function RecentTransaction({
  transaction,
  wallets,
  categories,
  onPress,
}: {
  transaction: Transaction;
  wallets: Wallet[];
  categories: Category[];
  onPress: () => void;
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

export default function HomeScreen({
  onTransactionPress,
  onDailyPress,
  wallets,
  archivedWallets,
  transactions,
  categories,
  onWalletSave,
  onWalletArchive,
  onWalletRestore,
}: HomeScreenProps) {
  const { t } = useTranslation();
  const [formWallet, setFormWallet] = useState<Wallet | 'new' | null>(null);
  const [walletToArchive, setWalletToArchive] = useState<Wallet | null>(null);
  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);
  const total = useMemo(
    () => walletTotal([...wallets, ...archivedWallets]),
    [archivedWallets, wallets],
  );

  const saveWallet = async (name: string, balance: number) => {
    await onWalletSave(formWallet && formWallet !== 'new' ? formWallet : null, name, balance);
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
              onRestore={onWalletRestore}
            />
            <View style={styles.recent}>
              <View style={styles.sectionTitle}>
                <ThemedText type="sectionHeading">{t('common.recent')}</ThemedText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.viewAllTransactions')}
                  onPress={onDailyPress}
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
                    categories={categories}
                    onPress={() => onTransactionPress(transaction)}
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
          await onWalletArchive(walletToArchive);
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
  recent: { paddingBottom: Spacing.two },
});
