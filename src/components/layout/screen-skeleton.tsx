import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Fonts, Radius, Spacing } from '@/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BoxedCard } from '@/components/ui/ui-primitives';
import { MotionAnimatedView, motionPresets } from '@/components/ui/motion';

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
          <BoxedCard style={styles.card}>
            <View style={[styles.dot, { backgroundColor: theme.pine }]} />
            <ThemedText type="subtitle">{t('common.comingSoon')}</ThemedText>
            <ThemedText themeColor="muted" style={styles.description}>
              {t('common.comingSoonCopy')}
            </ThemedText>
          </BoxedCard>
        </MotionAnimatedView>
      </SafeAreaView>
    </ThemedView>
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
});
