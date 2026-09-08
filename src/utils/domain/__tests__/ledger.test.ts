import {
  expenseProgress,
  netSaving,
  realizedForCategory,
  summarizeLedger,
  walletTotal,
} from '@/utils/domain/ledger';
import type { Transaction, Wallet } from '@/types/domain';

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'income',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-gaji',
    amount: 6_500_000,
    date: '2026-09-01',
    time: '07:00',
    note: '',
  },
  {
    id: 'transaction-2',
    type: 'expense',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-makan',
    amount: 250_000,
    date: '2026-09-01',
    time: '08:00',
    note: '',
  },
  {
    id: 'transaction-3',
    type: 'transfer',
    walletId: 'wallet-1',
    toWalletId: 'wallet-2',
    categoryId: 'category-transfer',
    amount: 100_000,
    adminFee: 2_500,
    date: '2026-09-01',
    time: '09:00',
    note: '',
  },
  {
    id: 'transaction-4',
    type: 'adjustment',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-saldo-awal',
    amount: 50_000,
    date: '2026-09-01',
    time: '10:00',
    note: '',
  },
];

const wallets: Wallet[] = [
  {
    id: 'wallet-1',
    name: 'Tunai',
    initialBalance: 0,
    balance: 350_000,
    isSavings: false,
    archived: false,
    tint: 'pine',
  },
  {
    id: 'wallet-2',
    name: 'BCA',
    initialBalance: 0,
    balance: 5_000_000,
    isSavings: false,
    archived: false,
    tint: 'pine',
  },
];

describe('summarizeLedger', () => {
  it('menjumlahkan Pendapatan, Pengeluaran, dan kedua kaki Transfer dengan biaya admin', () => {
    expect(summarizeLedger(transactions)).toEqual({
      income: 6_500_000,
      expense: 250_000,
      transferIn: 100_000,
      transferOut: 102_500,
    });
  });

  it('mengecualikan transaksi penyesuaian dari total ledger (perilaku plan)', () => {
    const totals = summarizeLedger(transactions);
    expect(totals.income).toBe(6_500_000);
    expect(totals.expense).toBe(250_000);
  });

  it('memproyeksikan penyesuaian lewat tipe Kategorinya (perilaku report)', () => {
    const totals = summarizeLedger(transactions, (transaction) =>
      transaction.type === 'adjustment'
        ? 'income'
        : (transaction.type as 'income' | 'expense' | 'transfer'),
    );
    expect(totals.income).toBe(6_550_000);
  });
});

describe('netSaving', () => {
  it('menghitung Tabungan bersih dengan Transfer netral terhadap kekayaan', () => {
    const totals = summarizeLedger(transactions);
    expect(netSaving(totals)).toBe(6_500_000 - 250_000 - 102_500 + 100_000);
  });
});

describe('realizedForCategory', () => {
  it('hanya menjumlahkan transaksi pada kategori dan tipe yang cocok', () => {
    expect(realizedForCategory(transactions, 'category-gaji', 'income')).toBe(6_500_000);
    expect(realizedForCategory(transactions, 'category-makan', 'expense')).toBe(250_000);
    expect(realizedForCategory(transactions, 'category-makan', 'income')).toBe(0);
    expect(realizedForCategory(transactions, 'category-tidak-ada', 'expense')).toBe(0);
  });
});

describe('expenseProgress', () => {
  it('menghitung persen dan penanda Melebihi Anggaran', () => {
    expect(expenseProgress(175_000, 350_000)).toEqual({
      progressPercent: 50,
      overBudget: false,
    });
    expect(expenseProgress(400_000, 350_000)).toEqual({
      progressPercent: (400_000 / 350_000) * 100,
      overBudget: true,
    });
  });

  it('mengembalikan 0% tanpa penanda saat target 0', () => {
    expect(expenseProgress(100_000, 0)).toEqual({ progressPercent: 0, overBudget: false });
  });
});

describe('walletTotal', () => {
  it('menjumlahkan saldo seluruh Dompet', () => {
    expect(walletTotal(wallets)).toBe(5_350_000);
  });
});

describe('guard agregat uang', () => {
  it('menolak hasil penjumlahan yang melewati batas integer aman', () => {
    const big: Transaction = {
      id: 'transaction-besar',
      type: 'income',
      walletId: 'wallet-1',
      toWalletId: null,
      categoryId: 'category-1',
      amount: Number.MAX_SAFE_INTEGER,
      date: '2026-09-01',
      time: '08:00',
      note: '',
    };
    expect(() => summarizeLedger([big, big])).toThrow();
    expect(() =>
      walletTotal([{ ...wallets[0], balance: Number.MAX_SAFE_INTEGER }, wallets[0]]),
    ).toThrow();
  });
});
