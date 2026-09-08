import SettingsScreen from '@/components/settings-screen';
import { useRouter } from 'expo-router';
import useAppDatabase from '@/db/database-provider';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen database={useAppDatabase()} onFaqPress={() => router.push('/faq')} />
  );
}
