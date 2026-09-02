import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from '@expo-google-fonts/nunito-sans';

import AppTabs from '@/components/app-tabs';
import { SetupWizard } from '@/components/setup-wizard';
import { AppThemeProvider, useAppTheme } from '@/components/theme-provider';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { configureDatabase } from '../../db/database';
import { seedDefaultCategories } from '../../db/seed';
import { completeSetup, getSetupState } from '@/services/setup-service';
import { getDatabaseSettings, setSelectedCurrency, setDatabaseThemeMode } from '@/services/settings-service';

function AppNavigation({ initialSetupComplete }: { initialSetupComplete: boolean }) {
  const { colorScheme } = useAppTheme();
  const sqlite = useSQLiteContext();
  const [setupComplete, setSetupComplete] = useState(initialSetupComplete);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {setupComplete ? <AppTabs /> : <SetupWizard onComplete={async (name, balance, currency) => { await completeSetup(sqlite, name, balance, currency); setSetupComplete(true); }} />}
    </ThemeProvider>
  );
}

function DatabaseGate() {
  const sqlite = useSQLiteContext();
  const database = useMemo(() => drizzle(sqlite), [sqlite]);
  const { success, error } = useMigrations(database, migrations);
  const [seeded, setSeeded] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [databaseError, setDatabaseError] = useState('');

  useEffect(() => {
    if (!success) return;

    let cancelled = false;
    void seedDefaultCategories(sqlite).then(async () => {
      const [setup, settings] = await Promise.all([getSetupState(sqlite), getDatabaseSettings(sqlite)]);
      setSelectedCurrency(setup.currency);
      setThemeMode(settings.themeMode as 'system' | 'light' | 'dark');
      if (!cancelled) {
        setSetupComplete(setup.hasWallet);
        setSeeded(true);
      }
    }).catch((cause) => { if (!cancelled) setDatabaseError(cause instanceof Error ? cause.message : 'Database gagal disiapkan.'); });
    return () => {
      cancelled = true;
    };
  }, [sqlite, success]);

  if (error) return <DatabaseErrorState message={error.message} />;
  if (databaseError) return <DatabaseErrorState message={databaseError} />;
  if (!success || !seeded) return null;
  return <AppThemeProvider initialMode={themeMode} onModeChange={(mode) => setDatabaseThemeMode(sqlite, mode)}><AppNavigation initialSetupComplete={setupComplete} /></AppThemeProvider>;
}

function DatabaseErrorState({ message }: { message: string }) {
  return <View style={layoutStyles.error}><Text style={layoutStyles.errorGlyph}>!</Text><Text style={layoutStyles.errorTitle}>Spen belum siap</Text><Text style={layoutStyles.errorCopy}>{message}</Text></View>;
}

const layoutStyles = StyleSheet.create({ error: { alignItems: 'center', backgroundColor: '#F6F5F0', flex: 1, justifyContent: 'center', padding: 32 }, errorGlyph: { alignItems: 'center', backgroundColor: '#F9E4E0', borderRadius: 32, color: '#C85C55', fontSize: 28, height: 64, lineHeight: 64, marginBottom: 16, textAlign: 'center', width: 64 }, errorTitle: { color: '#213431', fontFamily: 'Fraunces_600SemiBold', fontSize: 22, marginBottom: 8 }, errorCopy: { color: '#7B8882', fontFamily: 'NunitoSans_400Regular', lineHeight: 21, textAlign: 'center' } });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMMono_400Regular,
    DMMono_500Medium,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <SQLiteProvider databaseName="spen.db" onInit={configureDatabase}><DatabaseGate /></SQLiteProvider>;
}
