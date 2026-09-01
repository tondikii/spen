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
import { useState } from 'react';

function AppNavigation() {
  const { colorScheme } = useAppTheme();
  const [setupComplete, setSetupComplete] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {setupComplete ? <AppTabs /> : <SetupWizard onComplete={() => setSetupComplete(true)} />}
    </ThemeProvider>
  );
}

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

  return (
    <AppThemeProvider>
      <AppNavigation />
    </AppThemeProvider>
  );
}
