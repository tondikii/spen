import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { AppThemeProvider, useAppTheme } from '@/providers/theme-provider';
import { SpenSplash } from '@/components/ui/brand-assets';
import { getSetupState } from '@/features/setup';
import { getDatabaseSettings, setDatabaseThemeMode } from '@/features/settings';
import { setSelectedCurrency, setSelectedLocale } from '@/utils/selection';
import { retryDatabaseRead } from '@/utils/retry';
import { configureDatabase } from '@/db/client';
import { seedDefaultCategories } from '@/db/seed';
import migrations from '../../drizzle/migrations';
import i18n, { changeLocale } from '@/i18n';
import { MotionPressable } from '@/components/ui/motion';
import {
  addNotificationResponseListener,
  consumeLastNotificationResponseData,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  reconcileAllReminders,
  getReminderRoute,
} from '@/features/reminders';

// Wraps the root navigator in React Navigation's theme so native gestures and
// headers follow the app's color scheme.
function NavigationTheme({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useAppTheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}

function DatabaseGate({ onFatalError }: { onFatalError: () => void }) {
  const sqlite = useSQLiteContext();
  const database = useMemo(() => drizzle(sqlite), [sqlite]);
  const { success, error } = useMigrations(database, migrations);
  const [seeded, setSeeded] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light');
  const [startupSplash, setStartupSplash] = useState(true);
  const handledReminderRef = useRef<string | null>(null);

  useEffect(() => {
    const handleResponse = (data: Record<string, unknown>) => {
      const route = getReminderRoute(data);
      if (!route) return;
      const reminderId = typeof data.reminderId === 'string' ? data.reminderId : null;
      if (reminderId && handledReminderRef.current === reminderId) return;
      handledReminderRef.current = reminderId;
      if (route === '/plan' && data.reminderKind === 'goal-deadline') {
        const goalId = typeof data.goalId === 'string' ? data.goalId : undefined;
        router.push(
          goalId ? ({ pathname: '/plan', params: { goalId } } as never) : (route as never),
        );
        return;
      }
      router.push(route as never);
    };
    const subscription = addNotificationResponseListener(handleResponse);
    void consumeLastNotificationResponseData()
      .then((data) => {
        if (data) handleResponse(data);
      })
      .catch(() => undefined);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!success) return;

    let cancelled = false;
    void seedDefaultCategories(sqlite)
      .then(async () => {
        const [setup, settings] = await retryDatabaseRead(() =>
          Promise.all([getSetupState(sqlite), getDatabaseSettings(sqlite)]),
        );
        setSelectedCurrency(setup.currency);
        setSelectedLocale(settings.locale as 'id' | 'en');
        await changeLocale(settings.locale);
        setThemeMode(settings.themeMode as 'system' | 'light' | 'dark');
        const permission = await getNotificationPermissionStatus();
        if (permission === 'undetermined') await requestNotificationPermission();
        void reconcileAllReminders(sqlite).catch(() => undefined);
        if (!cancelled) setSeeded(true);
      })
      .catch(() => {
        if (!cancelled) onFatalError();
      });
    return () => {
      cancelled = true;
    };
  }, [onFatalError, sqlite, success]);

  useEffect(() => {
    if (error) {
      onFatalError();
      return;
    }
    if (!success || !seeded) return;
    void SplashScreen.hideAsync();
    const timer = setTimeout(() => setStartupSplash(false), 900);
    return () => {
      clearTimeout(timer);
    };
  }, [error, onFatalError, seeded, success]);

  if (!success || !seeded || startupSplash)
    return (
      <View style={styles.splash}>
        <SpenSplash />
      </View>
    );
  return (
    <AppThemeProvider
      initialMode={themeMode}
      onModeChange={(mode) => setDatabaseThemeMode(sqlite, mode)}
    >
      <I18nextProvider i18n={i18n}>
        <NavigationTheme>
          <Stack screenOptions={{ headerShown: false }} />
        </NavigationTheme>
      </I18nextProvider>
    </AppThemeProvider>
  );
}

function DatabaseErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.error}>
      <Text style={styles.errorGlyph}>!</Text>
      <Text style={styles.errorTitle}>{t('common.databaseNotReady')}</Text>
      <Text style={styles.errorCopy}>{t('errors.unknown')}</Text>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={t('common.retryDatabase')}
        onPress={onRetry}
        style={styles.retry}
      >
        <Text style={styles.retryText}>{t('common.retry')}</Text>
      </MotionPressable>
    </View>
  );
}

export default function AppRuntime() {
  const [databaseAttempt, setDatabaseAttempt] = useState(0);
  const [databaseError, setDatabaseError] = useState(false);
  const handleDatabaseError = useCallback(() => {
    void SplashScreen.hideAsync();
    setDatabaseError(true);
  }, []);
  const retryDatabase = useCallback(() => {
    setDatabaseError(false);
    setDatabaseAttempt((attempt) => attempt + 1);
  }, []);

  if (databaseError) return <DatabaseErrorState onRetry={retryDatabase} />;
  return (
    <SQLiteProvider
      key={databaseAttempt}
      databaseName="spen.db"
      onInit={configureDatabase}
      onError={() => handleDatabaseError()}
    >
      <DatabaseGate onFatalError={handleDatabaseError} />
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  splash: { backgroundColor: '#F6F5F0', flex: 1 },
  error: {
    alignItems: 'center',
    backgroundColor: '#F6F5F0',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  errorGlyph: {
    alignItems: 'center',
    backgroundColor: '#F9E4E0',
    borderRadius: 32,
    color: '#C85C55',
    fontSize: 28,
    height: 64,
    lineHeight: 64,
    marginBottom: 16,
    textAlign: 'center',
    width: 64,
  },
  errorTitle: {
    color: '#213431',
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    marginBottom: 8,
  },
  errorCopy: {
    color: '#7B8882',
    fontFamily: 'NunitoSans_400Regular',
    lineHeight: 21,
    textAlign: 'center',
  },
  retry: {
    backgroundColor: '#235B50',
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: { color: '#F6FAF4', fontFamily: 'NunitoSans_700Bold', fontSize: 12 },
});
