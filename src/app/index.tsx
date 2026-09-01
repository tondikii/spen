import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import HomeScreen from '@/components/home-screen';
import type { Wallet } from '@/types/domain';
import { archiveWallet, createWallet, getWallets, updateWallet } from '@/services/wallet-service';

export default function HomeRoute() {
  const router = useRouter();
  const database = useSQLiteContext();
  const [wallets, setWallets] = useState<Wallet[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getWallets(database).then((items) => {
      if (!cancelled) setWallets(items);
    });
    return () => {
      cancelled = true;
    };
  }, [database]);

  const refreshWallets = async () => setWallets(await getWallets(database));

  if (!wallets) return null;

  return <HomeScreen
    wallets={wallets}
    onWalletSave={async (wallet, name, balance) => {
      if (wallet) await updateWallet(database, wallet.id, name, balance);
      else await createWallet(database, name, balance);
      await refreshWallets();
    }}
    onWalletArchive={async (wallet) => {
      await archiveWallet(database, wallet.id);
      await refreshWallets();
    }}
    onTransactionPress={(transaction) => router.push({ pathname: '/create', params: { transactionId: transaction.id } })}
    onDailyPress={() => router.push('/daily' as never)}
  />;
}
