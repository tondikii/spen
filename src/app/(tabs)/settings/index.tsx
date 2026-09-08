import { SettingsScreen } from '@/features/settings';
import { useRouter } from 'expo-router';
import useAppDatabase from '@/providers/database-provider';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen database={useAppDatabase()} onFaqPress={() => router.push('/settings/faq')} />
  );
}
