import { Link, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import PublicDocumentScreen from '@/components/public-document-screen';
import { AppThemeProvider } from '@/components/theme-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { privacyDocument, termsDocument } from '@/lib/public-documents';

export default function AppRuntime() {
  const pathname = usePathname();

  if (pathname === termsDocument.path || pathname === privacyDocument.path) {
    const document = pathname === termsDocument.path ? termsDocument : privacyDocument;
    return <AppThemeProvider><PublicDocumentScreen document={document} /></AppThemeProvider>;
  }

  return <AppThemeProvider><ThemedView style={styles.page}><View style={styles.content}>
    <ThemedText type="code" themeColor="muted">SPEN WEB</ThemedText>
    <ThemedText type="title" style={styles.title}>Ruang untuk uangmu.</ThemedText>
    <ThemedText type="default" themeColor="muted" style={styles.copy}>Spen Web saat ini menyediakan dokumen publik. Data keuangan tetap dikelola di aplikasi.</ThemedText>
    <View style={styles.links}>
      <Link href="/terms"><ThemedText type="linkPrimary">Syarat &amp; Ketentuan</ThemedText></Link>
      <Link href="/privacy"><ThemedText type="linkPrimary">Kebijakan Privasi</ThemedText></Link>
    </View>
  </View></ThemedView></AppThemeProvider>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { alignSelf: 'center', gap: 16, maxWidth: 430, padding: 32, width: '100%' },
  title: { marginTop: 8 },
  copy: { lineHeight: 24 },
  links: { gap: 12, marginTop: 16 },
});
