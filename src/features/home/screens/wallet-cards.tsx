import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BoxedCard } from '@/components/ui/ui-primitives';
import { MotionChevron, MotionCollapsible, MotionPressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Fonts, Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/utils/money';
import type { Wallet } from '@/types/domain';

export function WalletCards({
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
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.addWalletLabel')}
          hitSlop={8}
          onPress={onAdd}
          wrapperStyle={styles.sectionAction}
        >
          <ThemedText type="smallBold" themeColor="pine" numberOfLines={1}>
            {t('common.addWalletLabel')}
          </ThemedText>
        </MotionPressable>
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

const styles = StyleSheet.create({
  walletSection: { marginBottom: Spacing.six },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionAction: { flexShrink: 0 },
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
  archivedList: { borderTopWidth: StyleSheet.hairlineWidth },
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
  walletList: { marginTop: 0 },
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
});
