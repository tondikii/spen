import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { MotionScreen } from '@/components/ui/motion';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset } from '@/theme';
import type { CurrencyCode, Locale } from '@/types/domain';

import {
  AppearanceSection,
  DataSection,
  HelpSection,
  PreferencesSection,
  SettingsFooter,
} from '../components/settings-sections';
import { useSettingsScreen, type RestorePick } from '../components/use-settings-screen';

export type SettingsScreenProps = {
  currency: CurrencyCode;
  locale: Locale;
  onCurrencyChange: (option: CurrencyCode) => void | Promise<void>;
  onLocaleChange: (option: Locale) => void | Promise<void>;
  onBackup: () => void | Promise<void>;
  onPickRestore: () => Promise<RestorePick | null>;
  onConfirmRestore: (content: string) => void | Promise<void>;
  onOpenLink: (url: string) => void | Promise<void>;
  onFaqPress: () => void;
};

export default function SettingsScreen({
  currency,
  locale,
  onBackup,
  onConfirmRestore,
  onCurrencyChange,
  onFaqPress,
  onLocaleChange,
  onOpenLink,
  onPickRestore,
}: SettingsScreenProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    busy,
    chooseCurrency,
    chooseLocale,
    confirmRestore,
    currencyOpen,
    languageOpen,
    openLink,
    restoreFile,
    runBackup,
    runRestore,
    setCurrencyOpen,
    setLanguageOpen,
    setRestoreFile,
    toast,
  } = useSettingsScreen({
    onBackup,
    onConfirmRestore,
    onCurrencyChange,
    onLocaleChange,
    onOpenLink,
    onPickRestore,
  });

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ScreenHeader title={t('common.settings')} style={styles.settingsHeader} />
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
  settingsHeader: {
    marginBottom: 4,
  },
  toast: {
    alignSelf: 'center',
    borderRadius: 12,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'absolute',
  },
});
