import { useSQLiteContext } from 'expo-sqlite';

export default function useAppDatabase() {
  return useSQLiteContext();
}
