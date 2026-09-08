import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DateField } from '@/components/ui/date-field';
import { SheetModal } from './sheet-modal';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { FieldLabel, MoneyField } from '@/components/ui/form-fields';
import { useTheme } from '@/hooks/use-theme';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import { todayISO } from '@/utils/date';
import type { Wallet } from '@/types/domain';

import { planSheetStyles } from './plan-sheet-styles';

export function PlanPaymentModal({
  title,
  amount: initialAmount,
  wallets,
  minDate,
  showWalletPicker,
  onClose,
  onSubmit,
}: {
  title: string;
  amount: number;
  wallets: Wallet[];
  showWalletPicker: boolean;
  minDate?: string;
  onClose: () => void;
  onSubmit: (amount: number, walletId?: string, date?: string) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const activeWallets = wallets
    .filter((wallet) => !wallet.archived)
    .sort((left, right) => right.balance - left.balance);
  const [amount, setAmount] = useState(initialAmount ? formatMoneyInput(initialAmount) : '');
  const [walletId, setWalletId] = useState(activeWallets[0]?.id ?? null);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const submit = () => {
    const parsedAmount = parseMoneyInput(amount);
    if (parsedAmount <= 0) return;
    if (showWalletPicker) {
      if (!walletId) return;
      void onSubmit(parsedAmount, walletId, date);
    } else {
      void onSubmit(parsedAmount, undefined, date);
    }
  };

  return (
    <SheetModal
      title={title}
      closeLabel={t('common.cancel')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={planSheetStyles.goalSheet}
    >
      <ScrollView
        style={planSheetStyles.sheetScroll}
        contentContainerStyle={planSheetStyles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
      >
        <MoneyField
          label={t('common.nominal')}
          value={amount}
          onChangeText={(value) => setAmount(formatMoneyInput(value))}
          accessibilityLabel={t('common.paymentAmount')}
          autoFocus
          inputStyle={planSheetStyles.goalInput}
        />
        <FieldLabel>{t('common.transactionDate')}</FieldLabel>
        <DateField date={date} onSelect={setDate} minDate={minDate} maxDate={today} />
        {showWalletPicker && (
          <>
            <FieldLabel>{t('common.sourceWallet')}</FieldLabel>
            <WalletPicker wallets={activeWallets} selected={walletId} onSelect={setWalletId} />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(
            showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney',
          )}
          onPress={submit}
          style={[planSheetStyles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {t(showWalletPicker ? 'common.confirmPayment' : 'common.saveGoalMoney')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
  );
}
