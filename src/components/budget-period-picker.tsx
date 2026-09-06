import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';

import {
  MotionAnimatedView,
  MotionChevron,
  MotionPressable,
  motionPresets,
} from '@/components/motion';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import i18n from '@/i18n';
import { getIntlLocale } from '@/i18n/format';
import { dateOnly, periodBounds } from '@/services/plan-service';

const startDayOptions = Array.from({ length: 31 }, (_, index) => index + 1);

export function BudgetPeriodPicker({
  period,
  startDay,
  onStartDayChange,
  dismissSignal = 0,
  readOnly = false,
}: {
  period: { startDate: string; endDate: string };
  startDay: number;
  onStartDayChange: (day: number) => void | Promise<void>;
  dismissSignal?: number;
  readOnly?: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pendingDay, setPendingDay] = useState(startDay);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- dismissSignal closes an external popover. */
  useEffect(() => {
    setOpen(false);
  }, [dismissSignal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <View style={styles.anchor}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={t('common.chooseReportRange')}
        accessibilityState={{ expanded: open, disabled: readOnly }}
        disabled={readOnly}
        onTouchStart={(event) => event.stopPropagation()}
        onPress={() => {
          setPendingDay(startDay);
          setOpen((current) => !current);
        }}
        style={[styles.dropdown, { borderColor: theme.line }]}
      >
        <ThemedText type="code" themeColor="muted" style={styles.label}>
          {formatBudgetPeriodLabel(
            readOnly ? period : previewPeriod(startDay),
            startDay,
          ).replace('⌄', '')}
        </ThemedText>
        <MotionChevron expanded={open} color={theme.muted} size={16} />
      </MotionPressable>
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <MotionAnimatedView
            entering={motionPresets.itemEntering}
            onTouchStart={(event) => event.stopPropagation()}
            style={[styles.sheet, { backgroundColor: theme.card }]}
          >
            <ThemedText type="sectionHeading">{t('common.periodPreview')}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              {formatBudgetPeriodLabel(previewPeriod(pendingDay), pendingDay)}
            </ThemedText>
            <ThemedText type="small" themeColor="muted">
              {t('common.shortMonthNote')}
            </ThemedText>
            <View style={styles.grid}>
              {startDayOptions.map((day) => (
                <MotionPressable
                  key={day}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.date', { date: day })}
                  accessibilityState={{ selected: pendingDay === day }}
                  onPress={() => setPendingDay(day)}
                  style={[
                    styles.option,
                    { borderColor: theme.line },
                    pendingDay === day && { backgroundColor: theme.mint, borderColor: theme.pine },
                  ]}
                >
                  <ThemedText type="smallBold" themeColor={pendingDay === day ? 'pine' : 'ink'}>
                    {day}
                  </ThemedText>
                </MotionPressable>
              ))}
            </View>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={t('common.applyPeriod')}
              onPress={() => {
                if (pendingDay === startDay) {
                  setOpen(false);
                  return;
                }
                setOpen(false);
                setConfirmOpen(true);
              }}
              style={[styles.apply, { backgroundColor: theme.pine }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                {t('common.applyPeriod')}
              </ThemedText>
            </MotionPressable>
          </MotionAnimatedView>
        </View>
      </Modal>
      <ConfirmationModal
        visible={confirmOpen}
        title={t('common.rebasePeriodTitle')}
        message={t('common.rebasePeriodCopy')}
        confirmLabel={t('common.applyPeriod')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          setOpen(false);
          await onStartDayChange(pendingDay);
        }}
      />
    </View>
  );
}

export function formatBudgetPeriodLabel(
  period: { startDate: string; endDate: string },
  startDay: number,
) {
  const start = new Date(`${period.startDate}T12:00:00`);
  const end = new Date(`${period.endDate}T12:00:00`);
  const locale = getIntlLocale(i18n.language === 'en' ? 'en' : 'id');
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  if (start.getFullYear() !== end.getFullYear()) {
    const withYear = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${withYear.format(start)}–${withYear.format(end)}`;
  }
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

function previewPeriod(startDay: number, today = dateOnly()) {
  return periodBounds(startDay, today);
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 10, padding: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    alignItems: 'center',
    borderRadius: Radius.small,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: '14.2857%',
  },
  apply: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    minHeight: 46,
    justifyContent: 'center',
  },
});
