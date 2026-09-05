export const DEFAULT_WEB_URL = 'http://10.89.182.246:8081';

export type PublicDocumentPath = '/terms' | '/privacy';

export type PublicDocumentSection = {
  heading: string;
  paragraphs: string[];
};

export type PublicDocument = {
  path: PublicDocumentPath;
  eyebrow: string;
  title: string;
  summary: string;
  owner: string;
  contact: string;
  effectiveDate: string;
  sections: PublicDocumentSection[];
};

export function getLocalizedPublicDocument(document: PublicDocument, locale: 'id' | 'en') {
  if (locale === 'id') return document;
  const english: Record<
    PublicDocumentPath,
    Pick<PublicDocument, 'eyebrow' | 'title' | 'summary' | 'effectiveDate' | 'sections'>
  > = {
    '/terms': {
      eyebrow: 'SPEN DOCUMENT',
      title: 'Terms & Conditions',
      summary: 'Simple rules for using Spen safely and clearly.',
      effectiveDate: 'September 4, 2026',
      sections: [
        {
          heading: '1. About Spen',
          paragraphs: [
            'Spen is a personal finance tracking and planning app. You can create a Budget plan, record Transactions, manage Wallets and Goals, and view financial summaries.',
            'Spen is managed by Tondiki Andika in Indonesia. Spen does not create accounts or provide cloud synchronization.',
          ],
        },
        {
          heading: '2. Who may use Spen',
          paragraphs: [
            'Spen is intended for users aged 18 and over. By using Spen, you confirm that this information is accurate and that you can agree to these terms.',
            'If you are under 18, do not use Spen without the permission and supervision of a parent or guardian. Spen does not currently provide a mechanism to verify that permission.',
          ],
        },
        {
          heading: '3. Financial data and records',
          paragraphs: [
            'You are responsible for the data you enter, including Wallet names, amounts, dates, Categories, and Goals. Make sure your records reflect your financial situation.',
            'Spen helps you record and calculate. Spen is not a financial, investment, tax, or legal adviser. Do not use Spen results as the only basis for financial decisions.',
          ],
        },
        {
          heading: '4. AI features',
          paragraphs: [
            'Budget suggestions and report insights are assistance features that you trigger. AI does not change data without your action. When AI is unavailable, Spen may show a locally calculated fallback.',
            'AI results may be wrong, incomplete, or unsuitable for your situation. Check every suggestion before using it and remain in control of your own decisions.',
          ],
        },
        {
          heading: '5. Backup and restore',
          paragraphs: [
            'You create and share backups manually. You are responsible for storing backup files safely because they may contain all of your Spen data.',
            'Restore replaces existing local data after confirmation. Check the backup file and make a copy before restoring if you still need the current data.',
          ],
        },
        {
          heading: '6. Fair use',
          paragraphs: [
            "Use Spen for personal needs and in a lawful way. Do not attempt to disrupt, reverse engineer, misuse, or access another party's systems or data through Spen.",
          ],
        },
        {
          heading: '7. Availability and limitations',
          paragraphs: [
            'Spen is provided as is. We work to keep the app running, but we do not guarantee that it will always be available, error-free, or suitable for every need.',
            'You should continue to keep transaction evidence and copies of important data outside Spen. To the extent permitted by law, Tondiki Andika is not responsible for decisions or losses arising solely from using Spen or its AI results.',
          ],
        },
        {
          heading: '8. Changes to these terms',
          paragraphs: [
            'These terms may be updated when features, behavior, or legal requirements change. The latest version will be shown on this page with its effective date.',
            'Questions or complaints can be sent to tondikiag30@gmail.com.',
          ],
        },
      ],
    },
    '/privacy': {
      eyebrow: 'SPEN DOCUMENT',
      title: 'Privacy Policy',
      summary: 'How Spen stores data and when it sends data to AI services.',
      effectiveDate: 'September 4, 2026',
      sections: [
        {
          heading: '1. Data controller',
          paragraphs: [
            'Spen is managed by Tondiki Andika, Indonesia. For privacy questions or requests, contact tondikiag30@gmail.com.',
          ],
        },
        {
          heading: '2. Data stored locally',
          paragraphs: [
            'Spen data is stored locally on your device. This may include Wallet names and balances, Transactions, Categories, Budget plans, Budget periods, Goals, currency preferences, and theme settings.',
            'Spen does not create accounts, store data on Spen servers, or provide cloud synchronization. Deleting app data from your device may delete local data that you have not backed up.',
          ],
        },
        {
          heading: '3. When you use AI features',
          paragraphs: [
            'When you trigger a Budget suggestion or report insight, Spen sends the required summary to Groq through its API service. The summary may contain financial figures, Category names, Wallets, and Goals.',
            "Names you enter may be included if they are part of the summary. Do not put confidential information or another person's identity in Wallet, Category, or Goal names.",
            "Groq processes requests under its own policies and terms. Spen does not control Groq's storage or processing policies. If you do not want a data summary sent, do not use AI features.",
          ],
        },
        {
          heading: '4. Backup and file sharing',
          paragraphs: [
            'A backup is created only when you choose to create one. A JSON backup file may contain all Spen data and may be shared through the share sheet. After sharing, its protection follows the app or service where you store it.',
            'Restore reads the file you choose and replaces local data after confirmation. Spen does not upload backup files to Spen servers.',
          ],
        },
        {
          heading: '5. Access, changes, and deletion',
          paragraphs: [
            "You can view and update data through Spen features. You can delete local data through your device's app settings; create a backup first if you still need it.",
            'For questions, corrections, or requests related to data sent through AI services, contact tondikiag30@gmail.com. We may ask for enough information to understand your request.',
          ],
        },
        {
          heading: '6. Security',
          paragraphs: [
            'Local storage reduces data sharing, but does not make data risk-free. Protect your device, backup files, and shared links. Do not use a shared device or storage for data you want to keep private.',
          ],
        },
        {
          heading: '7. User age',
          paragraphs: [
            'Spen is intended for users aged 18 and over. Spen does not currently provide a mechanism to verify parental or guardian consent for younger users.',
          ],
        },
        {
          heading: '8. Changes to this policy',
          paragraphs: [
            'This policy may be updated when features, third-party services, or legal requirements change. The latest version will be shown on this page with its effective date.',
            'This policy is effective September 4, 2026.',
          ],
        },
      ],
    },
  };
  return { ...document, ...english[document.path] };
}

export function getPublicDocumentUrl(
  path: PublicDocumentPath,
  webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? DEFAULT_WEB_URL,
) {
  const origin = webUrl.trim().replace(/\/+$/, '') || DEFAULT_WEB_URL;

  try {
    return new URL(path, `${origin}/`).toString();
  } catch {
    return new URL(path, `${DEFAULT_WEB_URL}/`).toString();
  }
}

export const termsDocument: PublicDocument = {
  path: '/terms',
  eyebrow: 'DOKUMEN SPEN',
  title: 'Syarat & Ketentuan',
  summary: 'Aturan sederhana untuk memakai Spen dengan aman dan jelas.',
  owner: 'Tondiki Andika',
  contact: 'tondikiag30@gmail.com',
  effectiveDate: '4 September 2026',
  sections: [
    {
      heading: '1. Tentang Spen',
      paragraphs: [
        'Spen adalah aplikasi pencatat dan perencana keuangan pribadi. Kamu dapat membuat Budget plan, mencatat transaksi, mengatur Wallet dan Goal, serta melihat ringkasan keuangan.',
        'Spen dikelola oleh Tondiki Andika di Indonesia. Spen tidak membuat akun dan tidak menyediakan sinkronisasi cloud.',
      ],
    },
    {
      heading: '2. Siapa yang boleh memakai Spen',
      paragraphs: [
        'Spen ditujukan untuk pengguna berusia 18 tahun ke atas. Dengan memakai Spen, kamu menyatakan bahwa informasi tersebut benar dan kamu dapat menyetujui ketentuan ini.',
        'Jika kamu belum berusia 18 tahun, jangan memakai Spen tanpa persetujuan dan pendampingan orang tua atau wali. Spen belum menyediakan mekanisme untuk memverifikasi persetujuan tersebut.',
      ],
    },
    {
      heading: '3. Data dan catatan keuangan',
      paragraphs: [
        'Kamu bertanggung jawab atas data yang kamu masukkan, termasuk nama Wallet, nominal, tanggal, kategori, dan Goal. Pastikan catatan sesuai dengan keadaan keuanganmu.',
        'Spen membantu mencatat dan menghitung. Spen bukan penasihat keuangan, investasi, pajak, atau legal. Jangan menjadikan hasil Spen sebagai satu-satunya dasar keputusan keuangan.',
      ],
    },
    {
      heading: '4. Fitur AI',
      paragraphs: [
        'Saran budget dan insight report adalah fitur bantuan yang dipicu olehmu. AI tidak mengubah data tanpa tindakanmu. Saat layanan AI tidak tersedia, Spen dapat menampilkan fallback yang dihitung secara lokal.',
        'Hasil AI dapat keliru, tidak lengkap, atau tidak sesuai dengan situasimu. Periksa setiap saran sebelum menggunakannya dan tetap kendalikan keputusanmu sendiri.',
      ],
    },
    {
      heading: '5. Backup dan restore',
      paragraphs: [
        'Backup dibuat dan dibagikan secara manual olehmu. Kamu bertanggung jawab menyimpan file backup di tempat yang aman karena file tersebut dapat memuat seluruh data Spen.',
        'Restore mengganti data lokal yang sedang ada setelah konfirmasi. Periksa file backup dan buat salinan sebelum melakukan restore jika data saat ini masih diperlukan.',
      ],
    },
    {
      heading: '6. Penggunaan yang wajar',
      paragraphs: [
        'Gunakan Spen untuk kebutuhan pribadi dan dengan cara yang tidak melanggar hukum. Jangan mencoba mengganggu, membongkar, menyalahgunakan, atau mengakses sistem dan data milik pihak lain melalui Spen.',
      ],
    },
    {
      heading: '7. Ketersediaan dan batasan',
      paragraphs: [
        'Spen disediakan sebagaimana adanya. Kami berusaha menjaga aplikasi tetap berjalan, tetapi tidak menjamin aplikasi selalu tersedia, bebas kesalahan, atau cocok untuk setiap kebutuhan.',
        'Kamu tetap perlu menyimpan bukti transaksi dan salinan data penting di luar Spen. Sejauh diizinkan hukum, Tondiki Andika tidak bertanggung jawab atas keputusan atau kerugian yang timbul hanya karena penggunaan Spen atau hasil AI.',
      ],
    },
    {
      heading: '8. Perubahan ketentuan',
      paragraphs: [
        'Ketentuan ini dapat diperbarui saat fitur, cara kerja, atau kebutuhan hukum berubah. Versi terbaru akan ditampilkan di halaman ini bersama tanggal berlakunya.',
        'Pertanyaan atau aduan dapat dikirim ke tondikiag30@gmail.com.',
      ],
    },
  ],
};

export const privacyDocument: PublicDocument = {
  path: '/privacy',
  eyebrow: 'DOKUMEN SPEN',
  title: 'Kebijakan Privasi',
  summary: 'Penjelasan tentang data yang disimpan Spen dan kapan data dikirim ke layanan AI.',
  owner: 'Tondiki Andika',
  contact: 'tondikiag30@gmail.com',
  effectiveDate: '4 September 2026',
  sections: [
    {
      heading: '1. Pengelola data',
      paragraphs: [
        'Spen dikelola oleh Tondiki Andika, Indonesia. Untuk pertanyaan atau permintaan terkait privasi, hubungi tondikiag30@gmail.com.',
      ],
    },
    {
      heading: '2. Data yang disimpan secara lokal',
      paragraphs: [
        'Data Spen tersimpan lokal di perangkatmu. Data tersebut dapat meliputi nama dan saldo Wallet, transaksi, kategori, Budget plan, Budget period, Goal, pilihan currency, dan pengaturan tema.',
        'Spen tidak membuat akun, tidak menyimpan data ke server Spen, dan tidak menyediakan sinkronisasi cloud. Menghapus data aplikasi dari perangkat dapat menghapus data lokal yang belum kamu backup.',
      ],
    },
    {
      heading: '3. Saat kamu memakai fitur AI',
      paragraphs: [
        'Ketika kamu memicu saran budget atau insight report, Spen mengirim ringkasan yang diperlukan ke Groq melalui layanan API. Ringkasan tersebut dapat berisi angka keuangan, nama kategori, Wallet, dan Goal.',
        'Nama yang kamu masukkan dapat ikut terkirim jika menjadi bagian dari ringkasan tersebut. Jangan masukkan informasi rahasia atau identitas orang lain ke nama Wallet, kategori, atau Goal.',
        'Groq memproses permintaan sesuai kebijakan dan ketentuannya sendiri. Spen tidak mengendalikan kebijakan penyimpanan atau pemrosesan Groq. Jika tidak ingin ringkasan data dikirim, jangan gunakan fitur AI.',
      ],
    },
    {
      heading: '4. Backup dan berbagi file',
      paragraphs: [
        'Backup hanya dibuat saat kamu memilihnya. File JSON backup dapat berisi seluruh data Spen dan dapat dibagikan melalui share sheet. Setelah file dibagikan, perlindungannya mengikuti aplikasi atau layanan tempat kamu menyimpannya.',
        'Restore membaca file yang kamu pilih dan mengganti data lokal setelah konfirmasi. Spen tidak mengunggah file backup ke server Spen.',
      ],
    },
    {
      heading: '5. Akses, perubahan, dan penghapusan',
      paragraphs: [
        'Kamu dapat melihat dan memperbarui data melalui fitur Spen. Kamu dapat menghapus data lokal melalui pengelolaan data aplikasi di perangkatmu; lakukan backup lebih dulu jika masih membutuhkannya.',
        'Untuk pertanyaan, koreksi, atau permintaan yang berkaitan dengan data yang kamu kirim melalui layanan AI, hubungi tondikiag30@gmail.com. Kami dapat meminta informasi yang cukup untuk memahami permintaanmu.',
      ],
    },
    {
      heading: '6. Keamanan',
      paragraphs: [
        'Penyimpanan lokal mengurangi pengiriman data, tetapi tidak membuat data bebas dari risiko. Jaga keamanan perangkat, file backup, dan tautan yang kamu bagikan. Jangan memakai perangkat atau penyimpanan bersama untuk data yang ingin kamu rahasiakan.',
      ],
    },
    {
      heading: '7. Usia pengguna',
      paragraphs: [
        'Spen ditujukan untuk pengguna berusia 18 tahun ke atas. Spen belum menyediakan mekanisme verifikasi persetujuan orang tua atau wali untuk pengguna di bawah usia tersebut.',
      ],
    },
    {
      heading: '8. Perubahan kebijakan',
      paragraphs: [
        'Kebijakan ini dapat diperbarui jika fitur, layanan pihak ketiga, atau kebutuhan hukum berubah. Versi terbaru akan ditampilkan di halaman ini bersama tanggal berlakunya.',
        'Kebijakan ini berlaku sejak 4 September 2026.',
      ],
    },
  ],
};
