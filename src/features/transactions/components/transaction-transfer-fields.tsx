import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyMark } from '@/components/ui/currency-mark';
import { FieldLabel } from '@/components/ui/form-fields';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { Fonts, Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyInput } from '@/utils/money-input';
import type { Wallet } from '@/types/domain';

type TransactionTransferFieldsProps = {
  wallets: Wallet[];
  walletId: string | null;
  onWalletChange: (walletId: string | null) => void;
  toWalletId: string | null;
  onToWalletChange: (toWalletId: string | null) => void;
  lockedToWalletId?: string | undefined;
  adminFee: string;
  onAdminFeeChange: (value: string) => void;
};

/**
 * Bagian form khusus transfer: dompet asal/tujuan dengan tombol tukar,
 * tujuan terkunci (transaksi dari Goal) dan biaya admin opsional.
 */
export function TransactionTransferFields({
  wallets,
  walletId,
  onWalletChange,
  toWalletId,
  onToWalletChange,
  lockedToWalletId,
  adminFee,
  onAdminFeeChange,
}: TransactionTransferFieldsProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <FieldLabel>{t('common.fromWallet')}</FieldLabel>
      <WalletPicker wallets={wallets} selected={walletId} onSelect={onWalletChange} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.swapTransferWallet')}
        accessibilityHint={t('common.swapTransferWalletHint')}
        onPress={() => {
          onWalletChange(toWalletId);
          onToWalletChange(walletId);
        }}
        style={styles.swap}
      >
        <ThemedText type="subtitle" themeColor="gold">
          ↕
        </ThemedText>
      </Pressable>
      <FieldLabel>{t('common.toWallet')}</FieldLabel>
      {lockedToWalletId ? (
        <View
          style={[styles.lockedWallet, { borderColor: theme.line, backgroundColor: theme.mint }]}
        >
          <ThemedText type="smallBold">
            {wallets.find((wallet) => wallet.id === lockedToWalletId)?.name ??
              t('common.goalWallet')}
          </ThemedText>
          <ThemedText type="small" themeColor="muted">
            {t('common.lockedGoalWallet')}
          </ThemedText>
        </View>
      ) : (
        <WalletPicker
          wallets={wallets}
          selected={toWalletId}
          onSelect={onToWalletChange}
          exclude={walletId}
        />
      )}
      <FieldLabel>
        {t('common.adminFee').toUpperCase()}{' '}
        <ThemedText type="small" themeColor="muted">
          ({t('common.optional')})
        </ThemedText>
      </FieldLabel>
      <View style={styles.moneyInputRow}>
        <CurrencyMark />
        <ThemedInput
          accessibilityLabel={t('common.adminFee')}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.muted}
          value={adminFee}
          onChangeText={(value) => onAdminFeeChange(formatMoneyInput(value))}
          style={[
            styles.input,
            styles.moneyInput,
            { borderBottomColor: theme.line, color: theme.ink },
          ]}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  lockedWallet: { borderRadius: 13, borderWidth: 1, gap: 2, padding: 11 },
  swap: {
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 0,
  },
  moneyInputRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  moneyInput: { flex: 1 },
});
