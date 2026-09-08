import { Modal, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  MotionPulse,
  motionPresets,
} from '@/components/motion';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared bottom sheet for AI features (plan suggestions, report insight):
 * overlay, heading, loading block and the closing action. The feature
 * passes its ready state as children.
 */
export function AiSheetModal({
  visible,
  onClose,
  loading,
  heading,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  heading: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
      >
        <MotionAnimatedView
          entering={motionPresets.itemEntering}
          style={[styles.sheet, { backgroundColor: theme.card }]}
        >
          <ThemedText type="sectionHeading">✦ {heading}</ThemedText>
          {loading ? (
            <MotionPulse style={styles.loading}>
              <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
              <ThemedText type="smallBold">{t('common.aiReading')}</ThemedText>
              <ThemedText type="small" themeColor="muted">
                {t('common.holdOn')}
              </ThemedText>
            </MotionPulse>
          ) : (
            <View>{children}</View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.closeSuggestion')}
            onPress={onClose}
            style={[styles.closeSheet, { backgroundColor: theme.pine }]}
          >
            <ThemedText type="smallBold" style={{ color: theme.heroText }}>
              {t('common.understand')}
            </ThemedText>
          </Pressable>
        </MotionAnimatedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, gap: 8, padding: 21 },
  loading: { alignItems: 'center', paddingVertical: 35 },
  loadingGlyph: { fontSize: 28, marginBottom: 12 },
  closeSheet: {
    alignItems: 'center',
    borderRadius: 13,
    marginTop: 8,
    padding: 13,
  },
});
