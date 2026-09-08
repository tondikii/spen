import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/ui/category-icon';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { MotionAnimatedView, MotionProgressBar, motionPresets } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import { formatMoney } from '@/lib/money';
import type { BudgetPlanItem, Category } from '@/types/domain';

import { PlanActionMenu } from './plan-action-menu';

export type PlanItemState = {
  realizedAmount: number;
  progressPercent: number;
  overBudget: boolean;
};

export function PlanItem(props: {
  item: BudgetPlanItem;
  category?: Category;
  state?: PlanItemState;
  action: string;
  color: string;
  onAction: (item: BudgetPlanItem) => void;
  onEdit: () => void;
  onDelete?: (item: BudgetPlanItem) => void | Promise<void>;
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const { t } = useTranslation();
  const [confirmation, setConfirmation] = useState(false);
  const itemName = props.category ? getCategoryLabel(props.category) : props.item.name;
  return (
    <>
      <PlanItemContent {...props} onRequestDelete={() => setConfirmation(true)} />
      <ConfirmationModal
        visible={confirmation}
        title={t('common.planDeleteConfirm')}
        message={t('common.planDeleteCopy', { name: itemName })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmation(false)}
        onConfirm={async () => {
          setConfirmation(false);
          await props.onDelete?.(props.item);
        }}
      />
    </>
  );
}

function PlanItemContent({
  item,
  category,
  state,
  action,
  color,
  onAction,
  onEdit,
  onRequestDelete,
  onMenuOpenChange,
  dismissSignal = 0,
}: {
  item: BudgetPlanItem;
  category?: Category;
  state?: PlanItemState;
  action: string;
  color: string;
  onAction: (item: BudgetPlanItem) => void;
  onPayment?: (item: BudgetPlanItem, paid: boolean) => void | Promise<void>;
  onEdit: () => void;
  onRequestDelete: () => void;
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      onMenuOpenChange?.(open);
    },
    [onMenuOpenChange],
  );
  const itemName = category ? getCategoryLabel(category) : item.name;
  const amount = state?.realizedAmount ?? 0;
  const income = item.type === 'income';
  const incomeAmount = item.targetAmount > 0 ? item.targetAmount : amount;
  const progress = state?.progressPercent ?? 0;
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      exiting={motionPresets.itemExiting}
      layout={motionPresets.layout}
      style={[styles.item, { borderBottomColor: theme.line }, menuOpen && styles.planItemOpen]}
    >
      <View style={styles.planItemTop}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: income ? theme.incomeBackground : theme.expenseBackground },
          ]}
        >
          <CategoryIcon name={category?.icon} color={income ? theme.income : theme.expense} />
        </View>
        <View style={styles.itemCopy}>
          <ThemedText type="smallBold" style={styles.itemName}>
            {itemName}
          </ThemedText>
          {income ? (
            <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
              {t('common.planItemIncomeSource')}
            </ThemedText>
          ) : null}
        </View>
        <View testID={`plan-value-actions-${item.id}`} style={styles.itemValueActions}>
          <PlanActionMenu
            label={itemName}
            onOpenChange={handleMenuOpenChange}
            dismissSignal={dismissSignal}
            actions={[
              ...(!income && action
                ? [
                    {
                      icon: '→',
                      label: action,
                      onPress: () => onAction(item),
                      tone: 'primary' as const,
                    },
                  ]
                : []),
              { icon: '✎', label: t('common.edit'), onPress: onEdit },
              {
                icon: '×',
                label: t('common.delete'),
                onPress: onRequestDelete,
                tone: 'danger' as const,
              },
            ]}
          />
          <ThemedText
            type="code"
            style={[styles.itemValueText, { color: income ? theme.income : theme.expense }]}
          >
            {income
              ? formatMoney(incomeAmount)
              : `${formatMoney(amount)} / ${formatMoney(item.targetAmount)}`}
          </ThemedText>
        </View>
      </View>
      {!income && <Progress value={progress} color={state?.overBudget ? theme.expense : color} />}
    </MotionAnimatedView>
  );
}

export function Progress({ value, color }: { value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.progressRow}>
      <MotionProgressBar
        value={value}
        color={color}
        trackColor={theme.line}
        style={styles.progress}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.min(Math.max(value, 0), 100) }}
      />
      <ThemedText type="code" themeColor="muted" style={styles.progressPercent}>
        {Math.max(0, Math.round(value))}%
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  planItemOpen: { elevation: 100, zIndex: 100 },
  planItemTop: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  categoryIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 35,
    justifyContent: 'center',
    width: 35,
  },
  itemCopy: { flex: 1, minWidth: 0 },
  itemValueActions: {
    alignItems: 'flex-end',
    elevation: 100,
    flexDirection: 'column',
    gap: 1,
    position: 'relative',
    zIndex: 100,
  },
  itemName: { fontSize: 12, lineHeight: 16 },
  itemSubtitle: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  itemValueText: { flexShrink: 0, fontSize: 10, lineHeight: 14, letterSpacing: -0.4 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  progress: { flex: 1, borderRadius: 9, height: 5, overflow: 'hidden' },
  progressPercent: { minWidth: 34, textAlign: 'right' },
});
