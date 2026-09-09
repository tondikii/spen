import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Typography } from '@/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ReportView } from '../read';

export function ReportHeader({
  period,
  periods,
  configuredStartDay,
  dismissSignal,
  onPeriodStartDayChange,
  onPeriodChange,
  onAskAi,
}: {
  period: ReportView['period'];
  periods: ReportView['periods'];
  configuredStartDay: number;
  dismissSignal: number;
  onPeriodStartDayChange: (day: number) => void | Promise<void>;
  onPeriodChange: (periodId: string) => void | Promise<void>;
  onAskAi: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [startDay, setStartDay] = useState(configuredStartDay);
  /* eslint-disable react-hooks/set-state-in-effect -- selected period is an external read result. */
  useEffect(() => {
    const isActive = period.id === periods[periods.length - 1]?.id;
    setStartDay(isActive ? configuredStartDay : Number(period.startDate.slice(-2)));
  }, [configuredStartDay, period.id, period.startDate, periods]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const periodIndex = periods.findIndex((candidate) => candidate.id === period.id);
  const hasPreviousPeriod = periodIndex > 0;
  const hasNextPeriod = periodIndex >= 0 && periodIndex < periods.length - 1;

  return (
    <View style={styles.header}>
      <View>
        <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
          {t('common.planEyebrow')}
        </ThemedText>
        <ThemedText type="title">{t('common.report')}</ThemedText>
        <BudgetPeriodPicker
          period={period}
          startDay={startDay}
          readOnly={periodIndex >= 0 && periodIndex < periods.length - 1}
          dismissSignal={dismissSignal}
          onStartDayChange={(day) => {
            setStartDay(day);
            return onPeriodStartDayChange(day);
          }}
        />
        <View style={styles.periodStepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.previousReport')}
            accessibilityHint={t('common.previousReportHint')}
            accessibilityState={{ disabled: !hasPreviousPeriod }}
            disabled={!hasPreviousPeriod}
            onPress={() => {
              if (hasPreviousPeriod) void onPeriodChange(periods[periodIndex - 1]!.id);
            }}
            style={[
              styles.stepperButton,
              { borderColor: theme.line },
              !hasPreviousPeriod && styles.disabled,
            ]}
          >
            <ThemedText type="smallBold">‹</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="muted">
            {periodIndex + 1} / {periods.length}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.nextReport')}
            accessibilityHint={t('common.nextReportHint')}
            accessibilityState={{ disabled: !hasNextPeriod }}
            disabled={!hasNextPeriod}
            onPress={() => {
              if (hasNextPeriod) void onPeriodChange(periods[periodIndex + 1]!.id);
            }}
            style={[
              styles.stepperButton,
              { borderColor: theme.line },
              !hasNextPeriod && styles.disabled,
            ]}
          >
            <ThemedText type="smallBold">›</ThemedText>
          </Pressable>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.reportAskAi')}
        onPress={onAskAi}
        wrapperStyle={styles.aiAction}
        style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
      >
        <ThemedText
          type="smallBold"
          themeColor="pine"
          style={styles.aiButtonText}
          numberOfLines={1}
        >
          ✦ {t('common.reportAskAi')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: { ...Typography.eyebrow },
  periodStepper: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  stepperButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  disabled: { opacity: 0.35 },
  aiButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiAction: { flexShrink: 0 },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
});
