import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function ScreenSkeleton({ title, eyebrow }: { title: string; eyebrow: string }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
          <ThemedText type="title">{title}</ThemedText>
          <ThemedView type="card" style={styles.card}>
            <View style={[styles.dot, { backgroundColor: theme.pine }]} />
            <ThemedText type="subtitle">Segera hadir</ThemedText>
            <ThemedText themeColor="muted" style={styles.description}>
              Ruang ini sedang disiapkan untuk membantu mengatur uangmu dengan lebih tenang.
            </ThemedText>
          </ThemedView>
        </View>
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
  return (
    <View style={styles.state}>
      <View style={[styles.stateGlyph, { backgroundColor: theme.mint }]}>
        {kind === 'loading' ? (
          <ActivityIndicator color={theme.pine} />
        ) : (
          <ThemedText
            style={{ color: kind === 'error' ? theme.expense : theme.pine, fontSize: 28 }}
          >
            {kind === 'error' ? '!' : '◌'}
          </ThemedText>
        )}
      </View>
      <ThemedText type="sectionHeading">{title}</ThemedText>
      <ThemedText type="small" themeColor="muted" style={styles.stateDescription}>
        {description}
      </ThemedText>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba lagi"
          onPress={onRetry}
          style={[styles.retry, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            Coba lagi
          </ThemedText>
        </Pressable>
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
