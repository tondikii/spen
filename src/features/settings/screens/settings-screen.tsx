import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpenLogo } from '@/components/ui/brand-assets';
import { CurrencyPicker } from '@/components/ui/currency-picker';
import { LanguagePicker } from '@/components/ui/language-picker';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { BoxedCard, PageHeader } from '@/components/ui/ui-primitives';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useAppTheme } from '@/providers/theme-provider';
import { BottomTabInset, Fonts, Typography } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createBackupFile,
  getPublicDocumentUrl,
  pickBackupContent,
  restoreDatabase,
  setDatabaseCurrency,
  setDatabaseLocale,
  shareBackupFile,
} from '@/features/settings';
import {
  getSelectedCurrency,
  getSelectedLocale,
  setSelectedCurrency,
  setSelectedLocale,
} from '@/utils/selection';
import type { CurrencyCode, Locale } from '@/types/domain';
import { changeLocale } from '@/i18n';
import { getErrorTranslationKey } from '@/utils/app-error';
import {
  MotionChevron,
  MotionCollapsible,
  MotionPressable,
  MotionScreen,
  MotionSwitch,
} from '@/components/ui/motion';

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
  const [languageOpen, setLanguageOpen] = useState(false);
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
      setLanguageOpen(false);
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
            <BoxedCard style={styles.group}>
              <SettingRow
                icon="☼"
                iconStyle={styles.themeIcon}
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
            </BoxedCard>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.preferences')}
            </ThemedText>
            <BoxedCard style={styles.group}>
              <SettingRow
                icon="文"
                iconStyle={styles.smallIcon}
                title={t('common.language')}
                detail={t('common.chooseLanguage')}
              >
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.chooseLanguage')}
                  accessibilityState={{ expanded: languageOpen }}
                  onPress={() => setLanguageOpen((open) => !open)}
                  style={[styles.dropdown, { borderColor: theme.line }]}
                >
                  <ThemedText type="smallBold" themeColor="pine">
                    {locale.toUpperCase()}
                  </ThemedText>
                  <MotionChevron expanded={languageOpen} color={theme.pine} size={16} />
                </MotionPressable>
              </SettingRow>
              {languageOpen && (
                <MotionCollapsible>
                  <LanguagePicker
                    selected={locale}
                    onSelect={(option) => void chooseLocale(option)}
                    withTopBorder
                  />
                </MotionCollapsible>
              )}
              <SettingRow
                icon="$"
                iconStyle={styles.currencyIcon}
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
                  <CurrencyPicker
                    selected={currency}
                    onSelect={(option) => void chooseCurrency(option)}
                    withTopBorder
                  />
                </MotionCollapsible>
              )}
            </BoxedCard>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.data')}
            </ThemedText>
            <BoxedCard style={styles.group}>
              <ActionRow
                icon="↓"
                iconStyle={styles.dataIcon}
                title={t('common.backupData')}
                detail={busy ? t('common.preparingFile') : t('common.saveDataCopy')}
                onPress={() => {
                  void runBackup();
                }}
              />
              <ActionRow
                icon="↑"
                iconStyle={styles.dataIcon}
                title={t('common.restoreData')}
                detail={busy ? t('common.processingFile') : t('common.overwriteFromBackup')}
                onPress={() => {
                  void runRestore();
                }}
              />
            </BoxedCard>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.help')}
            </ThemedText>
            <BoxedCard style={styles.group}>
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
            </BoxedCard>
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
              cancelLabel={t('common.cancel')}
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
  iconStyle,
  title,
  detail,
  children,
}: {
  icon: string;
  iconStyle?: TextStyle;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.line }]}>
      <View style={[styles.icon, { backgroundColor: theme.mint }]}>
        <ThemedText style={[styles.iconGlyph, iconStyle]} themeColor="pine">
          {icon}
        </ThemedText>
      </View>
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
  iconStyle,
  title,
  detail,
  onPress,
}: {
  icon: string;
  iconStyle?: TextStyle;
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
      <View style={[styles.icon, { backgroundColor: theme.mint }]}>
        <ThemedText style={[styles.iconGlyph, iconStyle]} themeColor="pine">
          {icon}
        </ThemedText>
      </View>
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
  group: { borderRadius: 19, overflow: 'hidden' },
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
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  iconGlyph: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    lineHeight: 35,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  smallIcon: { fontSize: 12, lineHeight: 24 },
  themeIcon: { transform: [{ translateY: -3 }] },
  currencyIcon: { fontSize: 15 },
  dataIcon: { transform: [{ translateY: -3 }] },
  copy: { flex: 1 },
  rowTitle: { fontSize: 12, lineHeight: 16 },
  rowDetail: { fontSize: 10, lineHeight: 14 },
  chevron: { fontSize: 22, lineHeight: 26 },
  dropdown: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
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
