import { useEffect, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type AccessibilityProps,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Motion } from '@/constants/theme';

/**
 * Shared motion builders. Keep these outside render functions so Reanimated
 * can reuse the builders instead of rebuilding them for every render.
 */
export const motionPresets = {
  screenEntering: FadeIn.duration(Motion.screenDuration).easing(Easing.out(Easing.cubic)),
  screenExiting: FadeOut.duration(Motion.screenDuration).easing(Easing.in(Easing.cubic)),
  itemEntering: FadeInDown.duration(Motion.itemDuration).easing(Easing.out(Easing.cubic)),
  itemExiting: FadeOut.duration(Motion.itemDuration).easing(Easing.in(Easing.cubic)),
  layout: LinearTransition.duration(Motion.layoutDuration).easing(Easing.inOut(Easing.cubic)),
} as const;

type MotionPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: ReactNode;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  wrapperStyle?: StyleProp<ViewStyle>;
  feedback?: 'scale' | 'opacity' | 'none';
};

/**
 * Press feedback for every interactive surface. The Pressable keeps the hit
 * target while the animated wrapper updates only native/UI-thread styles.
 */
export function MotionPressable({
  children,
  style,
  wrapperStyle,
  feedback = 'scale',
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: MotionPressableProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const setPressed = (pressed: boolean) => {
    if (reduceMotion || feedback === 'none') {
      // Reanimated SharedValues are intentionally mutable; this is consumed on the UI thread.
      // eslint-disable-next-line react-hooks/immutability
      scale.value = 1;
      // eslint-disable-next-line react-hooks/immutability
      opacity.value = 1;
      return;
    }

    scale.value = withSpring(pressed && feedback === 'scale' ? Motion.pressScale : 1, {
      damping: 20,
      stiffness: 420,
    });
    opacity.value = withTiming(pressed && feedback === 'opacity' ? 0.86 : 1, {
      duration: Motion.pressDuration,
    });
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[wrapperStyle, animatedStyle]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function MotionScreen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={motionPresets.screenEntering}
      exiting={motionPresets.screenExiting}
      style={[styles.screen, style]}
    >
      {children}
    </Animated.View>
  );
}

export function MotionPulse({
  children,
  style,
  active = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.5,
    transform: [{ scale: 1 + progress.value * 0.25 }],
  }));

  useEffect(() => {
    cancelAnimation(progress);
    progress.value =
      reduceMotion || !active
        ? 0
        : withRepeat(withTiming(1, { duration: Motion.aiPulseDuration / 2 }), -1, true);
    return () => cancelAnimation(progress);
  }, [active, progress, reduceMotion]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function MotionProgressBar({
  value,
  color,
  trackColor,
  style,
  accessibilityLabel,
  accessibilityRole,
  accessibilityValue,
}: {
  value: number;
  color: string;
  trackColor: string;
  style?: StyleProp<ViewStyle>;
} & Pick<AccessibilityProps, 'accessibilityLabel' | 'accessibilityRole' | 'accessibilityValue'>) {
  const progress = useSharedValue(0);
  const clampedValue = Math.max(0, Math.min(100, value));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    progress.value = reduceMotion
      ? clampedValue
      : withTiming(clampedValue, { duration: Motion.chartDuration });
  }, [clampedValue, progress, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={accessibilityValue}
      style={[styles.progressTrack, { backgroundColor: trackColor }, style]}
    >
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, fillStyle]} />
    </Animated.View>
  );
}

export function MotionChevron({
  expanded,
  color = '#7B8882',
  size = 22,
}: {
  expanded: boolean;
  color?: string;
  size?: number;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? expanded
        ? 1
        : 0
      : withTiming(expanded ? 1 : 0, { duration: Motion.toggleDuration });
  }, [expanded, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <Animated.View accessible={false} style={animatedStyle}>
      <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>⌄</Text>
    </Animated.View>
  );
}

export function MotionCollapsible({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <MotionAnimatedView
      entering={motionPresets.itemEntering}
      exiting={motionPresets.itemExiting}
      layout={motionPresets.layout}
      style={style}
    >
      {children}
    </MotionAnimatedView>
  );
}

export function MotionSwitch({
  value,
  onChange,
  activeTrackColor,
  inactiveTrackColor,
  thumbColor = '#FFFFFF',
  accessibilityLabel,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  activeTrackColor: string;
  inactiveTrackColor: string;
  thumbColor?: string;
  accessibilityLabel: string;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? value
        ? 1
        : 0
      : withTiming(value ? 1 : 0, { duration: Motion.toggleDuration });
  }, [progress, reduceMotion, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 15 }],
  }));

  return (
    <MotionPressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      feedback="none"
      onPress={() => onChange(!value)}
      style={[styles.switch, { backgroundColor: value ? activeTrackColor : inactiveTrackColor }]}
    >
      <Animated.View style={[styles.switchThumb, { backgroundColor: thumbColor }, thumbStyle]} />
    </MotionPressable>
  );
}

export const MotionAnimatedView = Animated.View;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  progressTrack: { borderRadius: 99, height: 5, overflow: 'hidden' },
  progressFill: { borderRadius: 99, height: '100%' },
  switch: { borderRadius: 99, height: 22, padding: 3, width: 37 },
  switchThumb: { borderRadius: 99, height: 16, width: 16 },
});
