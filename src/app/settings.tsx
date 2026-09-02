import SettingsScreen from '@/components/settings-screen';
import { useSQLiteContext } from 'expo-sqlite';

export default function SettingsRoute() {
  return <SettingsScreen database={useSQLiteContext()} />;
}
