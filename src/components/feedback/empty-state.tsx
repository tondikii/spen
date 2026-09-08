import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/ui/themed-text';
import { PrimaryButton } from '@/components/ui/ui-primitives';
import { Radius } from '@/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Empty-state block: a glyph, a title, an optional muted description and an
 * optional primary action. Shared by Home, History, Daily, Report and DataState.
 */
export function EmptyState({
  glyph = '◌',
  title,
  description,
  actionLabel,
  onAction,
  boxed = false,
  titleType = 'smallBold',
  style,
}: {
  glyph?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Render the glyph inside a tinted rounded container. */
  boxed?: boolean;
  titleType?: ThemedTextProps['type'];
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {boxed ? (
        <View style={[styles.glyphBox, { backgroundColor: theme.mint }]}>
          <ThemedText style={[styles.boxedGlyph, { color: theme.pine }]}>{glyph}</ThemedText>
        </View>
      ) : (
        <ThemedText style={[styles.glyph, { color: theme.pine }]}>{glyph}</ThemedText>
      )}
      <ThemedText type={titleType}>{title}</ThemedText>
      {description && (
        <ThemedText type="small" themeColor="muted" style={styles.description}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <PrimaryButton label={actionLabel} onPress={onAction} accessibilityLabel={actionLabel} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingHorizontal: 15, paddingVertical: 34 },
  glyph: { fontSize: 38 },
  description: { textAlign: 'center' },
  glyphBox: {
    alignItems: 'center',
    borderRadius: Radius.large,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  boxedGlyph: { fontSize: 28 },
});
