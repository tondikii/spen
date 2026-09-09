import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AiSheetModal } from '@/components/ui/ai-sheet-modal';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { BudgetSuggestion } from '@/lib/ai-service';

/** Bottom sheet saran AI layar Rencana: fallback lokal, daftar suggestion, dan status applied. */
export function PlanAiSheet({
  visible,
  onClose,
  loading,
  source,
  suggestions,
  applied,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  source: 'ai' | 'fallback';
  suggestions: BudgetSuggestion[];
  applied: string[];
  onApply: (suggestion: BudgetSuggestion) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <AiSheetModal
      visible={visible}
      onClose={onClose}
      loading={loading}
      heading={t('common.aiSuggestion')}
    >
      {source === 'fallback' && (
        <ThemedText type="small" themeColor="muted">
          {t('common.aiUnavailablePlan')}
        </ThemedText>
      )}
      {suggestions.map((suggestion) => (
        <View key={suggestion.title} style={[styles.suggestion, { borderTopColor: theme.line }]}>
          <ThemedText type="small" style={styles.suggestionText}>
            {suggestion.title}
            {`\n`}
            {suggestion.description}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.applySuggestion', { title: suggestion.title })}
            onPress={() => void onApply(suggestion)}
          >
            <ThemedText
              type="smallBold"
              themeColor={applied.includes(suggestion.title) ? 'income' : 'pine'}
            >
              {applied.includes(suggestion.title) ? `✓ ${t('common.applied')}` : t('common.apply')}
            </ThemedText>
          </Pressable>
        </View>
      ))}
    </AiSheetModal>
  );
}

const styles = StyleSheet.create({
  suggestion: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 15,
  },
  suggestionText: { flex: 1 },
});
