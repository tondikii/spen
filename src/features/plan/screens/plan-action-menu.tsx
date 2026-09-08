import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  motionPresets,
} from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type PlanAction = {
  icon?: string;
  label: string;
  onPress: () => void | Promise<void>;
  tone?: 'default' | 'danger' | 'primary';
};

export function PlanActionMenu({
  label,
  actions,
  onOpenChange,
  dismissSignal = 0,
}: {
  label: string;
  actions: PlanAction[];
  onOpenChange?: (open: boolean) => void;
  dismissSignal?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect -- dismissSignal closes an external menu. */
  useEffect(() => {
    setOpen(false);
    onOpenChange?.(false);
  }, [dismissSignal, onOpenChange]);
  /* eslint-enable react-hooks/set-state-in-effect */
  return (
    <View style={[styles.actionMenuAnchor, open && styles.actionMenuAnchorOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.moreActions')} ${label}`}
        accessibilityState={{ expanded: open }}
        onTouchStart={(event) => event.stopPropagation()}
        onPress={() => {
          setOpen((current) => {
            onOpenChange?.(!current);
            return !current;
          });
        }}
        style={styles.kebabButton}
        hitSlop={8}
      >
        <ThemedText type="subtitle" themeColor="muted" style={styles.kebabGlyph}>
          •••
        </ThemedText>
      </Pressable>
      {open && (
        <MotionAnimatedView
          entering={motionPresets.itemEntering}
          onTouchStart={(event) => event.stopPropagation()}
          style={[styles.actionMenu, { backgroundColor: theme.card, borderColor: theme.line }]}
        >
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={`${action.label} ${label}`}
              onPress={() => {
                setOpen(false);
                onOpenChange?.(false);
                void action.onPress();
              }}
              onTouchStart={(event) => event.stopPropagation()}
              style={[styles.actionMenuItem, { borderBottomColor: theme.line }]}
            >
              <ThemedText
                type="smallBold"
                style={{ color: action.tone === 'danger' ? theme.expense : theme.ink }}
              >
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </MotionAnimatedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kebabButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  kebabGlyph: { fontSize: 15, letterSpacing: 1, lineHeight: 18, transform: [{ translateY: -2 }] },
  actionMenuAnchor: { position: 'relative' },
  actionMenuAnchorOpen: { elevation: 100, zIndex: 100 },
  actionMenu: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    position: 'absolute',
    right: 0,
    top: 30,
    width: 148,
    elevation: 100,
    zIndex: 100,
  },
  actionMenuItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 11,
  },
});
