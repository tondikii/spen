import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMoneyInput, parseMoneyInput } from "@/lib/money-input";
import type { SetupWalletDraft } from "@/services/setup-service";
import type { CurrencyCode } from "@/types/domain";

const totalSteps = 3;

export function SetupWizard({
  onComplete,
}: {
  onComplete: (wallets: SetupWalletDraft[], currency: CurrencyCode) => void;
}) {
  const theme = useTheme();
  const carouselRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [wallets, setWallets] = useState([{ name: "", balance: "" }]);
  const [currency, setCurrency] = useState<CurrencyCode>("IDR");
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
        name:
          wallet.name.trim() ||
          (index === 0 ? "Wallet utama" : `Wallet ${index + 1}`),
        initialBalance: parseMoneyInput(wallet.balance),
      })),
      currency,
    );
  };

  const next = () => {
    if (step < totalSteps - 1) {
      goToStep(step + 1);
      return;
    }

    complete();
  };

  const handleMomentumEnd = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    if (!carouselWidth) return;
    const nextStep = Math.round(
      event.nativeEvent.contentOffset.x / carouselWidth,
    );
    setStep(Math.max(0, Math.min(totalSteps - 1, nextStep)));
  };

  return (
    <ThemedView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.screenContent}>
            <View style={styles.top}>
              <ThemedText type="code" themeColor="muted">
                SPEN
              </ThemedText>
              <ThemedText type="code" themeColor="muted">
                {step + 1}/{totalSteps}
              </ThemedText>
            </View>

            <View style={styles.dots} accessibilityRole="tablist">
              {[0, 1, 2].map((dot) => {
                const active = dot === step;

                return (
                  <Pressable
                    accessible
                    key={dot}
                    accessibilityRole="button"
                    accessibilityLabel={`Buka langkah ${dot + 1}`}
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
                carouselWidth
                  ? { width: carouselWidth * totalSteps }
                  : undefined,
              ]}
            >
              <View
                style={[
                  styles.slide,
                  carouselWidth ? { width: carouselWidth } : null,
                ]}
              >
                <ThemedText
                  style={[
                    styles.orb,
                    { backgroundColor: theme.mint, color: theme.pine },
                  ]}
                >
                  ✦
                </ThemedText>
                <ThemedText type="title" style={styles.title}>
                  Buat rencana untuk uangmu.
                </ThemedText>
                <ThemedText type="small" themeColor="muted" style={styles.lead}>
                  Catat transaksi dan sisihkan.
                </ThemedText>
              </View>

              <View
                style={[
                  styles.slide,
                  carouselWidth ? { width: carouselWidth } : null,
                ]}
              >
                <ThemedText
                  type="code"
                  themeColor="muted"
                  style={styles.eyebrow}
                >
                  Buat Wallet
                </ThemedText>
                <ThemedText type="title" style={styles.title}>
                  Uangmu disimpan di mana?
                </ThemedText>
                <ThemedText type="small" themeColor="muted" style={styles.lead}>
                  Bisa untuk uang tunai, e-wallet, atau bank.
                </ThemedText>
                <ScrollView
                  style={styles.walletList}
                  contentContainerStyle={styles.walletListContent}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets
                  keyboardDismissMode="interactive"
                >
                  {wallets.map((wallet, index) => (
                    <View key={index} style={styles.walletItem}>
                      {index > 0 && (
                        <View style={styles.walletItemActions}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Hapus wallet ${index + 1}`}
                            onPress={() =>
                              setWallets((current) =>
                                current.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              )
                            }
                            hitSlop={8}
                          >
                            <ThemedText
                              type="smallBold"
                              style={{ color: theme.expense }}
                            >
                              Hapus
                            </ThemedText>
                          </Pressable>
                        </View>
                      )}
                      <ThemedText type="code" themeColor="muted">
                        NAMA WALLET
                      </ThemedText>
                      <TextInput
                        accessibilityLabel={
                          index === 0
                            ? "Nama wallet pertama"
                            : `Nama wallet ${index + 1}`
                        }
                        placeholder="Mis. Tunai"
                        placeholderTextColor={theme.muted}
                        value={wallet.name}
                        onChangeText={(name) =>
                          setWallets((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name } : item,
                            ),
                          )
                        }
                        style={[
                          styles.input,
                          { borderBottomColor: theme.line, color: theme.ink },
                        ]}
                      />
                      <ThemedText
                        type="code"
                        themeColor="muted"
                        style={styles.balanceLabel}
                      >
                        SALDO AWAL
                      </ThemedText>
                      <TextInput
                        accessibilityLabel={
                          index === 0
                            ? "Saldo awal wallet pertama"
                            : `Saldo awal wallet ${index + 1}`
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.muted}
                        value={wallet.balance}
                        onChangeText={(balance) =>
                          setWallets((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    balance: formatMoneyInput(balance),
                                  }
                                : item,
                            ),
                          )
                        }
                        style={[
                          styles.input,
                          { borderBottomColor: theme.line, color: theme.ink },
                        ]}
                      />
                    </View>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Tambah Wallet"
                    onPress={() =>
                      setWallets((current) => [
                        ...current,
                        { name: "", balance: "" },
                      ])
                    }
                    style={[
                      styles.addWallet,
                      { borderBottomColor: theme.line },
                    ]}
                  >
                    <ThemedText type="smallBold" themeColor="pine">
                      + Tambah Wallet
                    </ThemedText>
                  </Pressable>
                </ScrollView>
              </View>

              <View
                style={[
                  styles.slide,
                  carouselWidth ? { width: carouselWidth } : null,
                ]}
              >
                <ThemedText
                  type="code"
                  themeColor="muted"
                  style={styles.eyebrow}
                >
                  Mata Uang
                </ThemedText>
                <ThemedText type="title" style={styles.title}>
                  Pilih mata uang
                </ThemedText>
                <ThemedText type="small" themeColor="muted" style={styles.lead}>
                  Nilai tidak dikonversi, hanya tampilannya yang berubah.
                </ThemedText>
                <View style={styles.currencyGrid}>
                  {(["IDR", "USD", "SGD", "MYR"] as CurrencyCode[]).map(
                    (option) => (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityLabel={`Pilih mata uang ${option}`}
                        onPress={() => setCurrency(option)}
                        style={[
                          styles.currency,
                          {
                            borderColor:
                              currency === option ? theme.pine : theme.line,
                            backgroundColor:
                              currency === option ? theme.mint : theme.card,
                          },
                        ]}
                      >
                        <ThemedText
                          type="smallBold"
                          themeColor={currency === option ? "pine" : "ink"}
                        >
                          {option}
                        </ThemedText>
                      </Pressable>
                    ),
                  )}
                </View>
              </View>
            </ScrollView>

            <Pressable
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                step === 0 ? "Mulai" : step === 2 ? "Masuk ke Spen" : "Lanjut"
              }
              onPress={next}
              style={[styles.primary, { backgroundColor: theme.pine }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                {step === 0 ? "Mulai" : step === 1 ? "Lanjut" : "Masuk ke Spen"}{" "}
                <ThemedText style={{ color: theme.heroText }}>→</ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 430,
    padding: 21,
    width: "100%",
  },
  safeArea: { flex: 1 },
  screenContent: { flex: 1 },
  top: { flexDirection: "row", justifyContent: "space-between" },
  dots: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 24,
    marginTop: 37,
  },
  dot: { borderRadius: Radius.pill, height: 6, width: 29 },
  carouselContent: { flexDirection: "row" },
  slide: { flex: 1, paddingBottom: Spacing.four },
  orb: {
    alignItems: "center",
    borderRadius: 30,
    fontFamily: Fonts.serif,
    fontSize: 39,
    height: 82,
    justifyContent: "center",
    marginBottom: 29,
    paddingTop: 18,
    textAlign: "center",
    width: 82,
  },
  title: { fontSize: 37, lineHeight: 40, letterSpacing: -1.48 },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
    marginTop: 17,
    maxWidth: 290,
  },
  walletList: { maxHeight: 350 },
  walletListContent: { paddingBottom: Spacing.two },
  walletItem: { paddingBottom: 16, paddingTop: 12 },
  walletItemActions: {
    alignItems: "flex-end",
    marginBottom: 6,
  },
  addWallet: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 15,
  },
  eyebrow: { ...Typography.eyebrow, marginBottom: 7 },
  input: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 18,
    minHeight: 52,
    paddingHorizontal: 0,
  },
  balanceLabel: { marginTop: 25 },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
    marginTop: 5,
  },
  currency: { borderRadius: 17, borderWidth: 1, padding: 14, width: "47%" },
  primary: { borderRadius: 15, marginTop: "auto", padding: 15 },
});
