import mockData from '@/data/mock-data';

describe('mockData', () => {
  it('menyediakan data wallet, kategori, dan transaksi untuk layar UI', () => {
    expect(mockData.wallets.map((wallet) => wallet.name)).toEqual([
      'Tunai',
      'BCA',
      'GoPay',
      'Dana Nikah',
      'Dana Darurat',
    ]);
    expect(mockData.categories.some((category) => category.type === 'income')).toBe(true);
    expect(mockData.categories.some((category) => category.type === 'expense')).toBe(true);
    expect(mockData.categories.some((category) => category.type === 'transfer')).toBe(true);
    expect(mockData.transactions.some((transaction) => transaction.type === 'income')).toBe(true);
    expect(mockData.transactions.some((transaction) => transaction.type === 'expense')).toBe(true);

    const transfer = mockData.transactions.find((transaction) => transaction.type === 'transfer');
    expect(transfer?.walletId).toBe('wallet-bca');
    expect(transfer?.toWalletId).toBe('wallet-dana-nikah');

    const adjustment = mockData.transactions.find((transaction) => transaction.type === 'adjustment');
    expect(adjustment?.categoryId).toBe('category-penyesuaian');
    expect(mockData.categories.find((category) => category.id === adjustment?.categoryId)?.isAdjustment).toBe(true);
  });

  it('menyediakan state plan dan goal penting untuk preview UI', () => {
    const activePeriodTransactions = mockData.transactions.filter(
      (transaction) => transaction.date >= '2026-09-01' && transaction.date <= '2026-09-30',
    );
    const activeExpenses = activePeriodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const totalBalance = mockData.wallets.reduce((total, wallet) => total + wallet.balance, 0);
    const ledgerBalances = mockData.wallets.map((wallet) => {
      const walletTransactions = mockData.transactions.filter(
        (transaction) => transaction.walletId === wallet.id || transaction.toWalletId === wallet.id,
      );
      return wallet.initialBalance + walletTransactions.reduce((balance, transaction) => {
        if (transaction.type === 'income' && transaction.walletId === wallet.id) return balance + transaction.amount;
        if (transaction.type === 'expense' && transaction.walletId === wallet.id) return balance - transaction.amount;
        if (transaction.type === 'transfer' && transaction.toWalletId === wallet.id) return balance + transaction.amount;
        if (transaction.type === 'transfer' && transaction.walletId === wallet.id) return balance - transaction.amount;
        return balance;
      }, 0);
    });

    expect(mockData.wallets.map((wallet) => wallet.balance)).toEqual(ledgerBalances);
    expect(mockData.budgetSnapshot.totalExpense).toBe(activeExpenses);
    expect(mockData.budgetSnapshot.availableBalance).toBe(totalBalance);
    expect(mockData.budgetSnapshot.totalTransferIn).toBe(0);
    expect(mockData.budgetSnapshot.totalTransferOut).toBe(0);
    expect(mockData.budgetSnapshot.netSaving).toBe(6500000 - activeExpenses);
    expect(mockData.budgetSnapshot.spareBudget).toBe(4450000);
    expect(mockData.budgetSnapshot.planItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paymentStatus: { kind: 'Lunas' } }),
        expect.objectContaining({
          paymentStatus: { kind: 'Sebagian dibayar', paidAmount: 175000, targetAmount: 350000 },
        }),
        expect.objectContaining({ overBudget: true }),
      ]),
    );
    expect(mockData.goalProgress).toEqual(
      expect.arrayContaining([expect.objectContaining({ achieved: true })]),
    );
  });
});
