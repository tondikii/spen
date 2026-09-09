import { useEffect, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BoxedCard } from '@/components/ui/ui-primitives';
import { MotionChevron, MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Motion } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import { formatMoney } from '@/utils/money';
import { useTranslation } from 'react-i18next';
import type { ReportExpense, ReportView } from '../read';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const ClipPathCompat = ClipPath as unknown as ComponentType<{
  id: string;
  children?: ReactNode;
}>;

export function chartColors(theme: ReturnType<typeof useTheme>) {
  return [theme.expense, theme.gold, theme.pine, theme.muted];
}

export function percentage(amount: number, total: number) {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

type LinePath = { d: string; length: number };

function getLinePath(points: ReportView['netSavingByPeriod']): LinePath {
  if (points.length === 0) return { d: 'M2 110 L318 110', length: 316 };
  const values = points.map((point) => point.netSaving);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const spread = Math.max(max - min, 1);
  const coordinates = values.map((value, index) => {
    const x = points.length === 1 ? 160 : 2 + index * (316 / (points.length - 1));
    const y = 110 - ((value - min) / spread) * 90;
    return { x, y: Math.max(20, Math.min(110, y)) };
  });
  const d = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const length = coordinates.reduce((total, point, index) => {
    if (index === 0) return total;
    const previous = coordinates[index - 1]!;
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);
  return { d, length: Math.max(length, 1) };
}

function useChartReveal(animationKey: string) {
  const reveal = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    cancelAnimation(reveal);
    reveal.value = reduceMotion ? 1 : 0;
    if (!reduceMotion) {
      reveal.value = withTiming(1, { duration: Motion.chartDuration });
    }
    return () => cancelAnimation(reveal);
  }, [animationKey, reduceMotion, reveal]);

  return reveal;
}

export function NetSavingLineChart({
  points,
  color,
}: {
  points: ReportView['netSavingByPeriod'];
  color: string;
}) {
  const path = getLinePath(points);
  const reveal = useChartReveal(
    points.map((point) => `${point.period.id}:${point.netSaving}`).join('|'),
  );
  const animatedClipProps = useAnimatedProps(() => ({
    width: 320 * reveal.value,
  }));

  return (
    <>
      <Defs>
        <ClipPathCompat id="net-saving-reveal">
          <AnimatedRect x="0" y="0" height="120" animatedProps={animatedClipProps} />
        </ClipPathCompat>
      </Defs>
      <G clipPath="url(#net-saving-reveal)">
        <Path d={path.d} fill="none" stroke={color} strokeWidth="3" />
        <Path d={`${path.d} L318 120 L2 120Z`} fill={color} opacity="0.1" />
      </G>
    </>
  );
}

/* eslint-disable react-hooks/immutability -- SVG segment offsets are derived during render. */
export function Donut({ expenses, total }: { expenses: ReportExpense[]; total: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colors = chartColors(theme);
  const radius = 57;
  const circumference = 2 * Math.PI * radius;
  const reveal = useChartReveal(
    `${total}:${expenses.map((item) => `${item.categoryId}:${item.amount}`).join('|')}`,
  );
  let offset = 0;
  return (
    <Svg
      accessible
      accessibilityLabel={t('common.totalExpense', {
        total: formatMoney(total),
        breakdown: expenses
          .map((item) => `${getCategoryLabel(item)} ${formatMoney(item.amount)}`)
          .join(', '),
      })}
      style={styles.donut}
      width={145}
      height={145}
      viewBox="0 0 145 145"
    >
      <Circle cx="72.5" cy="72.5" r={radius} fill="none" stroke={theme.line} strokeWidth="28" />
      {expenses.map((item, index) => {
        const length = total > 0 ? (item.amount / total) * circumference : 0;
        const segment = (
          <DonutSegment
            key={item.categoryId}
            color={colors[index % colors.length]!}
            circumference={circumference}
            length={length}
            offset={offset}
            radius={radius}
            reveal={reveal}
          />
        );
        offset += length;
        return segment;
      })}
    </Svg>
  );
}
/* eslint-enable react-hooks/immutability */

function DonutSegment({
  color,
  circumference,
  length,
  offset,
  radius,
  reveal,
}: {
  color: string;
  circumference: number;
  length: number;
  offset: number;
  radius: number;
  reveal: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [length * reveal.value, circumference - length * reveal.value],
    strokeDashoffset: -offset * reveal.value,
  }));

  return (
    <AnimatedCircle
      cx="72.5"
      cy="72.5"
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth="28"
      transform="rotate(-90 72.5 72.5)"
      animatedProps={animatedProps}
    />
  );
}

export function ChartCard({
  title,
  trailing,
  trailingAction,
  trailingAccessibilityLabel,
  trailingExpanded = false,
  trailingPopover,
  children,
}: {
  title: string;
  trailing?: ReactNode;
  trailingAction?: () => void;
  trailingAccessibilityLabel?: string;
  trailingExpanded?: boolean;
  trailingPopover?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <BoxedCard
      accessible
      accessibilityLabel={`${title}${trailing ? `, ${trailing}` : ''}`}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <ThemedText type="sectionHeading">{title}</ThemedText>
        {trailing && trailingAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={trailingAccessibilityLabel}
            accessibilityState={{ expanded: trailingExpanded }}
            onTouchStart={(event) => event.stopPropagation()}
            onPress={trailingAction}
            hitSlop={8}
          >
            <View style={styles.cardTrailing}>
              <ThemedText type="small" themeColor="muted">
                {trailing}
              </ThemedText>
              <MotionChevron expanded={trailingExpanded} color={theme.muted} size={16} />
            </View>
          </Pressable>
        ) : trailing ? (
          <ThemedText type="small" themeColor="muted">
            {trailing}
          </ThemedText>
        ) : null}
        {trailingPopover}
      </View>
      {children}
    </BoxedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, padding: 18 },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 10,
  },
  cardTrailing: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  donut: { height: 145, width: 145 },
});
