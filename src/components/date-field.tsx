import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { formatDate } from '@/i18n/format';
import { todayISO } from '@/lib/date';
import { FieldLabel } from '@/components/form-fields';
import { MonthCalendar } from '@/components/month-calendar';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { MotionPressable as Pressable } from '@/components/motion';

type Props = {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
};

export function DateField({ label, value, onChange, minDate, maxDate }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const today = maxDate ?? todayISO();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(value.slice(0, 7) || today.slice(0, 7));

  return (
    <>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.openCalendar')}
        onPress={() => setOpen((c) => !c)}
        style={[styles.dateButton, { borderColor: theme.line }]}
      >
        <ThemedText type="smallBold">{formatDate(value, i18n.language === 'en' ? 'en' : 'id')}</ThemedText>
        <ThemedText type="small" themeColor="muted">
          {t('common.openCalendar')}
        </ThemedText>
      </Pressable>
      {open && (
        <MonthCalendar
          month={month}
          selected={value}
          maxMonth={today.slice(0, 7)}
          onSelect={(candidate) => {
            onChange(candidate);
            setOpen(false);
          }}
          onMonthChange={setMonth}
          isDisabled={(candidate) => candidate > today || (minDate ? candidate < minDate : false)}
          selectedVariant="mint"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
});
