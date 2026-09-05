import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Card, PrimaryButton } from '@/components/ui-primitives';
import { MotionAnimatedView, motionPresets } from '@/components/motion';

export function ScreenSkeleton({ title, eyebrow }: { title: string; eyebrow: string }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <MotionAnimatedView entering={motionPresets.screenEntering} style={styles.content}>
          <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
          <ThemedText type="title">{title}</ThemedText>
          <Card style={styles.card}>
            <View style={[styles.dot, { backgroundColor: theme.pine }]} />
            <ThemedText type="subtitle">{t('common.comingSoon')}</ThemedText>
            <ThemedText themeColor="muted" style={styles.description}>
              {t('common.comingSoonCopy')}
            </ThemedText>
          </Card>
        </MotionAnimatedView>
      </SafeAreaView>
    </ThemedView>
  );
}

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
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: Spacing.two,
    maxWidth: 430,
    paddingHorizontal: 21,
    paddingTop: 28,
    paddingBottom: 40,
    width: '100%',
  },
  eyebrow: { fontFamily: Fonts.monoMedium, letterSpacing: 0.9, marginTop: Spacing.two },
  card: {
    alignItems: 'center',
    borderRadius: Radius.large,
    gap: Spacing.two,
    marginTop: Spacing.five,
    padding: Spacing.five,
  },
  dot: { borderRadius: Radius.pill, height: 12, marginBottom: Spacing.one, width: 12 },
  description: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, textAlign: 'center' },
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
  retry: { borderRadius: Radius.medium, paddingHorizontal: 20, paddingVertical: 13 },
});
