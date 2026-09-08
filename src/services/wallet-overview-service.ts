import type { SQLiteDatabase } from 'expo-sqlite';
import { getWallets } from '@/services/wallet-service';
import { walletTotal } from '@/lib/domain/ledger';
import type { Wallet } from '@/types/domain';

export type WalletOverview = { active: Wallet[]; archived: Wallet[]; total: number };

export async function getWalletOverview(database: SQLiteDatabase): Promise<WalletOverview> {
  const wallets = await getWallets(database, true);
  const active = wallets.filter((wallet) => !wallet.archived);
  return {
    active,
    archived: wallets.filter((wallet) => wallet.archived),
    total: walletTotal(active),
  };
}
