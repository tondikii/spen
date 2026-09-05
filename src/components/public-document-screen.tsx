import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import type { PublicDocument } from '@/lib/public-documents';
import { getLocalizedPublicDocument } from '@/lib/public-documents';
import { MotionScreen } from '@/components/motion';
import { useTranslation } from 'react-i18next';

export default function PublicDocumentScreen({ document }: { document: PublicDocument }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const localizedDocument = getLocalizedPublicDocument(
    document,
    i18n.language === 'en' ? 'en' : 'id',
  );

  return (
    <ThemedView style={styles.page}>
      <Head>
        <title>{`${localizedDocument.title} | Spen`}</title>
        <meta name="description" content={localizedDocument.summary} />
        <meta property="og:title" content={`${localizedDocument.title} | Spen`} />
        <meta property="og:description" content={localizedDocument.summary} />
      </Head>
      <MotionScreen>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                {localizedDocument.eyebrow}
              </ThemedText>
              <ThemedText type="title" style={styles.title}>
                {localizedDocument.title}
              </ThemedText>
              <ThemedText type="default" themeColor="muted" style={styles.summary}>
                {localizedDocument.summary}
              </ThemedText>
            </View>
            <View
              style={[styles.draftNotice, { backgroundColor: theme.mint, borderColor: theme.line }]}
            >
              <ThemedText type="smallBold" themeColor="pine">
                {t('common.draftForReview')}
              </ThemedText>
              <ThemedText type="small" themeColor="muted" style={styles.draftCopy}>
                {t('common.draftCopy')}
              </ThemedText>
            </View>
            {document.sections.map((section) => (
              <View key={section.heading} style={styles.section}>
                <ThemedText type="sectionHeading" style={styles.sectionTitle}>
                  {section.heading}
                </ThemedText>
                {section.paragraphs.map((paragraph) => (
                  <ThemedText key={paragraph} type="default" style={styles.paragraph}>
                    {paragraph}
                  </ThemedText>
                ))}
              </View>
            ))}
            <View style={[styles.meta, { borderTopColor: theme.line }]}>
              <ThemedText type="small" themeColor="muted">
                {t('common.owner')}: {document.owner}
              </ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.contact')}: {document.contact}
              </ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.effectiveSince')} {document.effectiveDate}
              </ThemedText>
            </View>
          </ScrollView>
        </SafeAreaView>
      </MotionScreen>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    alignSelf: 'center',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: 21,
    paddingTop: Spacing.two,
    width: '100%',
  },
  header: { gap: Spacing.two, paddingBottom: Spacing.four, paddingTop: Spacing.three },
  eyebrow: Typography.eyebrow,
  title: { marginTop: Spacing.one },
  summary: { lineHeight: 23 },
  draftNotice: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    gap: Spacing.one,
    marginBottom: Spacing.five,
    padding: Spacing.three,
  },
  draftCopy: { lineHeight: 17 },
  section: { gap: Spacing.two, marginBottom: Spacing.five },
  sectionTitle: { fontSize: 19, lineHeight: 24 },
  paragraph: { lineHeight: 24 },
  meta: { borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.one, paddingTop: Spacing.three },
});
