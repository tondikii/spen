jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
import { readFocused } from '@/hooks/use-focused-read';

describe('useFocusedRead', () => {
  it('loads data and retries after a read failure', async () => {
    const read = jest.fn().mockRejectedValueOnce(new Error('gagal')).mockResolvedValue('ok');
    await expect(readFocused(read, 'fallback')).resolves.toBe('ok');
    expect(read).toHaveBeenCalledTimes(2);
  });
});
