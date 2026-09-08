import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MotionPressable } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getIntlLocale } from '@/i18n/format';
import {
  formatCalendarMonth,
  getCalendarDates,
  getWeekdayLabels,
  shiftMonth,
  type CalendarDate,
} from '@/lib/date';

/**
 * Monday-first month grid shared by the transaction form, the plan sheet
 * calendars and the Daily screen. Renders the ‹ month › header, the narrow
 * weekday row and six weeks of day cells; selection highlight and out-of-month
 * dimming are built in. Wrap in a MotionCollapsible (or conditional) to animate
 * its appearance.
 */
export function MonthCalendar({
  month,
  selected,
  onSelect,
  onMonthChange,
  maxMonth,
  isDisabled,
  disableOutOfMonth = false,
  selectedVariant = 'pine',
  dayAccessibilityLabel,
  style,
}: {
  /** The visible month as `YYYY-MM`. */
  month: string;
  /** The selected date as `YYYY-MM-DD`, highlighted with the inverse style. */
  selected?: string;
  /** Called with the picked `YYYY-MM-DD` date. */
  onSelect: (date: string) => void;
  /** Called with the shifted `YYYY-MM` when a header arrow is pressed. */
  onMonthChange: (month: string) => void;
  /** Upper bound (`YYYY-MM`) for the "next month" arrow; omitted = unbounded. */
  maxMonth?: string;
  /** Extra predicate; a date is disabled when it returns true. */
  isDisabled?: (date: string) => boolean;
  /** Also disable dates outside the visible month. */
  disableOutOfMonth?: boolean;
  /** Selected-day styling: `mint` (tinted bg + pine text) or `pine` (inverse). */
  selectedVariant?: 'mint' | 'pine';
  /** Accessibility label per day cell; defaults to `common.selectTransactionDate`. */
  dayAccessibilityLabel?: (date: string) => string;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const locale = getIntlLocale(useLocale());
  const dates: CalendarDate[] = getCalendarDates(month);
  const weekdayLabels = getWeekdayLabels(locale);

  return (
    <View style={[styles.calendar, { borderColor: theme.line }, style]}>
      <View style={styles.calendarHeader}>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.previousMonth')}
          onPress={() => onMonthChange(shiftMonth(month, -1))}
          wrapperStyle={styles.calendarMonthButton}
          style={styles.calendarMonthButton}
        >
          <ThemedText style={[styles.calendarChevron, { color: theme.pine }]}>‹</ThemedText>
        </MotionPressable>
        <ThemedText type="smallBold">{formatCalendarMonth(month, locale)}</ThemedText>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel={t('common.nextMonth')}
          disabled={maxMonth !== undefined && month >= maxMonth}
          onPress={() => onMonthChange(shiftMonth(month, 1))}
          wrapperStyle={styles.calendarMonthButton}
          style={styles.calendarMonthButton}
        >
          <ThemedText style={[styles.calendarChevron, { color: theme.pine }]}>›</ThemedText>
        </MotionPressable>
      </View>
      <View style={styles.calendarGrid}>
        {weekdayLabels.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.calendarCell}>
            <ThemedText type="code" themeColor="muted" style={styles.weekday}>
              {label}
            </ThemedText>
          </View>
        ))}
        {dates.map((calendarDate) => {
          const isSelected = calendarDate.date === selected;
          const disabled =
            (disableOutOfMonth && !calendarDate.inMonth) ||
            (isDisabled ? isDisabled(calendarDate.date) : false);
          return (
            <MotionPressable
              key={calendarDate.date}
              accessibilityRole="button"
              accessibilityLabel={
                dayAccessibilityLabel
                  ? dayAccessibilityLabel(calendarDate.date)
                  : t('common.selectTransactionDate', {
                      date: calendarDate.date,
                    })
              }
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onSelect(calendarDate.date)}
              wrapperStyle={styles.calendarCell}
              style={[styles.calendarPressable, disabled && { opacity: 0.35 }]}
            >
              <View style={[styles.calendarDay, isSelected && { backgroundColor: theme.pine }]}>
                <ThemedText
                  type={isSelected ? 'smallBold' : 'small'}
                  themeColor={isSelected ? 'heroText' : calendarDate.inMonth ? 'ink' : 'muted'}
                >
                  {Number(calendarDate.date.slice(8))}
                </ThemedText>
              </View>
            </MotionPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarMonthButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  calendarChevron: { fontSize: 24, lineHeight: 27 },
  calendarGrid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calendarCell: {
    alignItems: 'center',
    flexBasis: '14.2857%',
    justifyContent: 'center',
    width: '14.2857%',
  },
  calendarPressable: { alignItems: 'center', alignSelf: 'stretch' },
  calendarDay: {
    alignItems: 'center',
    borderRadius: Radius.small,
    height: 34,
    justifyContent: 'center',
    marginVertical: 2,
    width: 34,
  },
  weekday: { fontSize: 9, lineHeight: 20, textTransform: 'uppercase' },
});
