import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CreateTransactionScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.page}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.two) }]}>
        <Pressable accessibilityLabel="Tutup" accessibilityRole="button" onPress={() => router.back()} style={styles.close}>
          <ThemedText type="subtitle" themeColor="pine">×</ThemedText>
        </Pressable>
        <ThemedText type="sectionHeading">Tambah Transaksi</ThemedText>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled">
        <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>TRANSAKSI BARU</ThemedText>
        <ThemedText type="title">Catat uangmu</ThemedText>
        <ThemedView type="card" style={styles.card}>
          <ThemedText type="subtitle">Form transaksi</ThemedText>
          <ThemedText themeColor="muted" style={styles.description}>
            Form keyboard-heavy untuk mencatat income, expense, atau Transfer akan hadir di sini.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  close: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  headerSpacer: { width: 44 },
  content: { gap: Spacing.two, padding: Spacing.four },
  eyebrow: { fontFamily: Fonts.monoMedium, letterSpacing: 0.9, marginTop: Spacing.two },
  card: { borderRadius: Radius.large, gap: Spacing.two, marginTop: Spacing.five, padding: Spacing.five },
  description: { fontFamily: Fonts.sans, lineHeight: 22 },
});
