describe('notification service in Expo Go Android', () => {
  it('tidak menginisialisasi expo-notifications dan tetap mengembalikan fallback aman', async () => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { appOwnership: 'expo' },
    }));
    jest.doMock('react-native', () => ({
      Linking: { openSettings: jest.fn() },
      Platform: { OS: 'android' },
    }));
    jest.doMock('expo-notifications', () => {
      throw new Error('Expo Go Android tidak menyediakan runtime notifications');
    });

    let service!: typeof import('@/services/notification-service.native');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      service = require('@/services/notification-service.native') as typeof service;
    });

    await expect(service.getNotificationPermissionStatus()).resolves.toBe('unsupported');
    await expect(service.getScheduledReminderNotifications()).resolves.toEqual([]);
    expect(service.addNotificationResponseListener(() => undefined)).toEqual({
      remove: expect.any(Function),
    });
  });
});
