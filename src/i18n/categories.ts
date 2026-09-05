import { getCurrentLocale, resources } from '@/i18n';
import type { Category, Locale } from '@/types/domain';

export function getCategoryLabel(category: Pick<Category, 'name' | 'systemKey'>, locale?: Locale) {
  const activeLocale = locale ?? getCurrentLocale();
  const systemKey = category.systemKey;
  if (!systemKey) return category.name;
  return resources[activeLocale].translation.categories[systemKey] ?? category.name;
}
