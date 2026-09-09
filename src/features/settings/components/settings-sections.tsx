import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SpenLogo } from '@/components/ui/brand-assets';
import { CurrencyPicker } from '@/components/ui/currency-picker';
import { LanguagePicker } from '@/components/ui/language-picker';
import {
  MotionChevron,
  MotionCollapsible,
  MotionPressable,
  MotionSwitch,
} from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { BoxedCard } from '@/components/ui/ui-primitives';
import { useAppTheme } from '@/providers/theme-provider';
import { useTheme } from '@/hooks/use-theme';
import type { CurrencyCode, Locale } from '@/types/domain';

import { getPublicDocumentUrl } from '../content/public-documents';
import { ActionRow, SettingRow } from './settings-rows';

export function AppearanceSection({ busy }: { busy: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, setMode } = useAppTheme();
  const dark = mode === 'dark';
  return (
    <>
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
    </>
  );
}

export function PreferencesSection({
  currency,
  currencyOpen,
  languageOpen,
  locale,
  onSelectCurrency,
  onSelectLocale,
  onToggleCurrency,
  onToggleLanguage,
}: {
  currency: CurrencyCode;
  currencyOpen: boolean;
  languageOpen: boolean;
  locale: Locale;
  onSelectCurrency: (option: CurrencyCode) => void;
  onSelectLocale: (option: Locale) => void;
  onToggleCurrency: () => void;
  onToggleLanguage: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <>
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
            onPress={onToggleLanguage}
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
            <LanguagePicker selected={locale} onSelect={onSelectLocale} withTopBorder />
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
            onPress={onToggleCurrency}
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
            <CurrencyPicker selected={currency} onSelect={onSelectCurrency} withTopBorder />
          </MotionCollapsible>
        )}
      </BoxedCard>
    </>
  );
}

export function DataSection({
  busy,
  onBackup,
  onRestore,
}: {
  busy: boolean;
  onBackup: () => void;
  onRestore: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
        {t('common.data')}
      </ThemedText>
      <BoxedCard style={styles.group}>
        <ActionRow
          icon="↓"
          iconStyle={styles.dataIcon}
          title={t('common.backupData')}
          detail={busy ? t('common.preparingFile') : t('common.saveDataCopy')}
          onPress={onBackup}
        />
        <ActionRow
          icon="↑"
          iconStyle={styles.dataIcon}
          title={t('common.restoreData')}
          detail={busy ? t('common.processingFile') : t('common.overwriteFromBackup')}
          onPress={onRestore}
        />
      </BoxedCard>
    </>
  );
}

export function HelpSection({
  onFaqPress,
  onOpenLink,
}: {
  onFaqPress: () => void;
  onOpenLink: (url: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <ThemedText type="code" themeColor="muted" style={styles.groupLabel}>
        {t('common.help')}
      </ThemedText>
      <BoxedCard style={styles.group}>
        <ActionRow
          icon="?"
          title={t('common.faq')}
          detail={t('common.faqDetail')}
          onPress={onFaqPress}
        />
        <ActionRow
          icon="!"
          title={t('common.reportProblem')}
          detail={t('common.reportProblemDetail')}
          onPress={() => {
            onOpenLink(
              `mailto:tondikiag30@gmail.com?subject=${encodeURIComponent(t('common.reportProblem'))}`,
            );
          }}
        />
        <ActionRow
          icon="›"
          title={t('common.terms')}
          detail={t('common.readTerms')}
          onPress={() => {
            onOpenLink(getPublicDocumentUrl('/terms'));
          }}
        />
        <ActionRow
          icon="›"
          title={t('common.privacy')}
          detail={t('common.readPrivacy')}
          onPress={() => {
            onOpenLink(getPublicDocumentUrl('/privacy'));
          }}
        />
      </BoxedCard>
    </>
  );
}

export function SettingsFooter() {
  const { t } = useTranslation();
  return (
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
  );
}

const styles = StyleSheet.create({
  groupLabel: { marginBottom: 8, marginTop: 18 },
  group: { borderRadius: 19, overflow: 'hidden' },
  themeIcon: { transform: [{ translateY: -3 }] },
  smallIcon: { fontSize: 12, lineHeight: 24 },
  currencyIcon: { fontSize: 15 },
  dataIcon: { transform: [{ translateY: -3 }] },
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
});
