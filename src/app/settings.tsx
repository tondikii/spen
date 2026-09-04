import SettingsScreen from '@/components/settings-screen';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

export default function SettingsRoute() {
  const router = useRouter();

  return <SettingsScreen database={useSQLiteContext()} onFaqPress={() => router.push('/faq' as never)} />;
}
