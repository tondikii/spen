import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  MotionAnimatedView,
  MotionPressable as Pressable,
  motionPresets,
} from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/theme';

export function PlanSection({
  title,
  action,
  children,
  onAction,
  testID,
  menuOpen = false,
}: {
  title: string;
  action: string;
  children: ReactNode;
  onAction?: () => void;
  testID?: string;
  menuOpen?: boolean;
}) {
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      layout={motionPresets.layout}
      style={[styles.section, menuOpen && styles.sectionMenuOpen]}
      testID={testID}
    >
      <View style={styles.sectionTitle}>
        <ThemedText type="sectionHeading">{title}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action} ${title}`}
          hitSlop={8}
          onPress={onAction}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {action}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.card}>{children}</View>
    </MotionAnimatedView>
  );
}

export function EmptyPlan({ message }: { message: string }) {
  return (
    <View style={styles.emptyGoal}>
      <ThemedText type="small" themeColor="muted">
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.six },
  sectionMenuOpen: { elevation: 10, position: 'relative', zIndex: 10 },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  card: { marginTop: 12, paddingBottom: 1 },
  emptyGoal: { paddingVertical: 16 },
});
