export type FaqEntry = {
  question: string;
  answer: string;
};

export function getFaqEntries(locale: 'id' | 'en' = 'id'): FaqEntry[] {
  if (locale === 'en')
    return faqEntries.map((entry, index) => ({
      ...entry,
      question: [
        'Is my data or AI input sent online?',
        'Does AI change data, and does it work offline?',
        'What happens during backup and restore?',
        'What is the difference between Pay and the Paid toggle?',
        'How is Goal progress calculated?',
        'How are opening balances and Balance correction recorded?',
        'Does Transfer affect Net saving?',
        'How does Budget plan calculate targets and actuals?',
      ][index],
      answer: [
        'Financial data stays on your device. When you trigger AI, the required summary numbers and Wallet, Category, and Goal names are sent to Groq for processing.',
        'AI only provides suggestions or insights. Data changes only after you take an action. When AI is unavailable, Ask AI and report insights use a local fallback.',
        'Backup is manual as a JSON file. Restore removes and replaces all local data after you confirm.',
        'Pay opens an expense Transaction form with the remaining target as an editable amount. The Paid toggle immediately creates one expense using the active Wallet with the largest balance.',
        'Goal progress follows the balance of its Goal Wallet. Saving means a Transfer to that Wallet. Withdrawals reduce progress and remain recorded as an expense Transaction.',
        'A Wallet opening balance is recorded as an Opening Balance Transaction. Balance correction creates a Balance Adjustment Transaction so the change remains traceable.',
        'No. Transfer only moves money between Wallets, so it is neutral to total wealth and does not enter the pie chart or Net saving.',
        'Budget plan is global within one Budget period. Targets are entered manually; actual Income and Expense come from Transactions in that period.',
      ][index],
    }));
  return faqEntries;
}

export const faqEntries: FaqEntry[] = [
  {
    question: 'Apakah data dan input AI dikirim ke internet?',
    answer:
      'Data keuangan tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq untuk diproses.',
  },
  {
    question: 'Apakah AI mengubah data atau tetap bekerja tanpa internet?',
    answer:
      'AI hanya memberi saran atau insight. Data berubah setelah kamu melakukan tindakan seperti Terapkan atau menyimpan Transaksi. Saat layanan AI tidak tersedia, saran Budget plan dan insight report memakai fallback lokal.',
  },
  {
    question: 'Apa yang terjadi saat backup dan restore?',
    answer:
      'Backup dilakukan manual sebagai file JSON. Restore menghapus lalu mengganti seluruh data lokal setelah kamu mengonfirmasinya.',
  },
  {
    question: 'Apa beda Bayar dan toggle Sudah dibayar?',
    answer:
      'Bayar membuka form Transaksi expense dengan sisa target sebagai nominal awal yang bisa diedit. Toggle Sudah dibayar langsung membuat satu expense sebesar target memakai Wallet aktif dengan saldo terbesar.',
  },
  {
    question: 'Bagaimana progress Goal dihitung?',
    answer:
      'Progress Goal mengikuti saldo Wallet goal. Menabung berarti Transfer ke Wallet tersebut. Penarikan dari Wallet goal mengurangi progress dan tetap dicatat sebagai Transaksi expense.',
  },
  {
    question: 'Bagaimana saldo awal dan Koreksi saldo dicatat?',
    answer:
      'Saldo awal Wallet dicatat sebagai Transaksi kategori Saldo Awal. Koreksi saldo membuat Transaksi penyesuaian kategori Penyesuaian Saldo, jadi perubahan saldo tetap punya jejak.',
  },
  {
    question: 'Apakah Transfer mempengaruhi Net saving?',
    answer:
      'Tidak. Transfer hanya memindahkan uang antar Wallet, jadi netral terhadap total kekayaan dan tidak masuk pie chart atau Net saving. Transfer tetap muncul di riwayat Transaksi.',
  },
  {
    question: 'Bagaimana Budget plan menghitung target dan realisasi?',
    answer:
      'Budget plan berlaku global dalam satu Budget period. Target ditulis manual, sedangkan realisasi Pendapatan dan Pengeluaran berasal dari Transaksi dalam periode tersebut.',
  },
];
