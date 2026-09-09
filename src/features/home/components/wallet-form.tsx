import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MotionPressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { FieldLabel, MoneyField } from '@/components/ui/form-fields';
import { Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorTranslationKey } from '@/utils/app-error';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import type { Wallet } from '@/types/domain';

type WalletFormProps =
  | {
      mode: 'create';
      onClose: () => void;
      onSave: (name: string, balance: number) => void | Promise<void>;
    }
  | {
      mode: 'edit';
      wallet: Wallet;
      onClose: () => void;
      onSave: (name: string, balance: number) => void | Promise<void>;
      onArchive: () => void;
    };

export function WalletForm(props: WalletFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const wallet = props.mode === 'edit' ? props.wallet : undefined;
  const [name, setName] = useState(wallet?.name ?? '');
  const [amount, setAmount] = useState(wallet ? formatMoneyInput(wallet.balance) : '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const submit = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await props.onSave(name.trim() || t('common.newWallet'), parseMoneyInput(amount));
    } catch (cause) {
      setSaveError(t(getErrorTranslationKey(cause)));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal animationType="slide" visible onRequestClose={props.onClose}>
      <ThemedView style={styles.formPage}>
        <View style={[styles.formHeader, { borderBottomColor: theme.line }]}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={t('common.closeWalletForm')}
            accessibilityHint={t('common.closeWithoutSavingHint')}
            onPress={props.onClose}
            style={styles.headerButton}
          >
            <ThemedText type="subtitle" themeColor="pine">
              ×
            </ThemedText>
          </MotionPressable>
          <ThemedText type="sectionHeading">
            {props.mode === 'edit' ? t('common.editWallet') : t('common.newWallet')}
          </ThemedText>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={t('common.saveWallet')}
            accessibilityState={{ busy: saving, disabled: saving }}
            onPress={submit}
            style={styles.headerButton}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.save')}
            </ThemedText>
          </MotionPressable>
        </View>
        {saveError && (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.errorBanner, { backgroundColor: theme.dangerBackground }]}
          >
            <ThemedText type="small" style={{ color: theme.expense }}>
              {saveError}
            </ThemedText>
          </View>
        )}
        <KeyboardAvoidingView
          style={styles.formBody}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <FieldLabel>{t('common.walletName')}</FieldLabel>
            <ThemedInput
              accessibilityLabel={t('common.walletName')}
              placeholder={t('common.walletNamePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <MoneyField
              label={
                props.mode === 'edit'
                  ? t('common.currentBalanceLabel')
                  : t('common.startingBalanceLabel')
              }
              value={amount}
              onChangeText={(value) => setAmount(formatMoneyInput(value))}
              accessibilityLabel={
                props.mode === 'edit' ? t('common.walletBalance') : t('common.walletInitialBalance')
              }
            />
            {props.mode === 'edit' && (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={t('common.archiveWalletLabel')}
                onPress={props.onArchive}
                style={styles.archiveAction}
              >
                <ThemedText
                  style={[
                    styles.archiveIcon,
                    {
                      backgroundColor: theme.dangerBackground,
                      color: theme.expense,
                    },
                  ]}
                >
                  □
                </ThemedText>
                <View style={styles.archiveCopy}>
                  <ThemedText type="smallBold" style={{ color: theme.expense }}>
                    {t('common.archiveWalletLabel')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="muted">
                    {t('common.walletArchiveTransactionCopy')}
                  </ThemedText>
                </View>
                <ThemedText type="subtitle" themeColor="muted">
                  ›
                </ThemedText>
              </MotionPressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  formPage: { flex: 1 },
  formHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 65,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    minWidth: 56,
  },
  errorBanner: { borderRadius: 12, marginHorizontal: 21, marginTop: 10, padding: 10 },
  formBody: { flex: 1 },
  formContent: { gap: Spacing.two, paddingHorizontal: 21, paddingVertical: 24 },
  archiveAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.five,
    paddingHorizontal: 3,
    paddingTop: Spacing.four,
  },
  archiveIcon: {
    alignItems: 'center',
    borderRadius: 12,
    fontSize: 18,
    height: 35,
    justifyContent: 'center',
    paddingTop: 4,
    textAlign: 'center',
    width: 35,
  },
  archiveCopy: { flex: 1 },
});
