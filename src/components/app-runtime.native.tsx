import { DarkTheme, DefaultTheme, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import AppTabs from '@/components/app-tabs';
import { SetupWizard } from '@/components/setup-wizard';
import { AppThemeProvider, useAppTheme } from '@/components/theme-provider';
import PublicDocumentScreen from '@/components/public-document-screen';
import { SpenSplash } from '@/components/brand-assets';
import { completeSetup, getSetupState } from '@/services/setup-service';
import { getDatabaseSettings, setSelectedCurrency, setDatabaseThemeMode } from '@/services/settings-service';
import { retryDatabaseRead } from '@/services/database-read-retry';
import { configureDatabase } from '../../db/database';
import { seedDefaultCategories } from '../../db/seed';
import migrations from '../../drizzle/migrations';
import { privacyDocument, termsDocument } from '@/lib/public-documents';

function AppNavigation({ initialSetupComplete }: { initialSetupComplete: boolean }) {
  const { colorScheme } = useAppTheme();
  const sqlite = useSQLiteContext();
  const [setupComplete, setSetupComplete] = useState(initialSetupComplete);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {setupComplete ? <AppTabs /> : <SetupWizard onComplete={async (wallets, currency) => { await completeSetup(sqlite, wallets, currency); setSetupComplete(true); }} />}
    </ThemeProvider>
  );
}

function DatabaseGate({ onFatalError }: { onFatalError: (message: string) => void }) {
  const sqlite = useSQLiteContext();
  const database = useMemo(() => drizzle(sqlite), [sqlite]);
  const { success, error } = useMigrations(database, migrations);
  const [seeded, setSeeded] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light');
  const [startupSplash, setStartupSplash] = useState(true);

  useEffect(() => {
    if (!success) return;

    let cancelled = false;
    void seedDefaultCategories(sqlite).then(async () => {
      const [setup, settings] = await retryDatabaseRead(() => Promise.all([getSetupState(sqlite), getDatabaseSettings(sqlite)]));
      setSelectedCurrency(setup.currency);
      setThemeMode(settings.themeMode as 'system' | 'light' | 'dark');
      if (!cancelled) {
        setSetupComplete(setup.hasWallet);
        setSeeded(true);
      }
    }).catch((cause) => { if (!cancelled) onFatalError(cause instanceof Error ? cause.message : 'Database gagal disiapkan.'); });
    return () => {
      cancelled = true;
    };
  }, [onFatalError, sqlite, success]);

  useEffect(() => {
    if (error) { onFatalError(error.message); return; }
    if (!success || !seeded) return;
    void SplashScreen.hideAsync();
    const timer = setTimeout(() => setStartupSplash(false), 900);
    return () => clearTimeout(timer);
  }, [error, onFatalError, seeded, success]);

  if (!success || !seeded || startupSplash) return <View style={styles.splash}><SpenSplash /></View>;
  return <AppThemeProvider initialMode={themeMode} onModeChange={(mode) => setDatabaseThemeMode(sqlite, mode)}><AppNavigation initialSetupComplete={setupComplete} /></AppThemeProvider>;
}

function DatabaseErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.error}><Text style={styles.errorGlyph}>!</Text><Text style={styles.errorTitle}>Spen belum siap</Text><Text style={styles.errorCopy}>{message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Coba lagi database" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable></View>;
}

function PublicDocumentRoute() {
  const pathname = usePathname();
  const router = useRouter();
  const document = pathname === termsDocument.path ? termsDocument : privacyDocument;
  return <AppThemeProvider><PublicDocumentScreen document={document} onBack={() => router.back()} /></AppThemeProvider>;
}

export default function AppRuntime() {
  const pathname = usePathname();
  const [databaseAttempt, setDatabaseAttempt] = useState(0);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const handleDatabaseError = useCallback((message: string) => { void SplashScreen.hideAsync(); setDatabaseError(message); }, []);
  const retryDatabase = useCallback(() => { setDatabaseError(null); setDatabaseAttempt((attempt) => attempt + 1); }, []);

  if (pathname === termsDocument.path || pathname === privacyDocument.path) return <PublicDocumentRoute />;
  if (databaseError) return <DatabaseErrorState message={databaseError} onRetry={retryDatabase} />;
  return <SQLiteProvider key={databaseAttempt} databaseName="spen.db" onInit={configureDatabase} onError={(error) => handleDatabaseError(error.message)}><DatabaseGate onFatalError={handleDatabaseError} /></SQLiteProvider>;
}

const styles = StyleSheet.create({
  splash: { backgroundColor: '#F6F5F0', flex: 1 },
  error: { alignItems: 'center', backgroundColor: '#F6F5F0', flex: 1, justifyContent: 'center', padding: 32 },
  errorGlyph: { alignItems: 'center', backgroundColor: '#F9E4E0', borderRadius: 32, color: '#C85C55', fontSize: 28, height: 64, lineHeight: 64, marginBottom: 16, textAlign: 'center', width: 64 },
  errorTitle: { color: '#213431', fontFamily: 'Fraunces_600SemiBold', fontSize: 22, marginBottom: 8 },
  errorCopy: { color: '#7B8882', fontFamily: 'NunitoSans_400Regular', lineHeight: 21, textAlign: 'center' },
  retry: { backgroundColor: '#235B50', borderRadius: 14, marginTop: 18, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: '#F6FAF4', fontFamily: 'NunitoSans_700Bold', fontSize: 12 },
});
