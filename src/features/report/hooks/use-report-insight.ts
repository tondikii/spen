import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/use-locale';
import { getErrorTranslationKey } from '@/utils/app-error';
import { aiService, type BudgetAIInput } from '@/lib/ai-service';
import { getCategoryLabel } from '@/i18n/categories';
import type { ReportView } from '../read';

/**
 * AI insight state machine for the report screen: debounced request on
 * open, loading/source/error tracking, deterministic fallback
 * (ADR-0002).
 */
export function useReportInsight({
  open,
  aiInput,
  reportView,
}: {
  open: boolean;
  aiInput?: BudgetAIInput;
  reportView: ReportView;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void aiService
        .generateInsight({
          ...(aiInput ?? {
            spareBudget: reportView.snapshot.spareBudget,
            totalIncome: reportView.snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: reportView.snapshot.netSaving,
            topExpenses: reportView.expenses.map((expense) => ({
              name: getCategoryLabel(expense, locale),
              amount: expense.amount,
            })),
          }),
          locale,
        })
        .then((result) => {
          if (cancelled) return;
          setText(result.text);
          setSource(result.source);
          setLoading(false);
        })
        .catch((cause) => {
          if (!cancelled) {
            setError(t(getErrorTranslationKey(cause)));
            setLoading(false);
          }
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [aiInput, open, locale, reportView, t]);

  return { loading, text, source, error, clearError: () => setError('') };
}
