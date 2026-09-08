import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MotionAnimatedView, MotionPressable, motionPresets } from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared bottom-sheet scaffolding: transparent modal + dimmed overlay that
 * closes on tap, an optional titled header with a close button, and an
 * optional keyboard-avoiding container for form sheets.
 */
export function SheetModal({
  title,
  closeLabel,
  onClose,
  children,
  animated = false,
  keyboardAvoiding = false,
  sheetStyle,
}: {
  title?: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** Wrap the sheet content with the standard enter animation. */
  animated?: boolean;
  /** Wrap the sheet in a keyboard-avoiding container for forms with inputs. */
  keyboardAvoiding?: boolean;
  sheetStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const sheet = (
    <View style={[styles.sheet, { backgroundColor: theme.card }, sheetStyle]}>
      {title && (
        <View style={styles.header}>
          <ThemedText type="sectionHeading">{title}</ThemedText>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
          >
            <ThemedText type="subtitle" themeColor="muted">
              ×
            </ThemedText>
          </MotionPressable>
        </View>
      )}
      {children}
    </View>
  );

  let content: ReactNode = animated ? (
    <MotionAnimatedView entering={motionPresets.itemEntering} style={styles.fill}>
      {sheet}
    </MotionAnimatedView>
  ) : (
    sheet
  );

  if (keyboardAvoiding) {
    content = (
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <MotionPressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
      >
        {content}
      </MotionPressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboard: { flex: 1, justifyContent: 'flex-end' },
  fill: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    gap: Spacing.two,
    padding: 21,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});