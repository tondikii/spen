import { StyleSheet, View } from 'react-native';
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

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, gap: Spacing.two, maxWidth: 430, padding: Spacing.four, width: '100%' },
  eyebrow: { fontFamily: Fonts.monoMedium, letterSpacing: 0.9, marginTop: Spacing.two },
  card: {
    alignItems: 'center',
    borderRadius: Radius.large,
    gap: Spacing.two,
    marginTop: Spacing.five,
    padding: Spacing.five,
  },
  dot: { borderRadius: Radius.pill, height: 12, marginBottom: Spacing.one, width: 12 },
  description: { fontFamily: Fonts.sans, lineHeight: 22, textAlign: 'center' },
});
