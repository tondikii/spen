import { Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MotionPressable as Pressable } from '@/components/ui/motion';
import { ThemedText } from '@/components/ui/themed-text';
import { Radius, Spacing } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/types/domain';

type TransactionCategoryActionsSheetProps = {
  category: Category | null;
  onDismiss: () => void;
  onEdit: (category: Category) => void;
  onArchive: (category: Category) => void;
};

/**
 * Sheet aksi kategori (edit/arsip) yang muncul saat kategori di-grid
 * ditekan lama. Controlled penuh oleh pemanggil lewat prop `category`.
 */
export function TransactionCategoryActionsSheet({
  category,
  onDismiss,
  onEdit,
  onArchive,
}: TransactionCategoryActionsSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Modal transparent animationType="slide" visible={Boolean(category)} onRequestClose={onDismiss}>
      <Pressable
        wrapperStyle={{ flex: 1 }}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onDismiss}
      >
        <View style={[styles.categorySheet, { backgroundColor: theme.card }]}>
          <ThemedText type="sectionHeading">{category?.name ?? ''}</ThemedText>
          <ThemedText type="small" themeColor="muted">
            {t('common.categoryActions')}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.editCategoryNamed', {
              name: category?.name ?? '',
            })}
            onPress={() => {
              if (category) onEdit(category);
            }}
            style={[styles.sheetAction, { borderTopColor: theme.line }]}
          >
            <ThemedText type="smallBold" themeColor="pine">
              {t('common.editCategory')}
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.archiveCategory', {
              name: category?.name ?? '',
            })}
            onPress={() => {
              if (!category) return;
              onDismiss();
              onArchive(category);
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
  );
}

const styles = StyleSheet.create({
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
