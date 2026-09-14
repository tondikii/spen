import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/ui/category-icon';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { FieldLabel } from '@/components/ui/form-fields';
import { Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorTranslationKey } from '@/utils/app-error';
import { getCategoryLabel } from '@/i18n/categories';
import type { Category, TransactionType } from '@/types/domain';

import { TransactionCategoryActionsSheet } from './transaction-category-actions-sheet';
import { TransactionCategoryEditor } from './transaction-category-editor';
import { TransactionCategoryGrid } from './transaction-category-grid';
import {
  TransactionConfirmationDialog,
  type Confirmation,
} from './transaction-confirmation-dialog';

/**
 * Kategori picker form transaksi: label aksi, editor kategori (buat/edit)
 * dan sheet aksi (edit/arsip). State editor dimiliki di sini dan
 * dirender `TransactionCategoryEditor`; grid pencarian di-handle
 * `TransactionCategoryGrid` dan daftar kategori dimiliki form induk.
 */
export function TransactionCategoryPicker({
  type,
  categories,
  onCategoriesChange,
  selectedId,
  onSelect,
  internalCategory,
  onSaveCategory,
  onArchiveCategory,
}: {
  type: TransactionType;
  categories: Category[];
  onCategoriesChange: (update: (current: Category[]) => Category[]) => void;
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
  internalCategory?: Category | undefined;
  onSaveCategory: (category: Category) => Category | Promise<Category>;
  onArchiveCategory: (category: Category) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryActions, setCategoryActions] = useState<Category | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const closeCategoryEditor = () => {
    setCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryName('');
  };
  const beginAdd = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryIcon(CATEGORY_ICON_CHOICES[0]);
    setCategoryEditorOpen(true);
  };
  const editCategory = (category: Category) => {
    setCategoryActions(null);
    setCategoryEditorOpen(true);
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
  };
  const saveCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    setCategorySaving(true);
    try {
      const category: Category = {
        id: editingCategoryId ?? `category-draft-${Date.now()}`,
        name: trimmedName,
        type: type === 'income' ? 'income' : 'expense',
        icon: categoryIcon,
        archived: false,
        isAdjustment: false,
      };
      const saved = await onSaveCategory(category);
      onCategoriesChange((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      onSelect(saved.id);
      closeCategoryEditor();
    } catch (cause) {
      setConfirmation({
        title: t('common.categoryNotSaved'),
        message: t(getErrorTranslationKey(cause)),
        confirmLabel: t('common.understand'),
        onConfirm: () => undefined,
      });
    } finally {
      setCategorySaving(false);
    }
  };
  const requestArchive = (category: Category) => {
    setConfirmation({
      title: t('common.archiveCategoryQuestion'),
      message: t('common.archiveCategoryCopy', { name: category.name }),
      confirmLabel: t('common.archive'),
      destructive: true,
      onConfirm: async () => {
        await onArchiveCategory(category);
        onCategoriesChange((current) => current.filter((item) => item.id !== category.id));
        if (selectedId === category.id) onSelect(null);
      },
    });
  };

  return (
    <>
      <View style={styles.labelLine}>
        <FieldLabel>
          {type === 'income' ? t('common.categoryIncome') : t('common.categoryExpense')}
        </FieldLabel>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.manageCategory')}
          onPress={beginAdd}
        >
          <ThemedText type="smallBold" themeColor="pine">
            {t('common.add')}
          </ThemedText>
        </Pressable>
      </View>
      {internalCategory ? (
        <View
          style={[
            styles.internalCategoryCard,
            { borderColor: theme.line, backgroundColor: theme.card },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.selectCategory', {
            name: getCategoryLabel(internalCategory),
          })}
        >
          <CategoryIcon name={internalCategory.icon} color={theme.pine} />
          <View style={styles.internalCategoryCopy}>
            <ThemedText type="smallBold">{getCategoryLabel(internalCategory)}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              {t('common.openingBalanceNote')}
            </ThemedText>
          </View>
        </View>
      ) : (
        <TransactionCategoryGrid
          type={type}
          categories={categories}
          selectedId={selectedId}
          onSelect={onSelect}
          onLongPressCategory={setCategoryActions}
        />
      )}
      {categoryEditorOpen && (
        <TransactionCategoryEditor
          editing={editingCategoryId !== null}
          type={type}
          name={categoryName}
          icon={categoryIcon}
          saving={categorySaving}
          onNameChange={setCategoryName}
          onIconChange={setCategoryIcon}
          onCancel={closeCategoryEditor}
          onSave={() => void saveCategory()}
        />
      )}
      <TransactionCategoryActionsSheet
        category={categoryActions}
        onDismiss={() => setCategoryActions(null)}
        onEdit={(category) => editCategory(category)}
        onArchive={(category) => requestArchive(category)}
      />
      <TransactionConfirmationDialog
        confirmation={confirmation}
        onDismiss={() => setConfirmation(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  labelLine: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  internalCategoryCard: {
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  internalCategoryCopy: { flex: 1, gap: 2 },
});
