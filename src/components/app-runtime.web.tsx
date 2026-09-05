import { Link, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import PublicDocumentScreen from '@/components/public-document-screen';
import { AppThemeProvider } from '@/components/theme-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { privacyDocument, termsDocument } from '@/lib/public-documents';
import { getWebLocale } from '@/i18n/web';
import { changeLocale } from '@/i18n';

export default function AppRuntime() {
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    const locale = getWebLocale();
    void changeLocale(locale).then(() => {
      if (typeof document !== 'undefined') document.documentElement.lang = locale;
    });
  }, []);

  if (pathname === termsDocument.path || pathname === privacyDocument.path) {
    const document = pathname === termsDocument.path ? termsDocument : privacyDocument;
    return (
      <AppThemeProvider>
        <PublicDocumentScreen document={document} />
      </AppThemeProvider>
    );
  }

  return (
    <AppThemeProvider>
      <ThemedView style={styles.page}>
        <View style={styles.content}>
          <ThemedText type="code" themeColor="muted">
            {t('common.appWebEyebrow')}
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            {t('common.appWebTitle')}
          </ThemedText>
          <ThemedText type="default" themeColor="muted" style={styles.copy}>
            {t('common.appWebCopy')}
          </ThemedText>
          <View style={styles.links}>
            <Link href="/terms">
              <ThemedText type="linkPrimary">{t('common.terms')}</ThemedText>
            </Link>
            <Link href="/privacy">
              <ThemedText type="linkPrimary">{t('common.privacy')}</ThemedText>
            </Link>
          </View>
        </View>
      </ThemedView>
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { alignSelf: 'center', gap: 16, maxWidth: 430, padding: 32, width: '100%' },
  title: { marginTop: 8 },
  copy: { lineHeight: 24 },
  links: { gap: 12, marginTop: 16 },
});
