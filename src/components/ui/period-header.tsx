import { ScreenHeader } from '@/components/ui/screen-header';

export type PeriodHeaderProps = {
  title: string;
  period: { id?: string; startDate: string; endDate: string };
  periods?: Array<{ id: string; startDate: string; endDate: string }>;
  configuredStartDay: number;
  dismissSignal: number;
  onPeriodStartDayChange: (day: number) => void | Promise<void>;
  onPeriodChange?: (periodId: string) => void | Promise<void>;
  onAskAi: () => void;
  aiLabel: string;
  aiAccessibilityLabel?: string;
  aiAccessibilityHint?: string;
};

/** @deprecated Gunakan ScreenHeader langsung. Wrapper untuk kompatibilitas report/plan. */
export function PeriodHeader({
  title,
  period,
  periods,
  configuredStartDay,
  dismissSignal,
  onPeriodStartDayChange,
  onPeriodChange,
  onAskAi,
  aiLabel,
  aiAccessibilityLabel,
  aiAccessibilityHint,
}: PeriodHeaderProps) {
  return (
    <ScreenHeader
      title={title}
      period={period}
      {...(periods !== undefined ? { periods } : {})}
      configuredStartDay={configuredStartDay}
      dismissSignal={dismissSignal}
      onPeriodStartDayChange={onPeriodStartDayChange}
      {...(onPeriodChange !== undefined ? { onPeriodChange } : {})}
      aiAction={{
        label: aiLabel,
        onPress: onAskAi,
        ...(aiAccessibilityLabel !== undefined ? { accessibilityLabel: aiAccessibilityLabel } : {}),
        ...(aiAccessibilityHint !== undefined ? { accessibilityHint: aiAccessibilityHint } : {}),
      }}
    />
  );
}
