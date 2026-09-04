import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
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
import { StyleSheet, View } from 'react-native';

import AppRuntime from '@/components/app-runtime';
import { SpenSplash } from '@/components/brand-assets';

// Keep the native splash visible until fonts and the selected runtime are ready.
void SplashScreen.preventAutoHideAsync();

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

  if (!fontsLoaded && !fontError)
    return (
      <View style={styles.splash}>
        <SpenSplash />
      </View>
    );
  return <AppRuntime />;
}

const styles = StyleSheet.create({
  splash: { backgroundColor: '#F6F5F0', flex: 1 },
});
