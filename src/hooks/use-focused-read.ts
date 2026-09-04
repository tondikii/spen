import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { retryDatabaseRead } from '@/services/database-read-retry';

type FocusedReadState<T> = { data: T | null; error: string; retry: () => void };

export async function settleFocusedRead<T>(
  read: Promise<T>,
  isCurrent: () => boolean,
  onData: (data: T) => void,
  onError: (error: Error) => void,
) {
  try {
    const data = await read;
    if (isCurrent()) onData(data);
  } catch (cause) {
    if (isCurrent())
      onError(cause instanceof Error ? cause : new Error('Data tidak dapat dimuat.'));
  }
}

export async function readFocused<T>(read: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await retryDatabaseRead(read);
  } catch (cause) {
    throw cause instanceof Error ? cause : new Error(fallback);
  }
}

export function useFocusedRead<T>(
  read: () => Promise<T>,
  fallback: string,
  resourceKey = '',
): FocusedReadState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const load = useCallback(async () => {
    return readFocused(read, fallback);
  }, [fallback, read]);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setData(null);
      setError('');
      void settleFocusedRead(
        load(),
        () => !cancelled,
        setData,
        (cause) => setError(cause.message),
      );
      return () => {
        cancelled = true;
      };
    }, [attempt, load, resourceKey]),
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { data, error, retry };
}
