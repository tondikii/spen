import { useTranslation } from 'react-i18next';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export type Confirmation = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Konfirmasi dialog terpusat untuk form transaksi dan kategori picker:
 * menerima state `Confirmation | null` milik pemanggil dan merender
 * `ConfirmationModal` dengan label fallback yang sama di kedua tempat.
 */
export function TransactionConfirmationDialog({
  confirmation,
  onDismiss,
}: {
  confirmation: Confirmation | null;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmationModal
      visible={confirmation !== null}
      title={confirmation?.title ?? ''}
      message={confirmation?.message ?? ''}
      confirmLabel={confirmation?.confirmLabel ?? t('common.understand')}
      destructive={confirmation?.destructive}
      cancelLabel={
        confirmation?.confirmLabel === t('common.understand') ? undefined : t('common.cancel')
      }
      onCancel={onDismiss}
      onConfirm={async () => {
        const action = confirmation?.onConfirm;
        onDismiss();
        await action?.();
      }}
    />
  );
}
