import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurrencyPicker } from '@/components/ui/currency-picker';
import { LanguagePicker } from '@/components/ui/language-picker';
import { MotionPressable as Pressable, MotionScreen } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { changeLocale } from '@/i18n';
import { Radius, Spacing, Typography } from '@/theme';
import type { CurrencyCode, Locale } from '@/types/domain';
import { getSelectedLocale, setSelectedLocale } from '@/utils/selection';
import { parseMoneyInput } from '@/utils/money-input';

import type { SetupWalletDraft } from '../data/setup-repository';
import { WalletsStep, type WalletFormDraft } from '../components/wallets-step';

const totalSteps = 3;

export function SetupWizard({
  onComplete,
}: {
  onComplete: (wallets: SetupWalletDraft[], currency: CurrencyCode, locale: Locale) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const carouselRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [wallets, setWallets] = useState<WalletFormDraft[]>([{ name: '', balance: '' }]);
  const [locale, setLocale] = useState<Locale>(getSelectedLocale());
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const carouselWidth = Math.max(0, Math.min(windowWidth, 430) - 42);

  useEffect(() => {
    if (!carouselWidth) return;
    carouselRef.current?.scrollTo({ x: step * carouselWidth, animated: false });
  }, [carouselWidth, step]);

  const goToStep = (targetStep: number, animated = true) => {
    const nextStep = Math.max(0, Math.min(totalSteps - 1, targetStep));
    setStep(nextStep);
    if (carouselWidth) {
      carouselRef.current?.scrollTo({ x: nextStep * carouselWidth, animated });
    }
  };

  const complete = () => {
    onComplete(
      wallets.map((wallet, index) => ({
        name: wallet.name.trim() || (index === 0 ? 'Dompet utama' : `Dompet ${index + 1}`),
        initialBalance: parseMoneyInput(wallet.balance),
      })),
      currency,
      locale,
    );
  };

  const next = () => {
    if (step < totalSteps - 1) {
      goToStep(step + 1);
      return;
    }

    complete();
  };

  const handleMomentumEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (!carouselWidth) return;
    const nextStep = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    setStep(Math.max(0, Math.min(totalSteps - 1, nextStep)));
  };

  return (
    <ThemedView style={styles.page}>
      <MotionScreen>
        <KeyboardAvoidingView
          style={styles.safeArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.screenContent}>
              <View style={styles.top}>
                <ThemedText type="code" themeColor="muted" accessibilityLabel={t('common.appName')}>
                  SPEN
                </ThemedText>
                <ThemedText
                  type="code"
                  themeColor="muted"
                  accessibilityLabel={t('common.stepOf', { current: step + 1, total: totalSteps })}
                >
                  {step + 1}/{totalSteps}
                </ThemedText>
              </View>

              <View style={styles.dots} accessibilityRole="tablist">
                {Array.from({ length: totalSteps }, (_, dot) => {
                  const active = dot === step;

                  return (
                    <Pressable
                      accessible
                      key={dot}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.openStep', { step: dot + 1 })}
                      accessibilityState={{ selected: active }}
                      onPress={() => goToStep(dot)}
                      hitSlop={8}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: dot <= step ? theme.pine : theme.line,
                          opacity: active ? 1 : 0.6,
                          transform: [{ scale: active ? 1.08 : 1 }],
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <ScrollView
                ref={carouselRef}
                testID="setup-wizard-carousel"
                horizontal
                pagingEnabled
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onMomentumScrollEnd={handleMomentumEnd}
                contentContainerStyle={[
                  styles.carouselContent,
                  carouselWidth ? { width: carouselWidth * totalSteps } : undefined,
                ]}
              >
                <View style={[styles.slide, carouselWidth ? { width: carouselWidth } : null]}>
                  <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                    {t('common.language')}
                  </ThemedText>
                  <ThemedText type="title" style={styles.title}>
                    {t('common.chooseLanguage')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted" style={styles.lead}>
                    {t('common.chooseLanguageDetail')}
                  </ThemedText>
                  <LanguagePicker
                    selected={locale}
                    onSelect={(option) => {
                      setLocale(option);
                      setSelectedLocale(option);
                      void changeLocale(option);
                    }}
                  />
                </View>

                <WalletsStep width={carouselWidth} wallets={wallets} onWalletsChange={setWallets} />

                <View style={[styles.slide, carouselWidth ? { width: carouselWidth } : null]}>
                  <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
                    {t('common.currency')}
                  </ThemedText>
                  <ThemedText type="title" style={styles.title}>
                    {t('common.chooseCurrency')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted" style={styles.lead}>
                    {t('common.noConversion')}
                  </ThemedText>
                  <CurrencyPicker selected={currency} onSelect={setCurrency} />
                </View>
              </ScrollView>

              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel={
                  step === 0
                    ? t('common.start')
                    : step === totalSteps - 1
                      ? t('common.enterSpen')
                      : t('common.next')
                }
                accessibilityHint={t('common.nextStep')}
                accessibilityState={{ busy: false }}
                onPress={next}
                style={[styles.primary, { backgroundColor: theme.pine }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                  {step === 0
                    ? t('common.start')
                    : step === totalSteps - 1
                      ? t('common.enterSpen')
                      : t('common.next')}{' '}
                  <ThemedText style={{ color: theme.heroText }}>→</ThemedText>
                </ThemedText>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </MotionScreen>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 430,
    padding: 21,
    width: '100%',
  },
  safeArea: { flex: 1 },
  screenContent: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 24,
    marginTop: 37,
  },
  dot: { borderRadius: Radius.pill, height: 6, width: 29 },
  carouselContent: { flexDirection: 'row' },
  slide: { flex: 1, paddingBottom: Spacing.four },
  title: { fontSize: 37, lineHeight: 40, letterSpacing: -1.48 },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
    marginTop: 17,
    maxWidth: 290,
  },
  eyebrow: { ...Typography.eyebrow, marginBottom: 7 },
  primary: { borderRadius: 15, marginTop: 'auto', padding: 15 },
});
