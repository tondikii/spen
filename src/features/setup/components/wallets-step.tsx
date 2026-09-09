import { type Dispatch, type SetStateAction } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CurrencyMark } from '@/components/ui/currency-mark';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Fonts, Spacing, Typography } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyInput } from '@/utils/money-input';

export type WalletFormDraft = { name: string; balance: string };

export function WalletsStep({
  width,
  wallets,
  onWalletsChange,
}: {
  width: number;
  wallets: WalletFormDraft[];
  onWalletsChange: Dispatch<SetStateAction<WalletFormDraft[]>>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.slide, width ? { width } : null]}>
      <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
        {t('common.createWallet')}
      </ThemedText>
      <ThemedText type="title" style={styles.title}>
        {t('common.whereMoney')}
      </ThemedText>
      <ThemedText type="small" themeColor="muted" style={styles.lead}>
        {t('common.walletHint')}
      </ThemedText>
      <ScrollView
        style={styles.walletList}
        contentContainerStyle={styles.walletListContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        {wallets.map((wallet, index) => (
          <View key={index} style={styles.walletItem}>
            {index > 0 && (
              <View style={styles.walletItemActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.removeWallet', { number: index + 1 })}
                  onPress={() =>
                    onWalletsChange((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  hitSlop={8}
                >
                  <ThemedText type="smallBold" style={{ color: theme.expense }}>
                    {t('common.remove')}
                  </ThemedText>
                </Pressable>
              </View>
            )}
            <ThemedText type="code" themeColor="muted">
              {t('common.walletName').toUpperCase()}
            </ThemedText>
            <ThemedInput
              accessibilityLabel={
                index === 0
                  ? t('common.walletNameFirst')
                  : t('common.walletNameNumber', { number: index + 1 })
              }
              placeholder={t('common.exampleCash')}
              placeholderTextColor={theme.muted}
              value={wallet.name}
              onChangeText={(name) =>
                onWalletsChange((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name } : item,
                  ),
                )
              }
              style={[styles.input, { borderBottomColor: theme.line, color: theme.ink }]}
            />
            <ThemedText type="code" themeColor="muted" style={styles.balanceLabel}>
              {t('common.initialBalance').toUpperCase()}
            </ThemedText>
            <View style={styles.moneyInputRow}>
              <CurrencyMark />
              <ThemedInput
                accessibilityLabel={
                  index === 0
                    ? t('common.startingBalanceWalletFirst')
                    : t('common.startingBalanceWalletNumber', { number: index + 1 })
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.muted}
                value={wallet.balance}
                onChangeText={(balance) =>
                  onWalletsChange((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            balance: formatMoneyInput(balance),
                          }
                        : item,
                    ),
                  )
                }
                style={[
                  styles.input,
                  styles.moneyInput,
                  { borderBottomColor: theme.line, color: theme.ink },
                ]}
              />
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.addWalletLabel')}
          onPress={() => onWalletsChange((current) => [...current, { name: '', balance: '' }])}
          style={[styles.addWallet, { borderBottomColor: theme.line }]}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {t('common.addWallet')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, paddingBottom: Spacing.four },
  walletList: { maxHeight: 350 },
  walletListContent: { paddingBottom: Spacing.two },
  walletItem: { paddingBottom: 16, paddingTop: 12 },
  walletItemActions: {
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  addWallet: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 15,
  },
  eyebrow: { ...Typography.eyebrow, marginBottom: 7 },
  title: { fontSize: 37, lineHeight: 40, letterSpacing: -1.48 },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
    marginTop: 17,
    maxWidth: 290,
  },
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 18,
    minHeight: 52,
    paddingHorizontal: 0,
  },
  moneyInputRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  moneyInput: { flex: 1 },
  balanceLabel: { marginTop: 25 },
});
