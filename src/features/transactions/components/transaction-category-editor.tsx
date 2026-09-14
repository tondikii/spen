import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_ICON_CHOICES, CategoryIcon } from '@/components/ui/category-icon';
import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedInput } from '@/components/ui/themed-input';
import { ThemedText } from '@/components/ui/themed-text';
import { Fonts, Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import { chunk } from '@/utils/array';
import type { TransactionType } from '@/types/domain';

const ICON_COLUMNS = 6;
const ICON_CELL_WIDTH = 39;

type TransactionCategoryEditorProps = {
  editing: boolean;
  type: TransactionType;
  name: string;
  icon: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onIconChange: (icon: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

/**
 * Editor kategori inline (buat/edit): input nama dan pilihan ikon.
 * Sepenuhnya controlled oleh pemanggil lewat props; label dan status
 * tombol simpan dihitung dari `editing`, `saving`, dan `name`.
 */
export function TransactionCategoryEditor({
  editing,
  type,
  name,
  icon,
  saving,
  onNameChange,
  onIconChange,
  onCancel,
  onSave,
}: TransactionCategoryEditorProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const iconRows = useMemo(() => chunk(CATEGORY_ICON_CHOICES, ICON_COLUMNS), []);

  return (
    <View style={[styles.categoryEditor, { borderColor: theme.line, backgroundColor: theme.card }]}>
      <View style={styles.categoryEditorHeader}>
        <ThemedText type="smallBold">
          {editing ? t('common.editCategory') : t('common.addCategory')}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancelCategoryEdit')}
          disabled={saving}
          onPress={onCancel}
          hitSlop={8}
        >
          <ThemedText type="smallBold" style={{ color: theme.expense }}>
            {t('common.cancel')}
          </ThemedText>
        </Pressable>
      </View>
      <ThemedInput
        accessibilityLabel={editing ? t('common.categoryName') : t('common.newCategory')}
        placeholder={t('common.categoryName')}
        placeholderTextColor={theme.muted}
        value={name}
        onChangeText={onNameChange}
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
            {row.map((choice) => (
              <Pressable
                key={choice}
                wrapperStyle={styles.iconCell}
                accessibilityRole="button"
                accessibilityLabel={t('common.chooseIcon', { icon: choice })}
                onPress={() => onIconChange(choice)}
                style={[
                  styles.iconChoice,
                  {
                    borderColor: choice === icon ? theme.pine : theme.line,
                    backgroundColor: choice === icon ? theme.mint : theme.background,
                  },
                ]}
              >
                <CategoryIcon
                  name={choice}
                  color={type === 'income' ? theme.income : theme.expense}
                  size={21}
                />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.saveCategory')}
        disabled={saving || !name.trim()}
        onPress={onSave}
        style={({ pressed }) => [
          styles.saveCategoryButton,
          {
            backgroundColor: name.trim() ? theme.pine : theme.line,
            opacity: pressed || saving ? 0.78 : 1,
          },
        ]}
      >
        <ThemedText
          type="smallBold"
          style={{
            color: name.trim() ? theme.heroText : theme.muted,
          }}
        >
          {saving
            ? t('common.categorySaving')
            : editing
              ? t('common.saveChanges')
              : t('common.saveCategory')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  iconCell: { width: ICON_CELL_WIDTH },
  saveCategoryButton: {
    alignItems: 'center',
    borderRadius: Radius.medium,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    width: '100%',
  },
});
