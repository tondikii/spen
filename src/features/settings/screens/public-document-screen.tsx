import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';

import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing } from '@/theme';
import type { PublicDocument } from '../content/public-documents';
import { getLocalizedPublicDocument } from '../content/public-documents';
import { MotionPressable as Pressable, MotionScreen } from '@/components/ui/motion';
import { useTranslation } from 'react-i18next';

export default function PublicDocumentScreen({
  document,
  onBack,
}: {
  document: PublicDocument;
  onBack?: () => void;
}) {
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
            {onBack ? (
              <Pressable
                accessibilityLabel={t('common.back')}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onBack}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}
              >
                <ThemedText style={styles.backIcon} themeColor="pine">
                  ‹
                </ThemedText>
                <ThemedText type="smallBold" themeColor="pine">
                  {t('common.back')}
                </ThemedText>
              </Pressable>
            ) : null}
            <View style={styles.header}>
              <ScreenHeader eyebrow={localizedDocument.eyebrow} title={localizedDocument.title} />
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
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.one,
    minHeight: 32,
  },
  backIcon: { fontFamily: Fonts.sans, fontSize: 28, lineHeight: 28 },
  pressed: { opacity: 0.7 },
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
