import { ScrollView, View, StyleSheet } from 'react-native';
import { useMemo } from 'react';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { MotionPressable as Pressable } from '@/components/motion';
import { getCategoryLabel } from '@/i18n/categories';
import type { Category } from '@/types/domain';
import { chunk } from '@/lib/array';

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  columns?: number;
  emptyText?: string;
};

export function CategoryGrid({ categories, selectedId, onSelect, columns = 4, emptyText }: Props) {
  const theme = useTheme();
  const rows = useMemo(() => {
    const r: (Category | null)[][] = [];
    for (let i = 0; i < categories.length; i += columns) {
      const row = categories.slice(i, i + columns) as (Category | null)[];
      while (row.length < columns) row.push(null);
      r.push(row);
    }
    return r;
  }, [categories, columns]);

  if (categories.length === 0 && emptyText) {
    return (
      <ThemedText type="small" style={{ color: theme.expense }}>
        {emptyText}
      </ThemedText>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          wrapperStyle={styles.cell}
          accessibilityRole="button"
          onPress={() => onSelect(category.id)}
          style={[
            styles.choice,
            {
              borderColor: selectedId === category.id ? theme.pine : theme.line,
              backgroundColor: selectedId === category.id ? theme.mint : theme.card,
            },
          ]}
        >
          <CategoryIcon name={category.icon} color={theme.pine} size={18} />
          <ThemedText type="smallBold" style={styles.name}>
            {getCategoryLabel(category)}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function IconGrid({
  icons,
  selected,
  onSelect,
  columns = 5,
}: {
  icons: readonly string[];
  selected: string;
  onSelect: (icon: string) => void;
  columns?: number;
}) {
  const theme = useTheme();
  const rows = useMemo(() => chunk([...icons], columns), [icons, columns]);
  return (
    <ScrollView style={styles.iconScroll} contentContainerStyle={styles.iconGrid} nestedScrollEnabled showsVerticalScrollIndicator>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.iconRow}>
          {row.map((icon) => (
            <Pressable
              key={icon}
              wrapperStyle={styles.iconCell}
              accessibilityRole="button"
              onPress={() => onSelect(icon)}
              style={[
                styles.iconChoice,
                {
                  borderColor: icon === selected ? theme.pine : theme.line,
                  backgroundColor: icon === selected ? theme.mint : theme.card,
                },
              ]}
            >
              <CategoryIcon name={icon} color={theme.pine} size={18} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  cell: { width: 90 },
  choice: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    gap: 3,
    height: 78,
    justifyContent: 'center',
    padding: 9,
  },
  name: { fontSize: 10, lineHeight: 13, textAlign: 'center' },
  iconScroll: { maxHeight: 196, width: '100%' },
  iconGrid: { gap: 7, width: '100%' },
  iconRow: { flexDirection: 'row', gap: 7, width: '100%' },
  iconCell: { flex: 1, minWidth: 0 },
  iconChoice: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '100%',
  },
});
