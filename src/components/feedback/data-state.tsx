import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { PrimaryButton } from '@/components/ui/ui-primitives';

export function DataState({
  kind,
  title,
  description,
  onRetry,
}: {
  kind: 'loading' | 'error' | 'empty';
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  if (kind === 'loading') return null;
  return (
    <View style={styles.state}>
      <View style={[styles.stateGlyph, { backgroundColor: theme.mint }]}>
        <ThemedText style={{ color: kind === 'error' ? theme.expense : theme.pine, fontSize: 28 }}>
          {kind === 'error' ? '!' : '◌'}
        </ThemedText>
      </View>
      <ThemedText type="sectionHeading">{title}</ThemedText>
      <ThemedText type="small" themeColor="muted" style={styles.stateDescription}>
        {description}
      </ThemedText>
      {onRetry && (
        <PrimaryButton
          label={t('common.retry')}
          onPress={onRetry}
          accessibilityLabel={t('common.retry')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    maxWidth: 430,
    padding: 21,
    width: '100%',
  },
  stateGlyph: {
    alignItems: 'center',
    borderRadius: Radius.large,
    height: 70,
    justifyContent: 'center',
    marginBottom: Spacing.two,
    width: 70,
  },
  stateDescription: { lineHeight: 21, maxWidth: 280, textAlign: 'center' },
});
