import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/feedback/empty-state';
import { ThemedView } from '@/components/ui/themed-view';

export default function NotFoundRoute() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <ThemedView style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          boxed
          glyph="?"
          title={t('common.screenNotFound')}
          description={t('common.screenNotFoundCopy')}
          actionLabel={t('common.goHome')}
          onAction={() => router.replace('/')}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center' },
});
