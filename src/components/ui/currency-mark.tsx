import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { getSelectedCurrency } from '@/utils/selection';
import type { CurrencyCode } from '@/types/domain';
import { ThemedText } from '@/components/ui/themed-text';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  SGD: 'S$',
  MYR: 'RM',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  SAR: '﷼',
  AED: 'د.إ',
};

export function CurrencyMark({ currency = getSelectedCurrency() }: { currency?: CurrencyCode }) {
  const theme = useTheme();
  return (
    <View style={[styles.mark, { backgroundColor: theme.mint }]}>
      <ThemedText type="smallBold" style={{ color: theme.pine }}>
        {CURRENCY_SYMBOLS[currency]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 31,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
});
