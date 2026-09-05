import { Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { MotionAnimatedView, MotionPressable, motionPresets } from '@/components/motion';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <MotionAnimatedView
          entering={motionPresets.itemEntering}
          style={[styles.card, { backgroundColor: theme.card }]}
        >
          <ThemedText type="sectionHeading">{title}</ThemedText>
          <ThemedText type="default" themeColor="muted" style={styles.message}>
            {message}
          </ThemedText>
          <View style={styles.actions}>
            {cancelLabel && (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
                onPress={onCancel}
                style={styles.cancel}
              >
                <ThemedText type="smallBold" themeColor="pine">
                  {cancelLabel}
                </ThemedText>
              </MotionPressable>
            )}
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              onPress={() => {
                void onConfirm();
              }}
              style={[
                styles.confirm,
                { backgroundColor: destructive ? theme.expense : theme.pine },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.heroText }}>
                {confirmLabel}
              </ThemedText>
            </MotionPressable>
          </View>
        </MotionAnimatedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Spacing.four },
  card: {
    borderRadius: Radius.medium,
    gap: Spacing.two,
    maxWidth: 390,
    padding: Spacing.four,
    width: '100%',
  },
  message: { lineHeight: 22 },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
    marginTop: Spacing.two,
  },
  cancel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.two },
  confirm: {
    borderRadius: Radius.small,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
});
