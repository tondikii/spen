import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/use-locale';
import { getErrorTranslationKey } from '@/lib/app-error';
import { aiService, type BudgetAIInput, type BudgetSuggestion } from '@/services/ai-service';
import type { BudgetSnapshot } from '@/types/domain';

type PlanAiSnapshot = Pick<
  BudgetSnapshot,
  'spareBudget' | 'totalIncome' | 'netSaving' | 'goalBalance'
>;

/**
 * AI suggestion state machine for the plan screen: opens the sheet,
 * debounces the request, tracks loading/source/error and the applied
 * suggestions. Falls back to the deterministic suggestion (ADR-0002).
 */
export function usePlanAi({
  aiInput,
  snapshot,
  onSuggestionApply,
}: {
  aiInput?: BudgetAIInput;
  snapshot: PlanAiSnapshot;
  onSuggestionApply: (suggestion: BudgetSuggestion) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [source, setSource] = useState<'ai' | 'fallback'>('fallback');
  const [error, setError] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect -- opening the sheet starts its loading state. */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      void aiService
        .suggestBudget({
          ...(aiInput ?? {
            spareBudget: snapshot.spareBudget,
            totalIncome: snapshot.totalIncome,
            fixedExpense: 0,
            goalContributions: 0,
            netSaving: snapshot.netSaving,
          }),
          locale,
        })
        .then((result) => {
          if (cancelled) return;
          setSuggestions(result.suggestions);
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
  }, [
    aiInput,
    open,
    locale,
    snapshot.goalBalance,
    snapshot.netSaving,
    snapshot.spareBudget,
    snapshot.totalIncome,
    t,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const applySuggestion = async (suggestion: BudgetSuggestion) => {
    try {
      await onSuggestionApply(suggestion);
      setApplied((current) =>
        current.includes(suggestion.title) ? current : [...current, suggestion.title],
      );
    } catch (cause) {
      setError(t(getErrorTranslationKey(cause)));
    }
  };

  return {
    open,
    openAi: () => setOpen(true),
    closeAi: () => setOpen(false),
    loading,
    suggestions,
    source,
    error,
    applied,
    applySuggestion,
  };
}
