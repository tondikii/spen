import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { getErrorTranslationKey } from '@/lib/app-error';

export function useErrorToast() {
  const { t } = useTranslation();
  const getMessage = useCallback(
    (cause: unknown) => t(getErrorTranslationKey(cause)),
    [t],
  );
  return { getMessage };
}
