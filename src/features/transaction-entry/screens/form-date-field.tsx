import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/category-icon';
import { MonthCalendar } from '@/components/month-calendar';
import { MotionChevron, MotionPressable as Pressable } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatDate } from '@/i18n/format';

/** Tanggal transaksi: tombol pembuka kalender + grid bulannya. */
export function FormDateField({
  date,
  calendarOpen,
  onToggle,
  onSelect,
  calendarMonth,
  onMonthChange,
  maxMonth,
  styles,
}: {
  date: string;
  calendarOpen: boolean;
  onToggle: () => void;
  onSelect: (candidate: string) => void;
  calendarMonth: string;
  onMonthChange: (month: string) => void;
  maxMonth: string;
  styles: {
    dateButton: object;
    dateButtonText: object;
  };
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.openCalendar')}
        accessibilityState={{ expanded: calendarOpen }}
        onPress={onToggle}
        style={[styles.dateButton, { borderColor: theme.line, backgroundColor: theme.card }]}
      >
        <CategoryIcon name="calendar-month-outline" color={theme.pine} size={19} />
        <ThemedText type="smallBold" style={styles.dateButtonText}>
          {formatDate(`${date}T12:00:00`, locale)}
        </ThemedText>
        <MotionChevron expanded={calendarOpen} color={theme.muted} size={16} />
      </Pressable>
      {calendarOpen && (
        <MonthCalendar
          month={calendarMonth}
          selected={date}
          maxMonth={maxMonth}
          onSelect={(candidate) => {
            onSelect(candidate);
          }}
          onMonthChange={onMonthChange}
          isDisabled={(candidate) => candidate > maxMonth}
          disableOutOfMonth
          selectedVariant="mint"
        />
      )}
    </>
  );
}
