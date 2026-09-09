import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryIcon } from '@/components/ui/category-icon';
import { FieldLabel } from '@/components/ui/form-fields';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getCategoryLabel } from '@/i18n/categories';
import type { Category } from '@/types/domain';

/**
 * Pemilihan kategori item rencana: label + tombol tambah, chip kategori yang
 * bisa dipilih, dan pesan kosong bila tidak ada kategori yang cocok.
 */
export function PlanCategoryPicker({
  options,
  selectedId,
  onSelect,
  onAdd,
}: {
  options: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.categoryLabelRow}>
        <FieldLabel>{t('common.category')}</FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.addCategoryFromPlan')}
          onPress={onAdd}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {t('common.add')}
          </ThemedText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.goalWallets}
      >
        {options.map((category) => (
          <Pressable
            key={category.id}
            wrapperStyle={styles.planCategoryCell}
            accessibilityRole="button"
            accessibilityLabel={t('common.categoryFor', {
              name: getCategoryLabel(category),
            })}
            onPress={() => onSelect(category.id)}
            style={[
              styles.planCategoryChoice,
              {
                borderColor: selectedId === category.id ? theme.pine : theme.line,
                backgroundColor: selectedId === category.id ? theme.mint : theme.card,
              },
            ]}
          >
            <CategoryIcon name={category.icon} color={theme.pine} size={18} />
            <ThemedText type="smallBold" style={styles.planCategoryName}>
              {getCategoryLabel(category)}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      {options.length === 0 && (
        <ThemedText type="small" style={{ color: theme.expense }}>
          {t('common.noMatchingCategory')}
        </ThemedText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  categoryLabelRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalWallets: { gap: 8, paddingVertical: 4 },
  planCategoryCell: { width: 132 },
  planCategoryChoice: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
    height: 72,
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  planCategoryName: { textAlign: 'center', width: '100%' },
});
