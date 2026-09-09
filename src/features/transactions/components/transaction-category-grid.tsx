import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/ui/category-icon';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import type { Category, TransactionType } from '@/types/domain';

import { categoryRows, filterTransactionCategories } from './category-picker-utils';

type TransactionCategoryGridProps = {
  type: TransactionType;
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
  onLongPressCategory: (category: Category) => void;
};

/**
 * Grid kategori yang bisa dicari untuk form transaksi. State query
 * pencarian dimiliki di sini; daftar kategori milik picker induk.
 */
export function TransactionCategoryGrid({
  type,
  categories,
  selectedId,
  onSelect,
  onLongPressCategory,
}: TransactionCategoryGridProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [categoryQuery, setCategoryQuery] = useState('');
  const transactionCategories = useMemo(
    () => filterTransactionCategories(categories, type),
    [categories, type],
  );
  const visibleCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLocaleLowerCase('id-ID');
    if (!normalizedQuery) return transactionCategories;
    return transactionCategories.filter((category) =>
      getCategoryLabel(category).toLocaleLowerCase('id-ID').includes(normalizedQuery),
    );
  }, [categoryQuery, transactionCategories]);

  return (
    <>
      <ThemedInput
        accessibilityLabel={t('common.searchCategory')}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={t('common.searchCategory')}
        returnKeyType="search"
        value={categoryQuery}
        onChangeText={setCategoryQuery}
        style={styles.categorySearch}
      />
      <ScrollView
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryGrid}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {categoryRows(visibleCategories).map((row, rowIndex) => (
          <View
            key={`category-row-${rowIndex}`}
            testID={`category-row-${rowIndex}`}
            style={styles.categoryRow}
          >
            {row.map((category, columnIndex) =>
              category ? (
                <Pressable
                  key={category.id}
                  wrapperStyle={styles.categoryCell}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.selectCategory', {
                    name: getCategoryLabel(category),
                  })}
                  onPress={() => onSelect(category.id)}
                  onLongPress={() => onLongPressCategory(category)}
                  delayLongPress={350}
                  style={[
                    styles.category,
                    {
                      borderColor: category.id === selectedId ? theme.pine : theme.line,
                      backgroundColor: category.id === selectedId ? theme.mint : theme.card,
                    },
                  ]}
                >
                  <CategoryIcon
                    name={category.icon}
                    color={type === 'income' ? theme.income : theme.expense}
                  />
                  <ThemedText type="small" style={styles.categoryName}>
                    {getCategoryLabel(category)}
                  </ThemedText>
                </Pressable>
              ) : (
                <View
                  key={`category-spacer-${rowIndex}-${columnIndex}`}
                  style={styles.categorySpacer}
                />
              ),
            )}
          </View>
        ))}
      </ScrollView>
      {visibleCategories.length === 0 && (
        <ThemedText type="small" themeColor="muted" style={styles.categorySearchEmpty}>
          {t('common.categoryNotFound')}
        </ThemedText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  categorySearch: { marginTop: Spacing.one },
  categoryScroll: { maxHeight: 236, width: '100%' },
  categoryGrid: { gap: Spacing.two, width: '100%' },
  categoryRow: { flexDirection: 'row', gap: Spacing.two, width: '100%' },
  category: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    gap: 3,
    height: 78,
    justifyContent: 'center',
    padding: 9,
    width: '100%',
  },
  categoryCell: { flex: 1, minWidth: 0 },
  categorySpacer: { flex: 1, minWidth: 0 },
  categoryName: { fontSize: 10, lineHeight: 13, textAlign: 'center', width: '100%' },
  categorySearchEmpty: { paddingVertical: Spacing.three, textAlign: 'center' },
});
