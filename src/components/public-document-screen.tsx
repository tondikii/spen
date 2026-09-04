import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import type { PublicDocument } from '@/lib/public-documents';

export default function PublicDocumentScreen({ document }: { document: PublicDocument }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.page}>
      <Head>
        <title>{`${document.title} | Spen`}</title>
        <meta name="description" content={document.summary} />
        <meta property="og:title" content={`${document.title} | Spen`} />
        <meta property="og:description" content={document.summary} />
      </Head>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>{document.eyebrow}</ThemedText>
            <ThemedText type="title" style={styles.title}>{document.title}</ThemedText>
            <ThemedText type="default" themeColor="muted" style={styles.summary}>{document.summary}</ThemedText>
          </View>
          <View style={[styles.draftNotice, { backgroundColor: theme.mint, borderColor: theme.line }]}>
            <ThemedText type="smallBold" themeColor="pine">Draf untuk ditinjau</ThemedText>
            <ThemedText type="small" themeColor="muted" style={styles.draftCopy}>Teks ini perlu ditinjau dan disetujui pemilik Spen sebelum rilis production.</ThemedText>
          </View>
          {document.sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <ThemedText type="sectionHeading" style={styles.sectionTitle}>{section.heading}</ThemedText>
              {section.paragraphs.map((paragraph) => <ThemedText key={paragraph} type="default" style={styles.paragraph}>{paragraph}</ThemedText>)}
            </View>
          ))}
          <View style={[styles.meta, { borderTopColor: theme.line }]}>
            <ThemedText type="small" themeColor="muted">Pemilik: {document.owner}</ThemedText>
            <ThemedText type="small" themeColor="muted">Kontak: {document.contact}</ThemedText>
            <ThemedText type="small" themeColor="muted">Berlaku sejak {document.effectiveDate}</ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: MaxContentWidth, paddingBottom: BottomTabInset + Spacing.four, paddingHorizontal: 21, paddingTop: Spacing.two, width: '100%' },
  header: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.three },
  eyebrow: Typography.eyebrow,
  title: { marginTop: Spacing.one },
  summary: { lineHeight: 23 },
  draftNotice: { borderRadius: Radius.medium, borderWidth: 1, gap: Spacing.one, marginBottom: Spacing.five, padding: Spacing.three },
  draftCopy: { lineHeight: 17 },
  section: { gap: Spacing.two, marginBottom: Spacing.five },
  sectionTitle: { fontSize: 19, lineHeight: 24 },
  paragraph: { lineHeight: 24 },
  meta: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.one, paddingTop: Spacing.three },
});
