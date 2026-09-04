import { getWalletOverview } from '@/services/wallet-overview-service';
import { getWallets } from '@/services/wallet-service';

jest.mock('@/services/wallet-service', () => ({ getWallets: jest.fn() }));

describe('wallet overview service', () => {
  it('separates active and archived wallets and computes active total', async () => {
    jest.mocked(getWallets).mockResolvedValue([
      {
        id: 'wallet-1',
        name: 'Tunai',
        initialBalance: 0,
        balance: 100,
        isSavings: false,
        archived: false,
        tint: 'coral',
      },
      {
        id: 'wallet-2',
        name: 'Lama',
        initialBalance: 0,
        balance: 200,
        isSavings: false,
        archived: true,
        tint: 'pine',
      },
    ]);
    await expect(getWalletOverview({} as never)).resolves.toMatchObject({
      total: 100,
      active: [{ id: 'wallet-1' }],
      archived: [{ id: 'wallet-2' }],
    });
  });
});
