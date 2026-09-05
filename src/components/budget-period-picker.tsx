import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  MotionAnimatedView,
  MotionChevron,
  MotionPressable,
  motionPresets,
} from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import i18n from '@/i18n';
import { getIntlLocale } from '@/i18n/format';

const startDayOptions = [1, 5, 25] as const;

export function BudgetPeriodPicker({
  period,
  startDay,
  onStartDayChange,
  dismissSignal = 0,
}: {
  period: { startDate: string; endDate: string };
  startDay: number;
  onStartDayChange: (day: number) => void | Promise<void>;
  dismissSignal?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [dismissSignal]);

  return (
    <View style={styles.anchor}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={t('common.chooseReportRange')}
        accessibilityState={{ expanded: open }}
        onTouchStart={(event) => event.stopPropagation()}
        onPress={() => setOpen((current) => !current)}
        style={[styles.dropdown, { borderColor: theme.line }]}
      >
        <ThemedText type="code" themeColor="muted" style={styles.label}>
          {formatBudgetPeriodLabel(period, startDay).replace('⌄', '')}
        </ThemedText>
        <MotionChevron expanded={open} color={theme.muted} size={16} />
      </MotionPressable>
      {open && (
        <MotionAnimatedView
          entering={motionPresets.itemEntering}
          onTouchStart={(event) => event.stopPropagation()}
          style={[styles.popover, { backgroundColor: theme.card, borderColor: theme.line }]}
        >
          {startDayOptions.map((day) => (
            <MotionPressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={t('common.date', { date: day })}
              accessibilityState={{ selected: startDay === day }}
              onPress={() => {
                setOpen(false);
                void onStartDayChange(day);
              }}
              style={[
                styles.option,
                { borderBottomColor: theme.line },
                startDay === day && { backgroundColor: theme.mint },
              ]}
            >
              <ThemedText type="smallBold" themeColor={startDay === day ? 'pine' : 'ink'}>
                {t('common.date', { date: day })}
              </ThemedText>
              {startDay === day && (
                <ThemedText type="smallBold" themeColor="pine">
                  ✓
                </ThemedText>
              )}
            </MotionPressable>
          ))}
        </MotionAnimatedView>
      )}
    </View>
  );
}

export function formatBudgetPeriodLabel(
  period: { startDate: string; endDate: string },
  startDay: number,
) {
  const start = new Date(
    `${period.startDate.slice(0, 7)}-${String(startDay).padStart(2, '0')}T12:00:00`,
  );
  const end = new Date(`${period.endDate}T12:00:00`);
  const month = new Intl.DateTimeFormat(getIntlLocale(i18n.language === 'en' ? 'en' : 'id'), {
    month: 'short',
  }).format(end);
  return `${start.getDate()}–${end.getDate()} ${month}`;
}

const styles = StyleSheet.create({
  dropdown: {
    alignItems: 'center',
    borderRadius: Radius.small,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.one + 2,
  },
  label: { fontSize: 11, lineHeight: 14 },
  anchor: { elevation: 100, position: 'relative', zIndex: 100 },
  popover: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    left: 0,
    padding: 4,
    position: 'absolute',
    top: 34,
    width: 148,
    elevation: 100,
    zIndex: 100,
  },
  option: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
    paddingHorizontal: 11,
  },
});
