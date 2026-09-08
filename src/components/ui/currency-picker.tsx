import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CURRENCY_SYMBOLS } from '@/components/ui/currency-mark';
import { MotionPressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Fonts } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { currencyOptions } from '@/utils/selection';
import type { CurrencyCode } from '@/types/domain';

export function CurrencyPicker({
  selected,
  onSelect,
  withTopBorder = false,
}: {
  selected: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
  withTopBorder?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.grid,
        withTopBorder && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {currencyOptions.map((option) => (
        <MotionPressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={t('common.chooseCurrencyOption', { currency: option })}
          onPress={() => onSelect(option)}
          wrapperStyle={styles.currencyWrapper}
          style={[
            styles.currency,
            {
              borderColor: selected === option ? theme.pine : theme.line,
              backgroundColor: selected === option ? theme.mint : theme.card,
            },
          ]}
        >
          <ThemedText
            style={styles.currencySymbol}
            themeColor={selected === option ? 'pine' : 'muted'}
          >
            {CURRENCY_SYMBOLS[option]}
          </ThemedText>
          <ThemedText type="smallBold" themeColor={selected === option ? 'pine' : 'ink'}>
            {option}
          </ThemedText>
        </MotionPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    padding: 13,
    rowGap: 8,
  },
  currencyWrapper: { width: '22.5%' },
  currency: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
  },
  currencySymbol: { fontFamily: Fonts.mono, fontSize: 11 },
});
