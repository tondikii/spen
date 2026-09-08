import { Modal, View } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { MotionAnimatedView, MotionPulse, MotionPressable as Pressable, motionPresets } from '@/components/motion';

type Props = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  source?: 'ai' | 'fallback';
  title?: string;
  fallbackNote?: string;
  loadingTitle?: string;
  loadingSubtitle?: string;
  children?: React.ReactNode;
};

export function AiSheet({ open, onClose, loading, source, title, fallbackNote, loadingTitle, loadingSubtitle, children }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Modal transparent animationType="slide" visible={open} onRequestClose={onClose}>
      <Pressable wrapperStyle={{ flex: 1 }} style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <MotionAnimatedView entering={motionPresets.itemEntering} style={[styles.sheet, { backgroundColor: theme.card }]}>
          <ThemedText type="sectionHeading">✦ {title ?? t('common.aiSuggestion')}</ThemedText>
          {loading ? (
            <MotionPulse style={styles.loading}>
              <ThemedText style={[styles.loadingGlyph, { color: theme.pine }]}>✦</ThemedText>
              <ThemedText type="smallBold">{loadingTitle ?? t('common.aiReading')}</ThemedText>
              <ThemedText type="small" themeColor="muted">
                {loadingSubtitle ?? t('common.holdOn')}
              </ThemedText>
            </MotionPulse>
          ) : (
            <>
              {source === 'fallback' && fallbackNote && (
                <ThemedText type="small" themeColor="muted">
                  {fallbackNote}
                </ThemedText>
              )}
              {children}
            </>
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
  sheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 21, gap: 12 },
  loading: { alignItems: 'center', paddingVertical: 24 },
  loadingGlyph: { fontSize: 29, marginBottom: 12 },
  closeSheet: { alignItems: 'center', borderRadius: 13, padding: 13, marginTop: 8 },
});
