import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpenLogo } from '@/components/brand-assets';
import { CurrencyPicker } from '@/components/currency-picker';
import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BoxedCard, PageHeader } from '@/components/ui-primitives';
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
  getSelectedCurrency,
  getSelectedLocale,
  getDatabaseSettings,
  getReminderSettings,
  isValidReminderTime,
  setDatabaseReminderSettings,
  setReminderSettings,
  setDatabaseLocale,
  setSelectedLocale,
  setDatabaseCurrency,
  setSelectedCurrency,
} from '@/services/settings-service';
import type { CurrencyCode, Locale, ReminderSettings } from '@/types/domain';
import {
  cancelAllReminderNotifications,
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
  type NotificationPermissionStatus,
} from '@/services/notification-service';
import { reconcileAllReminders } from '@/services/reminder-reconciler';
import { ThemedInput } from '@/components/themed-input';
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
  const [reminders, setReminders] = useState<ReminderSettings>(getReminderSettings());
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [reminderTimeDraft, setReminderTimeDraft] = useState(reminders.transactionReminderTime);
  const dark = mode === 'dark';
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const settings = database ? await getDatabaseSettings(database) : getReminderSettings();
        const permission = await getNotificationPermissionStatus();
        if (cancelled) return;
        const next: ReminderSettings = {
          remindersEnabled: settings.remindersEnabled,
          transactionReminderEnabled: settings.transactionReminderEnabled,
          periodReminderEnabled: settings.periodReminderEnabled,
          goalReminderEnabled: settings.goalReminderEnabled,
          transactionReminderTime: settings.transactionReminderTime,
          notificationPermissionRequested: settings.notificationPermissionRequested,
        };
        setReminders(next);
        setReminderTimeDraft(next.transactionReminderTime);
        setPermissionStatus(permission);
      } catch {
        if (!cancelled) showToast(t('errors.storage'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [database, t]);

  const persistReminders = async (next: ReminderSettings) => {
    try {
      let permission = permissionStatus;
      let settings = next;
      const wantsPermission =
        next.remindersEnabled &&
        (next.transactionReminderEnabled || next.periodReminderEnabled || next.goalReminderEnabled);
      if (wantsPermission && !next.notificationPermissionRequested) {
        permission = await getNotificationPermissionStatus();
        if (permission !== 'granted') {
          permission = await requestNotificationPermission();
        }
        settings = { ...settings, notificationPermissionRequested: true };
      } else if (wantsPermission && permission === 'granted') {
        settings = { ...settings, notificationPermissionRequested: true };
      }
      if (!settings.remindersEnabled) await cancelAllReminderNotifications();
      const saved = database
        ? await setDatabaseReminderSettings(database, settings)
        : setReminderSettings(settings);
      setReminders(saved);
      setReminderTimeDraft(saved.transactionReminderTime);
      setPermissionStatus(permission);
      if (database) void reconcileAllReminders(database).catch(() => undefined);
    } catch {
      showToast(t('errors.storage'));
    }
  };

  const toggleReminder = (key: keyof ReminderSettings, value: boolean) => {
    const next = { ...reminders, [key]: value } as ReminderSettings;
    if (key !== 'remindersEnabled' && value) next.remindersEnabled = true;
    void persistReminders(next);
  };

  const saveReminderTime = () => {
    if (!isValidReminderTime(reminderTimeDraft)) {
      setReminderTimeDraft(reminders.transactionReminderTime);
      return;
    }
    void persistReminders({ ...reminders, transactionReminderTime: reminderTimeDraft });
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
      if (database) void reconcileAllReminders(database).catch(() => undefined);
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
            <BoxedCard
              style={styles.group}
            >
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
            <BoxedCard
              style={styles.group}
            >
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
              {t('common.reminders')}
            </ThemedText>
            <BoxedCard style={styles.group}>
              <SettingRow
                icon="i"
                title={t('common.remindersMaster')}
                detail={t('common.remindersMasterDetail')}
              >
                <MotionSwitch
                  accessibilityLabel={t('common.remindersMaster')}
                  activeTrackColor={theme.pine}
                  inactiveTrackColor={theme.line}
                  value={reminders.remindersEnabled}
                  onChange={(next) => toggleReminder('remindersEnabled', next)}
                  disabled={busy}
                />
              </SettingRow>
              <SettingRow
                icon="+"
                title={t('common.transactionReminder')}
                detail={t('common.transactionReminderDetail')}
              >
                <MotionSwitch
                  accessibilityLabel={t('common.transactionReminder')}
                  activeTrackColor={theme.pine}
                  inactiveTrackColor={theme.line}
                  value={reminders.transactionReminderEnabled}
                  onChange={(next) => toggleReminder('transactionReminderEnabled', next)}
                  disabled={busy}
                />
              </SettingRow>
              <SettingRow
                icon="~"
                title={t('common.periodReminder')}
                detail={t('common.periodReminderDetail')}
              >
                <MotionSwitch
                  accessibilityLabel={t('common.periodReminder')}
                  activeTrackColor={theme.pine}
                  inactiveTrackColor={theme.line}
                  value={reminders.periodReminderEnabled}
                  onChange={(next) => toggleReminder('periodReminderEnabled', next)}
                  disabled={busy}
                />
              </SettingRow>
              <SettingRow
                icon="G"
                title={t('common.goalReminder')}
                detail={t('common.goalReminderDetail')}
              >
                <MotionSwitch
                  accessibilityLabel={t('common.goalReminder')}
                  activeTrackColor={theme.pine}
                  inactiveTrackColor={theme.line}
                  value={reminders.goalReminderEnabled}
                  onChange={(next) => toggleReminder('goalReminderEnabled', next)}
                  disabled={busy}
                />
              </SettingRow>
              <SettingRow
                icon="@"
                title={t('common.reminderTime')}
                detail={t('common.reminderTimeDetail')}
              >
                <ThemedInput
                  accessibilityLabel={t('common.reminderTime')}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onBlur={saveReminderTime}
                  onChangeText={setReminderTimeDraft}
                  style={styles.timeInput}
                  textAlign="center"
                  value={reminderTimeDraft}
                />
              </SettingRow>
              {permissionStatus === 'denied' && (
                <ActionRow
                  icon="!"
                  title={t('common.reminderPermissionDenied')}
                  detail={t('common.reminderPermissionDeniedDetail')}
                  onPress={() => {
                    void openNotificationSettings();
                  }}
                />
              )}
            </BoxedCard>
            <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
              {t('common.data')}
            </ThemedText>
            <BoxedCard
              style={styles.group}
            >
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
            <BoxedCard
              style={styles.group}
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
              destructive
              onCancel={() => setRestoreFile(null)}
              onConfirm={async () => {
                if (!database || !restoreFile) return;
                const file = restoreFile;
                setRestoreFile(null);
                setBusy(true);
                try {
                  const restoredLocale = await restoreDatabase(database, file.content);
                  const restoredSettings = await getDatabaseSettings(database);
                  setLocale(restoredLocale);
                  setCurrency(restoredSettings.currency);
                  setReminders(restoredSettings);
                  setReminderTimeDraft(restoredSettings.transactionReminderTime);
                  setSelectedLocale(restoredLocale);
                  setSelectedCurrency(restoredSettings.currency);
                  await changeLocale(restoredLocale);
                  await reconcileAllReminders(database).catch(() => undefined);
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
  timeInput: { fontFamily: Fonts.mono, fontSize: 12, minHeight: 36, paddingHorizontal: 8, width: 70 },
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
