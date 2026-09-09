import { useTranslation } from 'react-i18next';

import { PeriodHeader } from '@/components/ui/period-header';

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
  const { t } = useTranslation();
  return (
    <PeriodHeader
      title={t('common.report')}
      period={period}
      periods={periods}
      configuredStartDay={configuredStartDay}
      dismissSignal={dismissSignal}
      onPeriodStartDayChange={onPeriodStartDayChange}
      onPeriodChange={onPeriodChange}
      onAskAi={onAskAi}
      aiLabel={t('common.reportAskAi')}
      aiAccessibilityLabel={t('common.reportAskAi')}
    />
  );
}
