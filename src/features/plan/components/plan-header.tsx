import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BudgetPeriodPicker } from '@/components/ui/budget-period-picker';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Fonts, Radius } from '@/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Header layar Rencana: judul, pemilih periode budget, dan tombol saran AI.
 * Menahan startDay lokal karena hanya dipakai BudgetPeriodPicker (sinkron
 * dengan pola ReportHeader).
 */
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
  const theme = useTheme();
  const { t } = useTranslation();
  const [startDay, setStartDay] = useState(configuredStartDay);
  return (
    <View style={styles.header}>
      <View>
        <ThemedText type="title" style={styles.title}>
          {t('common.plan')}
        </ThemedText>
        <BudgetPeriodPicker
          period={period}
          startDay={startDay}
          dismissSignal={dismissSignal}
          onStartDayChange={(day) => {
            setStartDay(day);
            return onPeriodStartDayChange(day);
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.aiSuggestion')}
        accessibilityHint={t('common.aiSuggestion')}
        onPress={onOpenAi}
        wrapperStyle={styles.aiAction}
        style={[styles.aiButton, { borderColor: theme.line, backgroundColor: theme.mint }]}
      >
        <ThemedText
          type="smallBold"
          themeColor="pine"
          style={styles.aiButtonText}
          numberOfLines={1}
        >
          ✦ {t('common.aiSuggestion')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 29,
    lineHeight: 31,
    letterSpacing: -1.16,
    marginBottom: 5,
  },
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
