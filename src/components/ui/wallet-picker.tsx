import { ScrollView, StyleSheet } from 'react-native';

import { MotionPressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '@/lib/money';
import type { Wallet } from '@/types/domain';

/**
 * Horizontal wallet selector shared by the transaction form and the plan/goal
 * sheets: a scrollable row of wallet chips (name + balance) with the selected
 * chip highlighted. `exclude` hides a wallet (e.g. the transfer source).
 */
export function WalletPicker({
  wallets,
  selected,
  onSelect,
  exclude,
}: {
  wallets: Wallet[];
  selected: string | null;
  onSelect: (id: string) => void;
  /** Wallet id to hide from the list. */
  exclude?: string | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.picker}
    >
      {wallets
        .filter((wallet) => wallet.id !== exclude)
        .map((wallet) => (
          <MotionPressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectWallet', { name: wallet.name })}
            accessibilityState={{ selected: wallet.id === selected }}
            onPress={() => onSelect(wallet.id)}
            style={[
              styles.choice,
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
          </MotionPressable>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  picker: { gap: Spacing.two, paddingVertical: Spacing.one },
  choice: { borderRadius: 12, borderWidth: 1, gap: 2, minWidth: 120, padding: 10 },
});
