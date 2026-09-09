import { useTranslation } from 'react-i18next';

import { PeriodHeader } from '@/components/ui/period-header';

export function PlanHeader({
  period,
  configuredStartDay,
  dismissSignal,
  onPeriodStartDayChange,
  onOpenAi,
}: {
  period: { startDate: string; endDate: string };
  configuredStartDay: number;
  dismissSignal: number;
  onPeriodStartDayChange: (day: number) => void | Promise<void>;
  onOpenAi: () => void;
}) {
  const { t } = useTranslation();
  return (
    <PeriodHeader
      title={t('common.plan')}
      period={period}
      configuredStartDay={configuredStartDay}
      dismissSignal={dismissSignal}
      onPeriodStartDayChange={onPeriodStartDayChange}
      onAskAi={onOpenAi}
      aiLabel={t('common.aiSuggestion')}
      aiAccessibilityLabel={t('common.aiSuggestion')}
      aiAccessibilityHint={t('common.aiSuggestion')}
    />
  );
}
