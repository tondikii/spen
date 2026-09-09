import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Typography } from '@/theme';

export type ScreenHeaderProps = {
  title?: string;
  eyebrow?: string;
  period?: { id?: string; startDate: string; endDate: string };
  periods?: Array<{ id: string; startDate: string; endDate: string }>;
  configuredStartDay?: number;
  dismissSignal?: number;
  onPeriodStartDayChange?: (day: number) => void | Promise<void>;
  onPeriodChange?: (periodId: string) => void | Promise<void>;
  aiAction?: {
    label: string;
    onPress: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  };
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
  title,
  eyebrow,
  period,
  periods,
  configuredStartDay,
  dismissSignal = 0,
  onPeriodStartDayChange,
  onPeriodChange,
  aiAction,
  trailing,
  style,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const hasPeriodPicker = Boolean(period && onPeriodStartDayChange && configuredStartDay !== undefined);
  const [startDay, setStartDay] = useState(configuredStartDay ?? 1);

  /* eslint-disable react-hooks/set-state-in-effect -- selected period is external read result. */
  useEffect(() => {
    if (configuredStartDay === undefined) return;
    if (hasPeriodPicker && periods && period?.id) {
      const isActive = period.id === periods[periods.length - 1]?.id;
      setStartDay(isActive ? configuredStartDay : Number(period.startDate.slice(-2)));
    } else {
      setStartDay(configuredStartDay);
    }
  }, [configuredStartDay, hasPeriodPicker, period?.id, period?.startDate, periods]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const periodIndex = periods && period?.id ? periods.findIndex((c) => c.id === period.id) : -1;
  const hasPreviousPeriod = periods ? periodIndex > 0 : false;
  const hasNextPeriod = periods ? periodIndex >= 0 && periodIndex < periods.length - 1 : false;
  const isReadOnly = periods ? periodIndex >= 0 && periodIndex < periods.length - 1 : false;
  const showStepper = Boolean(periods && onPeriodChange && period);

  return (
    <View style={[styles.header, style]}>
      <View style={hasPeriodPicker ? styles.periodCopy : styles.headerCopy}>
        {eyebrow ? (
          <ThemedText type="code" themeColor="muted" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
        ) : null}
        {title ? (
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
        ) : null}
        {hasPeriodPicker && period && onPeriodStartDayChange ? (
          <View style={[styles.periodControls, !showStepper && styles.periodControlsSingle]}>
            <BudgetPeriodPicker
              period={period}
              startDay={startDay}
              readOnly={isReadOnly}
              dismissSignal={dismissSignal}
              onStartDayChange={(day) => {
                setStartDay(day);
                return onPeriodStartDayChange(day);
              }}
            />
            {showStepper && periods && onPeriodChange ? (
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
                  <ThemedText type="smallBold" style={styles.stepperGlyph}>
                    ‹
                  </ThemedText>
                </Pressable>
                <ThemedText type="small" themeColor="muted" style={styles.stepperLabel}>
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
                  <ThemedText type="smallBold" style={styles.stepperGlyph}>
                    ›
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {aiAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={aiAction.accessibilityLabel ?? aiAction.label}
          accessibilityHint={aiAction.accessibilityHint}
          onPress={aiAction.onPress}
          wrapperStyle={styles.aiAction}
          style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
        >
          <ThemedText type="smallBold" themeColor="pine" style={styles.aiButtonText} numberOfLines={1}>
            ✦ {aiAction.label}
          </ThemedText>
        </Pressable>
      ) : null}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
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
  headerCopy: {
    flex: 1,
    gap: 0,
  },
  periodCopy: { flex: 1, gap: 0 },
  eyebrow: { ...Typography.eyebrow },
  title: { marginBottom: 5 },
  periodControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minWidth: 220,
  },
  periodControlsSingle: {
    alignSelf: 'flex-start',
    minWidth: 0,
  },
  periodStepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginLeft: 12,
  },
  stepperButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  stepperLabel: {
    minWidth: 44,
    textAlign: 'center',
  },
  stepperGlyph: {
    fontSize: 14,
    lineHeight: 14,
    textAlign: 'center',
  },
  disabled: { opacity: 0.35 },
  aiButton: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiAction: { flexShrink: 0, marginLeft: 12 },
  aiButtonText: { fontSize: 11, lineHeight: 14 },
  trailing: { flexShrink: 0, marginLeft: 12 },
});
