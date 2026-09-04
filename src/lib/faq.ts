export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: 'Apa itu Spen?',
    answer: 'Spen membantu mencatat Transaksi dan menyusun Budget plan pribadi.',
  },
  {
    question: 'Apakah data Spen tersimpan online?',
    answer: 'Data Spen tersimpan lokal di perangkatmu. Tidak ada sinkronisasi cloud.',
  },
  {
    question: 'Apa yang dikirim saat memakai AI?',
    answer: 'Saat kamu meminta saran atau insight, ringkasan angka dan nama Wallet, kategori, atau Goal yang diperlukan dapat dikirim ke Groq untuk diproses.',
  },
  {
    question: 'Apa yang terjadi kalau AI tidak tersedia?',
    answer: 'Spen memakai fallback deterministik lokal untuk saran Budget plan. Fitur pencatatan tetap bisa dipakai.',
  },
  {
    question: 'Apakah AI bisa mengubah data keuanganku?',
    answer: 'Tidak. AI hanya memberi saran atau insight. Data berubah setelah kamu memilih tindakan seperti Terapkan atau menyimpan Transaksi.',
  },
  {
    question: 'Bagaimana cara backup dan restore?',
    answer: 'Backup dilakukan manual dari Settings sebagai file JSON yang bisa disimpan atau dibagikan. Restore mengganti seluruh data lokal setelah kamu mengonfirmasinya.',
  },
  {
    question: 'Apa itu Wallet dan Saldo awal?',
    answer: 'Wallet adalah tempat uangmu disimpan, seperti Tunai atau GoPay. Saat Wallet dibuat dengan saldo awal selain nol, Spen mencatatnya sebagai Transaksi kategori Saldo Awal.',
  },
  {
    question: 'Bagaimana cara mencatat Transaksi?',
    answer: 'Pilih tipe Masuk, Keluar, atau Transfer, lalu isi nominal, Wallet, kategori, dan tanggal. Transaksi yang sudah dicatat bisa dilihat dari riwayat.',
  },
  {
    question: 'Apa itu Transfer?',
    answer: 'Transfer memindahkan uang antar Wallet. Transfer netral terhadap total kekayaan, tidak mempengaruhi Net saving atau report, tetapi tetap muncul di riwayat Transaksi.',
  },
  {
    question: 'Apa itu Budget period?',
    answer: 'Budget period adalah rentang waktu satu bulan untuk menilai Pendapatan, Pengeluaran, dan Goal. Default-nya dimulai tanggal 1 dan bisa disesuaikan dengan tanggal gajian.',
  },
  {
    question: 'Apa itu Budget plan?',
    answer: 'Budget plan adalah rencana global untuk Pendapatan, Pengeluaran, dan kontribusi Goal dalam satu Budget period. Target ditulis manual, sedangkan realisasi berasal dari Transaksi.',
  },
  {
    question: 'Bagaimana Pendapatan dan Pengeluaran dihitung?',
    answer: 'Pendapatan menampilkan total Transaksi income sesuai kategori. Pengeluaran membandingkan total Transaksi expense dengan targetnya dalam Budget period.',
  },
  {
    question: 'Apa fungsi tombol Bayar?',
    answer: 'Bayar membuka form Transaksi expense dengan sisa target sebagai nominal awal. Nominal itu bisa kamu ubah untuk pembayaran sebagian atau penuh.',
  },
  {
    question: 'Bagaimana progress Goal bekerja?',
    answer: 'Progress Goal mengikuti saldo Wallet goal. Menabung berarti Transfer ke Wallet tersebut. Saat saldonya mencapai target, Goal ditandai Tercapai dan tidak lagi mengurangi Spare budget.',
  },
  {
    question: 'Bagaimana cara melakukan Koreksi saldo?',
    answer: 'Buka detail Wallet, pilih Koreksi saldo, lalu masukkan saldo riil terbaru. Spen membuat Transaksi penyesuaian agar catatan tetap punya jejak.',
  },
  {
    question: 'Apakah mengganti Currency mengonversi nilai?',
    answer: 'Tidak. Currency hanya mengubah simbol atau satuan tampilan secara global. Nilai angka tidak dikonversi dan satu Currency dipakai untuk semua Wallet.',
  },
  {
    question: 'Apa arti Archive?',
    answer: 'Archive menyembunyikan Wallet, kategori, atau Goal dari pilihan aktif tanpa menghapus datanya. Transaksi lama tetap valid.',
  },
  {
    question: 'Apa arti Melebihi Budget dan Defisit?',
    answer: 'Melebihi Budget berarti realisasi Pengeluaran melewati target dan tetap bisa dicatat. Defisit berarti Net saving negatif dalam Budget period; keduanya adalah informasi, bukan error.',
  },
  {
    question: 'Apakah Spen adalah penasihat keuangan?',
    answer: 'Bukan. Spen membantu mencatat dan merencanakan keuangan. Gunakan informasi di dalamnya sebagai bahan pertimbangan, lalu ambil keputusan yang sesuai dengan kondisimu.',
  },
];
