import type { SQLiteDatabase } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { MotionScreen } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { PageHeader } from '@/components/ui/ui-primitives';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, Typography } from '@/theme';

import {
  AppearanceSection,
  DataSection,
  HelpSection,
  PreferencesSection,
  SettingsFooter,
} from '../components/settings-sections';
import { useSettingsScreen } from '../components/use-settings-screen';

export default function SettingsScreen({
  database,
  onFaqPress,
}: { database?: SQLiteDatabase; onFaqPress?: () => void } = {}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    busy,
    chooseCurrency,
    chooseLocale,
    confirmRestore,
    currency,
    currencyOpen,
    languageOpen,
    locale,
    openLink,
    restoreFile,
    runBackup,
    runRestore,
    setCurrencyOpen,
    setLanguageOpen,
    setRestoreFile,
    toast,
  } = useSettingsScreen({ database });

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <PageHeader eyebrow={t('common.settings').toUpperCase()} title={t('common.settings')} />
            <AppearanceSection busy={busy} />
            <PreferencesSection
              currency={currency}
              currencyOpen={currencyOpen}
              languageOpen={languageOpen}
              locale={locale}
              onSelectCurrency={(option) => void chooseCurrency(option)}
              onSelectLocale={(option) => void chooseLocale(option)}
              onToggleCurrency={() => setCurrencyOpen((open) => !open)}
              onToggleLanguage={() => setLanguageOpen((open) => !open)}
            />
            <DataSection
              busy={busy}
              onBackup={() => {
                void runBackup();
              }}
              onRestore={() => {
                void runRestore();
              }}
            />
            <HelpSection
              onFaqPress={onFaqPress}
              onOpenLink={(url) => {
                void openLink(url);
              }}
            />
            <SettingsFooter />
            <ConfirmationModal
              visible={restoreFile !== null}
              title={t('common.overwriteAllData')}
              message={t('common.restoreWarning')}
              confirmLabel={t('common.restoreData')}
              cancelLabel={t('common.cancel')}
              destructive
              onCancel={() => setRestoreFile(null)}
              onConfirm={() => {
                void confirmRestore();
              }}
            />
          </ScrollView>
          {toast && (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.toast, { backgroundColor: theme.ink }]}
            >
              <ThemedText type="small" style={{ color: theme.background }}>
                ✓ {toast}
              </ThemedText>
            </View>
          )}
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
    maxWidth: 430,
    paddingBottom: BottomTabInset + 24,
    paddingHorizontal: 21,
    paddingTop: 24,
    width: '100%',
  },
  header: { marginBottom: 26, marginTop: 4 },
  eyebrow: { marginBottom: 4, ...Typography.eyebrow },
  toast: {
    alignSelf: 'center',
    borderRadius: 12,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'absolute',
  },
});
