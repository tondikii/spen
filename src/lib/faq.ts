export type FaqEntry = {
  question: string;
  answer: string;
};

export const faqEntries: FaqEntry[] = [
  {
    question: 'Apa yang terjadi saat memakai AI?',
    answer: 'Data utama tersimpan lokal. Saat kamu memicu AI, ringkasan angka serta nama Wallet, kategori, dan Goal yang diperlukan dikirim ke Groq. AI hanya memberi saran atau insight; saat layanan tidak tersedia, Spen memakai fallback lokal.',
  },
  {
    question: 'Apa yang terjadi saat backup dan restore?',
    answer: 'Backup dilakukan manual sebagai file JSON. Restore menghapus lalu mengganti seluruh data lokal setelah kamu mengonfirmasinya.',
  },
  {
    question: 'Apa beda Bayar dan toggle Sudah dibayar?',
    answer: 'Bayar membuka form Transaksi expense dengan sisa target sebagai nominal awal yang bisa diedit. Toggle Sudah dibayar langsung membuat satu expense sebesar target memakai Wallet aktif dengan saldo terbesar.',
  },
  {
    question: 'Bagaimana progress Goal dihitung?',
    answer: 'Progress Goal mengikuti saldo Wallet goal. Menabung berarti Transfer ke Wallet tersebut. Penarikan dari Wallet goal mengurangi progress dan tetap dicatat sebagai Transaksi expense.',
  },
];
