import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, type ThemeColor } from '@/theme';
import type { TransactionType } from '@/types/domain';

const tabs: { type: TransactionType; translationKey: string }[] = [
  { type: 'income', translationKey: 'common.income' },
  { type: 'expense', translationKey: 'common.expense' },
  { type: 'transfer', translationKey: 'categories.transfer' },
];

function tabAccent(type: TransactionType): ThemeColor {
  return type === 'income' ? 'income' : type === 'expense' ? 'expense' : 'pine';
}

/**
 * Tab tipe transaksi (Pemasukan/Pengeluaran/Transfer). Murni presentasional:
 * state tipe efektif dimiliki form induk, aksen warna mengikuti tipe tab.
 */
export function TransactionTypeTabs({
  effectiveType,
  onChangeType,
}: {
  effectiveType: TransactionType;
  onChangeType: (nextType: TransactionType) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.typeTabs, { borderBottomColor: theme.line }]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.type}
          wrapperStyle={styles.typeTabWrapper}
          accessibilityRole="tab"
          accessibilityLabel={t('common.transactionType', {
            type: t(tab.translationKey),
          })}
          accessibilityState={{ selected: effectiveType === tab.type }}
          accessibilityHint={t('common.transactionTypeHint')}
          onPress={() => onChangeType(tab.type)}
          style={[
            styles.typeTab,
            effectiveType === tab.type && { borderBottomColor: theme[tabAccent(tab.type)] },
          ]}
        >
          <ThemedText
            type="smallBold"
            themeColor={effectiveType === tab.type ? tabAccent(tab.type) : 'muted'}
          >
            {t(tab.translationKey)}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  typeTabs: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.four,
  },
  typeTabWrapper: { flex: 1 },
  typeTab: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flex: 1,
    paddingVertical: 11,
  },
});
