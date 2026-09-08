import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MonthCalendar } from '@/components/month-calendar';
import { SheetModal } from '@/components/sheet-modal';
import { WalletPicker } from '@/components/wallet-picker';
import { MotionPressable as Pressable } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { FieldLabel, MoneyField } from '@/components/form-fields';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatDate } from '@/i18n/format';
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input';
import { todayISO } from '@/lib/date';
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
  const locale = useLocale();
  const activeWallets = wallets
    .filter((wallet) => !wallet.archived)
    .sort((left, right) => right.balance - left.balance);
  const [amount, setAmount] = useState(initialAmount ? formatMoneyInput(initialAmount) : '');
  const [walletId, setWalletId] = useState(activeWallets[0]?.id ?? null);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.openCalendar')}
          onPress={() => setCalendarOpen((current) => !current)}
          style={[planSheetStyles.dateButton, { borderColor: theme.line }]}
        >
          <ThemedText type="smallBold">{formatDate(date, locale)}</ThemedText>
          <ThemedText type="small" themeColor="muted">
            {t('common.openCalendar')}
          </ThemedText>
        </Pressable>
        {calendarOpen && (
          <MonthCalendar
            month={calendarMonth}
            selected={date}
            maxMonth={today.slice(0, 7)}
            onSelect={(candidate) => {
              setDate(candidate);
              setCalendarOpen(false);
            }}
            onMonthChange={setCalendarMonth}
            isDisabled={(candidate) => candidate > today || (minDate ? candidate < minDate : false)}
            selectedVariant="mint"
          />
        )}
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
