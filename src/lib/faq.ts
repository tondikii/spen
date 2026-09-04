export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: 'Apakah data Spen tersimpan online?',
    answer: 'Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.',
  },
  {
    question: 'Apa yang dikirim saat memakai AI?',
    answer: 'Saat kamu meminta saran atau insight, ringkasan angka dan nama Wallet, kategori, atau Goal yang diperlukan dapat dikirim ke Groq untuk diproses.',
  },
  {
    question: 'Apakah AI bisa mengubah data keuanganku?',
    answer: 'Tidak. AI hanya memberi saran atau insight. Data berubah setelah kamu memilih tindakan seperti Terapkan atau menyimpan Transaksi. Jika AI tidak tersedia, saran Budget plan memakai fallback lokal.',
  },
  {
    question: 'Bagaimana cara backup dan restore?',
    answer: 'Backup dilakukan manual dari Settings sebagai file JSON yang bisa disimpan atau dibagikan. Restore mengganti seluruh data lokal setelah kamu mengonfirmasinya.',
  },
  {
    question: 'Apa yang terjadi pada saldo awal Wallet?',
    answer: 'Saat Wallet dibuat dengan saldo awal selain nol, Spen mencatatnya sebagai Transaksi kategori Saldo Awal. Saldo itu tetap punya jejak di riwayat.',
  },
  {
    question: 'Apakah Transfer mempengaruhi Net saving?',
    answer: 'Tidak. Transfer hanya memindahkan uang antar Wallet, jadi netral terhadap total kekayaan dan tidak muncul di report. Transfer tetap muncul di riwayat Transaksi.',
  },
  {
    question: 'Bagaimana Budget plan dan Budget period bekerja?',
    answer: 'Budget plan adalah rencana global untuk Pendapatan, Pengeluaran, dan Goal dalam satu Budget period. Target ditulis manual, sedangkan realisasi berasal dari Transaksi.',
  },
  {
    question: 'Apa fungsi tombol Bayar?',
    answer: 'Bayar membuka form Transaksi expense dengan sisa target sebagai nominal awal. Nominal itu bisa kamu ubah untuk pembayaran sebagian atau penuh.',
  },
  {
    question: 'Bagaimana progress Goal bekerja?',
    answer: 'Progress Goal mengikuti saldo Wallet goal. Menabung berarti Transfer ke Wallet tersebut. Saat saldo mencapai target, Goal ditandai Tercapai dan tidak lagi mengurangi Spare budget.',
  },
  {
    question: 'Bagaimana cara melakukan Koreksi saldo?',
    answer: 'Buka detail Wallet, pilih Koreksi saldo, lalu masukkan saldo riil terbaru. Spen membuat Transaksi penyesuaian agar catatan tetap punya jejak.',
  },
  {
    question: 'Apa arti Melebihi Budget dan Defisit?',
    answer: 'Melebihi Budget berarti realisasi Pengeluaran melewati target dan tetap bisa dicatat. Defisit berarti Net saving negatif dalam Budget period; keduanya adalah informasi, bukan error.',
  },
  {
    question: 'Apakah Spen adalah penasihat keuangan?',
    answer: 'Bukan. Spen membantu mencatat dan merencanakan keuangan. Gunakan informasinya sebagai bahan pertimbangan, lalu ambil keputusan yang sesuai dengan kondisimu.',
  },
];
