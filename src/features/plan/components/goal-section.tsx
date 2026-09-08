import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SheetModal } from './sheet-modal';
import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  motionPresets,
} from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { WalletPicker } from '@/components/ui/wallet-picker';
import { FieldLabel, MoneyField } from '@/components/ui/form-fields';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/utils/money';
import { formatMoneyInput, parseMoneyInput } from '@/utils/money-input';
import type { Goal, Wallet } from '@/types/domain';

import { PlanActionMenu } from './plan-action-menu';
import { EmptyPlan, PlanSection } from './plan-section';
import { Progress } from './plan-item';
import { planSheetStyles } from './plan-sheet-styles';

type GoalDraft = Omit<Goal, 'id' | 'archived'>;
type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
};

export function GoalSection({
  goals,
  wallets,
  onSave,
  onArchive,
  onOpenSaveAction,
  onWithdraw,
  menuOpen = false,
  onMenuOpenChange,
  dismissSignal = 0,
}: {
  goals: Goal[];
  wallets: Wallet[];
  onSave?: (goal: Goal | null, draft: GoalDraft) => void | Promise<void>;
  onArchive?: (goal: Goal) => void | Promise<void>;
  onOpenSaveAction: (goal: Goal) => void;
  onWithdraw?: (goal: Goal, amount: number) => void | Promise<void>;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [editor, setEditor] = useState<Goal | 'new' | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const openNew = () => setEditor('new');
  const activeWallets = wallets.filter((wallet) => !wallet.archived);
  return (
    <>
      <PlanSection
        title={t('common.goal')}
        action={t('common.add')}
        menuOpen={menuOpen}
        onAction={openNew}
      >
        {goals.length === 0 ? (
          <EmptyPlan message={t('common.noRecords')} />
        ) : (
          goals.map((goal) => {
            const saved = wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0;
            const achieved = saved >= goal.targetAmount;
            return (
              <MotionAnimatedView
                key={goal.id}
                entering={motionPresets.itemEntering}
                exiting={motionPresets.itemExiting}
                layout={motionPresets.layout}
                style={[styles.goal, { borderBottomColor: theme.line }]}
              >
                <View style={styles.planItemTop}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.walletGold }]}>
                    <ThemedText style={{ color: theme.gold }}>✦</ThemedText>
                  </View>
                  <View style={styles.itemCopy}>
                    <ThemedText type="smallBold" style={styles.itemName}>
                      {goal.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="muted" style={styles.itemSubtitle}>
                      {t('common.goalContributionSummary', {
                        amount: formatMoney(goal.monthlyContribution),
                      })}
                    </ThemedText>
                  </View>
                  <View style={styles.itemValueActions}>
                    <ThemedText type="code" style={[styles.itemValueText, { color: theme.gold }]}>
                      {formatMoney(saved)} / {formatMoney(goal.targetAmount)}
                    </ThemedText>
                    <PlanActionMenu
                      label={goal.name}
                      onOpenChange={onMenuOpenChange}
                      dismissSignal={dismissSignal}
                      actions={[
                        { icon: '✎', label: t('common.edit'), onPress: () => setEditor(goal) },
                        {
                          icon: '+',
                          label: t('common.saveGoalMoney'),
                          onPress: () => onOpenSaveAction(goal),
                          tone: 'primary',
                        },
                        {
                          icon: '↙',
                          label: t('common.withdraw'),
                          onPress: () =>
                            setConfirmation({
                              title: t('common.emergencyWithdrawal'),
                              message: t('common.emergencyWithdrawalCopy', {
                                amount: formatMoney(saved),
                              }),
                              confirmLabel: t('common.withdraw'),
                              onConfirm: () => onWithdraw?.(goal, saved),
                            }),
                          tone: 'danger',
                        },
                        {
                          icon: '—',
                          label: t('common.archive'),
                          onPress: () =>
                            setConfirmation({
                              title: t('common.archiveGoalConfirm'),
                              message: t('common.archiveGoalCopy'),
                              confirmLabel: t('common.archive'),
                              onConfirm: () => onArchive?.(goal),
                            }),
                        },
                      ]}
                    />
                  </View>
                </View>
                <Progress
                  value={Math.min((saved / goal.targetAmount) * 100, 100)}
                  color={achieved ? theme.income : theme.gold}
                />
                <ThemedText type="small" themeColor="muted" style={styles.goalStatus}>
                  {achieved
                    ? t('common.achieved')
                    : t('common.goalTargetSummary', { amount: formatMoney(goal.targetAmount) })}
                </ThemedText>
              </MotionAnimatedView>
            );
          })
        )}
      </PlanSection>
      {editor && (
        <GoalFormModal
          goal={editor === 'new' ? null : editor}
          wallets={activeWallets}
          onClose={() => setEditor(null)}
          onSave={async (draft) => {
            await onSave?.(editor === 'new' ? null : editor, draft);
            setEditor(null);
          }}
        />
      )}
      <ConfirmationModal
        visible={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? t('common.confirm')}
        cancelLabel={t('common.cancel')}
        destructive
        onCancel={() => setConfirmation(null)}
        onConfirm={async () => {
          const action = confirmation?.onConfirm;
          setConfirmation(null);
          await action?.();
        }}
      />
    </>
  );
}

function GoalFormModal({
  goal,
  wallets,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  wallets: Wallet[];
  onClose: () => void;
  onSave: (draft: GoalDraft) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? formatMoneyInput(goal.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '');
  const [monthly, setMonthly] = useState(goal ? formatMoneyInput(goal.monthlyContribution) : '');
  const [walletId, setWalletId] = useState(goal?.walletId ?? wallets[0]?.id ?? null);
  const submit = () => {
    const targetAmount = parseMoneyInput(target);
    if (!name.trim() || !walletId || !targetAmount || targetAmount < 1) return;
    void onSave({
      name: name.trim(),
      targetAmount,
      targetDate: targetDate.trim() || null,
      walletId,
      monthlyContribution: parseMoneyInput(monthly) || 0,
    });
  };
  return (
    <SheetModal
      title={goal ? t('common.editGoal', { name: goal.name }) : t('common.goalNew')}
      closeLabel={t('common.closeGoalForm')}
      onClose={onClose}
      keyboardAvoiding
      sheetStyle={planSheetStyles.goalSheet}
    >
      <ScrollView
        style={planSheetStyles.sheetScroll}
        contentContainerStyle={planSheetStyles.goalSheetContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <ThemedText type="small" themeColor="muted">
          {t('common.goalProgressCopy')}
        </ThemedText>
        <FieldLabel>{t('common.goalName')}</FieldLabel>
        <ThemedInput
          accessibilityLabel={t('common.goalName')}
          placeholder={t('common.goalNamePlaceholder')}
          value={name}
          onChangeText={setName}
          style={planSheetStyles.goalInput}
        />
        <MoneyField
          label={t('common.targetNominal')}
          value={target}
          onChangeText={(value) => setTarget(formatMoneyInput(value))}
          accessibilityLabel={t('common.goalTarget')}
          inputStyle={planSheetStyles.goalInput}
        />
        <FieldLabel>{t('common.goalWallet')}</FieldLabel>
        <WalletPicker wallets={wallets} selected={walletId} onSelect={setWalletId} />
        <FieldLabel>{t('common.targetOptional')}</FieldLabel>
        <ThemedInput
          accessibilityLabel={t('common.goalDate')}
          placeholder="YYYY-MM-DD"
          value={targetDate}
          onChangeText={setTargetDate}
          style={planSheetStyles.goalInput}
        />
        <MoneyField
          label={t('common.monthlyContributionLabel')}
          value={monthly}
          onChangeText={(value) => setMonthly(formatMoneyInput(value))}
          accessibilityLabel={t('common.goalContribution')}
          inputStyle={planSheetStyles.goalInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.saveGoal')}
          onPress={submit}
          style={[planSheetStyles.saveGoal, { backgroundColor: theme.pine }]}
        >
          <ThemedText type="smallBold" style={{ color: theme.heroText }}>
            {goal ? t('common.saveChanges') : t('common.saveGoal')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  goal: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
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
  goalStatus: { fontSize: 10, lineHeight: 14 },
});
