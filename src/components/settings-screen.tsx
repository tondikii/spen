import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpenLogo } from '@/components/brand-assets';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PageHeader } from '@/components/ui-primitives';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { useAppTheme } from '@/components/theme-provider';
import { BottomTabInset, Fonts, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createBackupFile,
  pickBackupContent,
  restoreDatabase,
  shareBackupFile,
} from '@/services/backup-service';
import {
  currencyOptions,
  getSelectedCurrency,
  getSelectedLocale,
  setDatabaseLocale,
  setSelectedLocale,
  setDatabaseCurrency,
  setSelectedCurrency,
} from '@/services/settings-service';
import type { CurrencyCode, Locale } from '@/types/domain';
import { changeLocale } from '@/i18n';
import { getPublicDocumentUrl } from '@/lib/public-documents';
import { getErrorTranslationKey } from '@/lib/app-error';
import {
  MotionChevron,
  MotionCollapsible,
  MotionPressable,
  MotionScreen,
  MotionSwitch,
} from '@/components/motion';

const currencySymbols: Record<CurrencyCode, string> = {
  IDR: 'Rp',
  USD: '$',
  SGD: 'S$',
  MYR: 'RM',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  SAR: '﷼',
  AED: 'د.إ',
};

export default function SettingsScreen({
  database,
  onFaqPress,
}: { database?: SQLiteDatabase; onFaqPress?: () => void } = {}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, setMode } = useAppTheme();
  const [currency, setCurrency] = useState<CurrencyCode>(getSelectedCurrency());
  const [locale, setLocale] = useState<Locale>(getSelectedLocale());
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreFile, setRestoreFile] = useState<{ content: string; name: string } | null>(null);
  const dark = mode === 'dark';
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  const chooseCurrency = async (option: CurrencyCode) => {
    try {
      setCurrency(
        database ? await setDatabaseCurrency(database, option) : setSelectedCurrency(option),
      );
      setCurrencyOpen(false);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const chooseLocale = async (option: Locale) => {
    try {
      const next = database ? await setDatabaseLocale(database, option) : setSelectedLocale(option);
      setLocale(next);
      await changeLocale(next);
    } catch {
      showToast(t('errors.storage'));
    }
  };
  const runBackup = async () => {
    if (!database) {
      showToast(t('common.backupAvailableInMainApp'));
      return;
    }
    setBusy(true);
    try {
      await shareBackupFile(await createBackupFile(database));
      showToast(t('common.backupReady'));
    } catch {
      showToast(t('errors.storage'));
    } finally {
      setBusy(false);
    }
  };
  const runRestore = async () => {
    if (!database) {
      showToast(t('common.restoreAvailableInMainApp'));
      return;
    }
    setBusy(true);
    try {
      const picked = await pickBackupContent();
      setBusy(false);
      if (!picked) return;
      setRestoreFile(picked);
    } catch {
      setBusy(false);
      showToast(t('common.backupUnreadable'));
    }
  };
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showToast(t('common.pageCannotOpen'));
    }
  };

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <PageHeader eyebrow={t('common.settings').toUpperCase()} title={t('common.settings')} />
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.appearance')}
            </ThemedText>
            <ThemedView
              style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}
            >
              <SettingRow
                icon="☼"
                title={t('common.darkTheme')}
                detail={t('common.darkThemeDetail')}
              >
                <MotionSwitch
                  accessibilityLabel={t('common.darkTheme')}
                  activeTrackColor={theme.pine}
                  inactiveTrackColor={theme.line}
                  value={dark}
                  onChange={(next) => setMode(next ? 'dark' : 'light')}
                  disabled={busy}
                />
              </SettingRow>
            </ThemedView>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.preferences')}
            </ThemedText>
            <ThemedView
              style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}
            >
              <SettingRow
                icon="¤"
                title={t('common.currency')}
                detail={t('common.currencyUsedForWallets')}
              >
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.chooseCurrency')}
                  accessibilityState={{ expanded: currencyOpen }}
                  onPress={() => setCurrencyOpen((open) => !open)}
                  style={[styles.dropdown, { borderColor: theme.line }]}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    {currency}
                  </ThemedText>
                  <MotionChevron expanded={currencyOpen} color={theme.pine} size={16} />
                </MotionPressable>
              </SettingRow>
              {currencyOpen && (
                <MotionCollapsible>
                  <View style={[styles.currencyGrid, { borderTopColor: theme.line }]}>
                    {currencyOptions.map((option) => (
                      <MotionPressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.chooseCurrencyOption', { currency: option })}
                        onPress={() => {
                          void chooseCurrency(option);
                        }}
                        style={[
                          styles.currency,
                          {
                            borderColor: currency === option ? theme.pine : theme.line,
                            backgroundColor: currency === option ? theme.mint : theme.card,
                          },
                        ]}
                      >
                        <ThemedText
                          style={styles.currencySymbol}
                          themeColor={currency === option ? 'pine' : 'muted'}
                        >
                          {currencySymbols[option]}
                        </ThemedText>
                        <ThemedText
                          type="smallBold"
                          themeColor={currency === option ? 'pine' : 'ink'}
                        >
                          {option}
                        </ThemedText>
                      </MotionPressable>
                    ))}
                  </View>
                </MotionCollapsible>
              )}
              <SettingRow
                icon="文"
                title={t('common.language')}
                detail={t('common.chooseLanguage')}
              >
                <View style={styles.languageOptions}>
                  {(['id', 'en'] as Locale[]).map((option) => (
                    <MotionPressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.selectLanguage', {
                        language: option.toUpperCase(),
                      })}
                      onPress={() => void chooseLocale(option)}
                      style={[
                        styles.languageOption,
                        {
                          backgroundColor: locale === option ? theme.mint : theme.card,
                          borderColor: locale === option ? theme.pine : theme.line,
                        },
                      ]}
                    >
                      <ThemedText type="smallBold" themeColor={locale === option ? 'pine' : 'ink'}>
                        {option.toUpperCase()}
                      </ThemedText>
                    </MotionPressable>
                  ))}
                </View>
              </SettingRow>
            </ThemedView>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.data')}
            </ThemedText>
            <ThemedView
              style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}
            >
              <ActionRow
                icon="↓"
                title={t('common.backupData')}
                detail={busy ? t('common.preparingFile') : t('common.saveDataCopy')}
                onPress={() => {
                  void runBackup();
                }}
              />
              <ActionRow
                icon="↑"
                title={t('common.restoreData')}
                detail={busy ? t('common.processingFile') : t('common.overwriteFromBackup')}
                onPress={() => {
                  void runRestore();
                }}
              />
            </ThemedView>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.help')}
            </ThemedText>
            <ThemedView
              style={[styles.group, { backgroundColor: theme.card, borderColor: theme.line }]}
            >
              <ActionRow
                icon="?"
                title={t('common.faq')}
                detail={t('common.faqDetail')}
                onPress={onFaqPress ?? (() => undefined)}
              />
              <ActionRow
                icon="!"
                title={t('common.reportProblem')}
                detail={t('common.reportProblemDetail')}
                onPress={() => {
                  void openLink(
                    `mailto:tondikiag30@gmail.com?subject=${encodeURIComponent(t('common.reportProblem'))}`,
                  );
                }}
              />
              <ActionRow
                icon="›"
                title={t('common.terms')}
                detail={t('common.readTerms')}
                onPress={() => {
                  void openLink(getPublicDocumentUrl('/terms'));
                }}
              />
              <ActionRow
                icon="›"
                title={t('common.privacy')}
                detail={t('common.readPrivacy')}
                onPress={() => {
                  void openLink(getPublicDocumentUrl('/privacy'));
                }}
              />
            </ThemedView>
            <View style={styles.footer}>
              <SpenLogo size={42} />
              <ThemedText type="smallBold" themeColor="muted">
                Spen
              </ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.version')}{' '}
                {Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0'}
              </ThemedText>
            </View>
            <ConfirmationModal
              visible={restoreFile !== null}
              title={t('common.overwriteAllData')}
              message={t('common.restoreWarning')}
              confirmLabel={t('common.restoreData')}
              destructive
              onCancel={() => setRestoreFile(null)}
              onConfirm={async () => {
                if (!database || !restoreFile) return;
                const file = restoreFile;
                setRestoreFile(null);
                setBusy(true);
                try {
                  const restoredLocale = await restoreDatabase(database, file.content);
                  setLocale(restoredLocale);
                  setSelectedLocale(restoredLocale);
                  await changeLocale(restoredLocale);
                  showToast(t('common.restored'));
                } catch (cause) {
                  showToast(t(getErrorTranslationKey(cause)));
                } finally {
                  setBusy(false);
                }
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

function SettingRow({
  icon,
  title,
  detail,
  children,
}: {
  icon: string;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.line }]}>
      <ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>
        {icon}
      </ThemedText>
      <View style={styles.copy}>
        <ThemedText type="smallBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.rowDetail}>
          {detail}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}
function ActionRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.line },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText style={[styles.icon, { backgroundColor: theme.mint, color: theme.pine }]}>
        {icon}
      </ThemedText>
      <View style={styles.copy}>
        <ThemedText type="smallBold" style={styles.rowTitle}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="muted" style={styles.rowDetail}>
          {detail}
        </ThemedText>
      </View>
      <ThemedText style={styles.chevron} themeColor="muted">
        ›
      </ThemedText>
    </MotionPressable>
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
  groupLabel: { marginBottom: 8, marginTop: 18 },
  group: { borderRadius: 19, borderWidth: 1, overflow: 'hidden' },
  row: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 10,
    fontFamily: Fonts.mono,
    fontSize: 12,
    height: 31,
    justifyContent: 'center',
    textAlign: 'center',
    width: 31,
  },
  copy: { flex: 1 },
  rowTitle: { fontSize: 12, lineHeight: 16 },
  rowDetail: { fontSize: 10, lineHeight: 14 },
  chevron: { fontSize: 22, lineHeight: 26 },
  toggle: { borderRadius: Radius.pill, height: 22, padding: 3, width: 37 },
  toggleKnob: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, height: 16, width: 16 },
  dropdown: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  currencyGrid: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 13,
  },
  languageOptions: { flexDirection: 'row', gap: 8 },
  languageOption: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  currency: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  currencySymbol: { fontFamily: Fonts.mono, fontSize: 11 },
  footer: { alignItems: 'center', gap: 4, marginTop: 53 },
  toast: {
    alignSelf: 'center',
    borderRadius: 12,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'absolute',
  },
  pressed: { opacity: 0.7 },
});
