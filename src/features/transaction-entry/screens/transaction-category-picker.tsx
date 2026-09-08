import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/category-icon';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { MotionPressable as Pressable } from '@/components/motion';
import { ThemedInput } from '@/components/themed-input';
import { ThemedText } from '@/components/themed-text';
import { FieldLabel } from '@/components/form-fields';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorTranslationKey } from '@/lib/app-error';
import { getCategoryLabel } from '@/i18n/categories';
import { chunk } from '@/lib/array';
import type { Category, TransactionType } from '@/types/domain';

const CATEGORY_COLUMNS = 4;

type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Kategori picker form transaksi: pencarian, grid kategori, editor
 * kategori inline (nama + ikon) dan sheet aksi (edit/arsip). State
 * editor dimiliki di sini; daftar kategori dimiliki form induk.
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
  internalCategory?: Category;
  onSaveCategory: (category: Category) => Category | Promise<Category>;
  onArchiveCategory: (category: Category) => void | Promise<void>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryActions, setCategoryActions] = useState<Category | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
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
  const iconRows = useMemo(() => chunk(CATEGORY_ICON_CHOICES, 5), []);

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
      setCategoryEditorOpen(false);
      setCategoryName('');
      setEditingCategoryId(null);
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
                      onLongPress={() => setCategoryActions(category)}
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
      )}
      {categoryEditorOpen && (
        <View
          style={[styles.categoryEditor, { borderColor: theme.line, backgroundColor: theme.card }]}
        >
          <View style={styles.categoryEditorHeader}>
            <ThemedText type="smallBold">
              {editingCategoryId ? t('common.editCategory') : t('common.addCategory')}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.cancelCategoryEdit')}
              disabled={categorySaving}
              onPress={() => {
                setCategoryEditorOpen(false);
                setEditingCategoryId(null);
                setCategoryName('');
              }}
              hitSlop={8}
            >
              <ThemedText type="smallBold" style={{ color: theme.expense }}>
                {t('common.cancel')}
              </ThemedText>
            </Pressable>
          </View>
          <ThemedInput
            accessibilityLabel={
              editingCategoryId ? t('common.categoryName') : t('common.newCategory')
            }
            placeholder={t('common.categoryName')}
            placeholderTextColor={theme.muted}
            value={categoryName}
            onChangeText={setCategoryName}
            style={[styles.editorInput, { borderBottomColor: theme.line, color: theme.ink }]}
          />
          <ScrollView
            style={styles.iconScroll}
            contentContainerStyle={styles.iconLibrary}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {iconRows.map((row, rowIndex) => (
              <View key={`icon-row-${rowIndex}`} style={styles.iconRow}>
                {row.map((icon) => (
                  <Pressable
                    key={icon}
                    wrapperStyle={styles.iconCell}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.chooseIcon', { icon })}
                    onPress={() => setCategoryIcon(icon)}
                    style={[
                      styles.iconChoice,
                      {
                        borderColor: icon === categoryIcon ? theme.pine : theme.line,
                        backgroundColor: icon === categoryIcon ? theme.mint : theme.background,
                      },
                    ]}
                  >
                    <CategoryIcon name={icon} color={theme.pine} size={21} />
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.saveCategory')}
            disabled={categorySaving || !categoryName.trim()}
            onPress={() => void saveCategory()}
            style={({ pressed }) => [
              styles.saveCategoryButton,
              {
                backgroundColor: categoryName.trim() ? theme.pine : theme.line,
                opacity: pressed || categorySaving ? 0.78 : 1,
              },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={{
                color: categoryName.trim() ? theme.heroText : theme.muted,
              }}
            >
              {categorySaving
                ? t('common.categorySaving')
                : editingCategoryId
                  ? t('common.saveChanges')
                  : t('common.saveCategory')}
            </ThemedText>
          </Pressable>
        </View>
      )}
      <Modal
        transparent
        animationType="slide"
        visible={Boolean(categoryActions)}
        onRequestClose={() => setCategoryActions(null)}
      >
        <Pressable
          wrapperStyle={{ flex: 1 }}
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={() => setCategoryActions(null)}
        >
          <View style={[styles.categorySheet, { backgroundColor: theme.card }]}>
            <ThemedText type="sectionHeading">{categoryActions?.name}</ThemedText>
            <ThemedText type="small" themeColor="muted">
              {t('common.categoryActions')}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.editCategoryNamed', {
                name: categoryActions?.name ?? '',
              })}
              onPress={() => categoryActions && editCategory(categoryActions)}
              style={[styles.sheetAction, { borderTopColor: theme.line }]}
            >
              <ThemedText type="smallBold" themeColor="pine">
                {t('common.editCategory')}
              </ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.archiveCategory', {
                name: categoryActions?.name ?? '',
              })}
              onPress={async () => {
                if (!categoryActions) return;
                const category = categoryActions;
                setCategoryActions(null);
                setConfirmation({
                  title: t('common.archiveCategoryQuestion'),
                  message: t('common.archiveCategoryCopy', { name: category.name }),
                  confirmLabel: t('common.archive'),
                  destructive: true,
                  onConfirm: async () => {
                    await onArchiveCategory(category);
                    onCategoriesChange((current) =>
                      current.filter((item) => item.id !== category.id),
                    );
                    if (selectedId === category.id) onSelect(null);
                  },
                });
              }}
              style={[styles.sheetAction, { borderTopColor: theme.line }]}
            >
              <ThemedText type="smallBold" style={{ color: theme.expense }}>
                {t('common.archiveCategoryAction')}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <ConfirmationModal
        visible={confirmation !== null}
        title={confirmation?.title ?? ''}
        message={confirmation?.message ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? t('common.understand')}
        destructive={confirmation?.destructive}
        cancelLabel={
          confirmation?.confirmLabel === t('common.understand') ? undefined : t('common.cancel')
        }
        onCancel={() => setConfirmation(null)}
        onConfirm={async () => {
          const action = confirmation?.onConfirm;
          setConfirmation(null);
          await action?.();
        }}
      />
    </>
  );
}

function filterTransactionCategories(categories: Category[], type: TransactionType) {
  if (type === 'adjustment') return [];
  const categoryType = type === 'income' ? 'income' : 'expense';
  return categories.filter(
    (category) =>
      category.type === categoryType &&
      !category.archived &&
      category.systemKey !== 'openingBalance',
  );
}

function categoryRows(categories: Category[]) {
  const rows: (Category | null)[][] = [];
  for (let index = 0; index < categories.length; index += CATEGORY_COLUMNS) {
    const row = categories.slice(index, index + CATEGORY_COLUMNS) as (Category | null)[];
    while (row.length < CATEGORY_COLUMNS) row.push(null);
    rows.push(row);
  }
  return rows;
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
  categoryEditor: {
    alignSelf: 'stretch',
    borderRadius: 13,
    borderWidth: 1,
    gap: Spacing.two,
    padding: 11,
    width: '100%',
  },
  categoryEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  editorInput: {
    borderBottomWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 0,
  },
  iconLibrary: { gap: 7, width: '100%' },
  iconRow: { flexDirection: 'row', gap: 7, width: '100%' },
  iconScroll: { maxHeight: 196, width: '100%' },
  iconChoice: {
    alignItems: 'center',
    borderRadius: Radius.small,
    borderWidth: 1,
    height: 39,
    justifyContent: 'center',
    width: '100%',
  },
  iconCell: { flex: 1, minWidth: 0 },
  saveCategoryButton: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  categorySheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    gap: Spacing.two,
    padding: 21,
  },
  sheetAction: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    paddingVertical: 15,
  },
});
