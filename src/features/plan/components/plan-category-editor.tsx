import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/ui/category-icon';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Radius } from '@/theme';
import { chunk } from '@/utils/array';
import type { Category } from '@/types/domain';
import type { PlanItemType } from '../model';

import { planSheetStyles } from './plan-sheet-styles';

/**
 * Editor inline kategori baru di form item rencana: input nama + pilihan ikon.
 * Kategori dibuat sebagai draft ber-id sementara lalu disimpan lewat `onCreate`.
 */
export function PlanCategoryEditor({
  type,
  onCancel,
  onCreate,
}: {
  type: PlanItemType;
  onCancel: () => void;
  onCreate: (category: Category) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const iconRows = useMemo(() => chunk(CATEGORY_ICON_CHOICES, 5), []);
  const saveCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    const draft: Category = {
      id: `category-draft-${Date.now()}`,
      name,
      type: type === 'income' ? 'income' : 'expense',
      icon: categoryIcon,
      archived: false,
      isAdjustment: false,
    };
    await onCreate(draft);
    setCategoryName('');
  };
  return (
    <View
      style={[
        styles.inlineCategoryEditor,
        { borderColor: theme.line, backgroundColor: theme.background },
      ]}
    >
      <View style={styles.categoryEditorHeader}>
        <ThemedText type="smallBold">{t('common.addCategory')}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancelCategoryEdit')}
          onPress={() => {
            setCategoryName('');
            onCancel();
          }}
          hitSlop={8}
        >
          <ThemedText type="smallBold" style={{ color: theme.expense }}>
            {t('common.cancel')}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedInput
        accessibilityLabel={t('common.newCategory')}
        placeholder={t('common.categoryName')}
        value={categoryName}
        onChangeText={setCategoryName}
        style={planSheetStyles.goalInput}
      />
      <ScrollView
        style={styles.planIconScroll}
        contentContainerStyle={styles.planIconGrid}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        {iconRows.map((row, rowIndex) => (
          <View key={`plan-icon-row-${rowIndex}`} style={styles.planIconRow}>
            {row.map((icon) => (
              <Pressable
                key={icon}
                wrapperStyle={styles.planIconCell}
                accessibilityRole="button"
                accessibilityLabel={t('common.chooseIcon', { icon })}
                onPress={() => setCategoryIcon(icon)}
                style={[
                  styles.planIconChoice,
                  {
                    borderColor: icon === categoryIcon ? theme.pine : theme.line,
                    backgroundColor: icon === categoryIcon ? theme.mint : theme.card,
                  },
                ]}
              >
                <CategoryIcon name={icon} color={theme.pine} size={18} />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.saveCategory')}
        disabled={!categoryName.trim()}
        onPress={() => void saveCategory()}
        style={({ pressed }) => [
          styles.planSaveCategory,
          {
            backgroundColor: categoryName.trim() ? theme.pine : theme.line,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{ color: categoryName.trim() ? theme.heroText : theme.muted }}
        >
          {t('common.saveCategory')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  inlineCategoryEditor: {
    alignSelf: 'stretch',
    borderRadius: 13,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
    padding: 11,
    width: '100%',
  },
  planIconScroll: { maxHeight: 196, width: '100%' },
  planIconGrid: {
    gap: 7,
    width: '100%',
  },
  planIconRow: { flexDirection: 'row', gap: 7, width: '100%' },
  planIconChoice: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '100%',
  },
  planIconCell: { flex: 1, minWidth: 0 },
  planSaveCategory: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
});
