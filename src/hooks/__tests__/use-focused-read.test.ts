jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
import { readFocused, settleFocusedRead } from '@/hooks/use-focused-read';

describe('useFocusedRead', () => {
  it('loads data and retries after a read failure', async () => {
    const read = jest.fn().mockRejectedValueOnce(new Error('gagal')).mockResolvedValue('ok');
    await expect(readFocused(read, 'fallback')).resolves.toBe('ok');
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('does not apply a result after the lifecycle becomes stale', async () => {
    let current = true;
    const onData = jest.fn();
    current = false;
    await settleFocusedRead(Promise.resolve('stale'), () => current, onData, jest.fn());
    expect(onData).not.toHaveBeenCalled();
  });
});
