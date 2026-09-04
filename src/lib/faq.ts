export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: 'Apakah data dan input AI dikirim ke internet?',
    answer: 'Data keuangan tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq untuk diproses.',
  },
  {
    question: 'Apakah AI mengubah data atau tetap bekerja tanpa internet?',
    answer: 'AI hanya memberi saran atau insight. Data berubah setelah kamu melakukan tindakan seperti Terapkan atau menyimpan Transaksi. Saat layanan AI tidak tersedia, saran Budget plan dan insight report memakai fallback lokal.',
  },
  {
    question: 'Apa yang terjadi saat backup dan restore?',
    answer: 'Backup dilakukan manual sebagai file JSON. Restore menghapus lalu mengganti seluruh data lokal setelah kamu mengonfirmasinya.',
  },
  {
    question: 'Bagaimana saldo awal dan Koreksi saldo dicatat?',
    answer: 'Saldo awal Wallet dicatat sebagai Transaksi kategori Saldo Awal. Koreksi saldo membuat Transaksi penyesuaian kategori Penyesuaian Saldo, jadi perubahan saldo tetap punya jejak.',
  },
  {
    question: 'Apakah Transfer mempengaruhi Net saving?',
    answer: 'Tidak. Transfer hanya memindahkan uang antar Wallet, jadi netral terhadap total kekayaan dan tidak masuk pie chart atau Net saving. Transfer tetap muncul di riwayat Transaksi.',
  },
  {
    question: 'Bagaimana Budget plan menghitung target dan realisasi?',
    answer: 'Budget plan berlaku global dalam satu Budget period. Target ditulis manual, sedangkan realisasi Pendapatan dan Pengeluaran berasal dari Transaksi dalam periode tersebut.',
  },
  {
    question: 'Apa beda Bayar dan toggle Sudah dibayar?',
    answer: 'Bayar membuka form Transaksi expense dengan sisa target sebagai nominal awal yang bisa diedit. Toggle Sudah dibayar langsung membuat satu expense sebesar target memakai Wallet aktif dengan saldo terbesar.',
  },
  {
    question: 'Bagaimana progress Goal dihitung?',
    answer: 'Progress Goal mengikuti saldo Wallet goal. Menabung berarti Transfer ke Wallet tersebut. Penarikan dari Wallet goal mengurangi progress dan tetap dicatat sebagai Transaksi expense.',
  },
  {
    question: 'Apa arti Melebihi Budget dan Defisit?',
    answer: 'Melebihi Budget berarti realisasi Pengeluaran melewati target dan tetap bisa dicatat. Defisit berarti Net saving negatif dalam Budget period; keduanya adalah informasi, bukan error.',
  },
];
