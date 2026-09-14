import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/ui/category-icon';
import { MonthCalendar } from '@/components/ui/month-calendar';
import { MotionChevron, MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { formatDate } from '@/i18n/format';
import { Spacing } from '@/theme';

/**
 * Tanggal transaksi: tombol pembuka kalender + grid bulannya. Memiliki
 * state kalender sendiri; batas tanggal opsional lewat `minDate`/`maxDate`
 * (format `YYYY-MM-DD`).
 */
export function DateField({
  date,
  onSelect,
  minDate,
  maxDate,
  variant = 'card',
  style,
}: {
  date: string;
  onSelect: (candidate: string) => void;
  minDate?: string | undefined;
  maxDate?: string | undefined;
  variant?: 'card' | 'underline' | undefined;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const locale = useLocale();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(date.slice(0, 7));
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.openCalendar')}
        accessibilityState={{ expanded: calendarOpen }}
        onPress={() => {
          if (!calendarOpen) setCalendarMonth(date.slice(0, 7));
          setCalendarOpen((open) => !open);
        }}
        style={[
          styles.dateButton,
          variant === 'card'
            ? { borderColor: theme.line, backgroundColor: theme.card }
            : { borderBottomColor: theme.line },
          variant === 'underline' && styles.underline,
          style,
        ]}
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
          maxMonth={maxDate?.slice(0, 7)}
          onSelect={(candidate) => {
            onSelect(candidate);
            setCalendarOpen(false);
          }}
          onMonthChange={setCalendarMonth}
          isDisabled={(candidate) =>
            (maxDate ? candidate > maxDate : false) || (minDate ? candidate < minDate : false)
          }
          disableOutOfMonth
          selectedVariant="mint"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  dateButtonText: { flex: 1 },
  underline: {
    borderBottomWidth: 1,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
});
