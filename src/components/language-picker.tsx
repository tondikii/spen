import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MotionPressable } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Locale } from '@/types/domain';

const localeOptions: Locale[] = ['en', 'id'];
const languageNames: Record<Locale, string> = {
  en: 'English',
  id: 'Indonesian',
};

export function LanguagePicker({
  selected,
  onSelect,
  withTopBorder = false,
}: {
  selected: Locale;
  onSelect: (locale: Locale) => void;
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
      {localeOptions.map((option) => (
        <MotionPressable
          key={option}
          accessibilityRole="button"
          accessibilityLabel={t('common.selectLanguage', {
            language: languageNames[option],
          })}
          onPress={() => onSelect(option)}
          style={[
            styles.language,
            {
              borderColor: selected === option ? theme.pine : theme.line,
              backgroundColor: selected === option ? theme.mint : theme.card,
            },
          ]}
        >
          <ThemedText
            style={styles.languageCode}
            themeColor={selected === option ? 'pine' : 'muted'}
          >
            {option.toUpperCase()}
          </ThemedText>
          <ThemedText type="smallBold" themeColor={selected === option ? 'pine' : 'ink'}>
            {languageNames[option]}
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
    gap: 8,
    padding: 13,
  },
  language: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  languageCode: { fontFamily: Fonts.mono, fontSize: 11 },
});
