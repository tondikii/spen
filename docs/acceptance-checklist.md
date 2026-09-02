# Spen — Acceptance checklist

Checklist ini memetakan 48 user story pada `docs/spec.md` ke implementasi yang ada. Status `✅` berarti perilaku sudah diimplementasikan dan memiliki coverage service/UI yang relevan; validasi visual native tetap perlu dilakukan pada perangkat oleh pemilik aplikasi.

| US | Status | Implementasi / bukti |
| --- | --- | --- |
| 1 | ✅ | `setup-service`, `setup-wizard`, dan test setup end-to-end. |
| 2 | ✅ | Create multiple Wallet dengan nama bebas di Home dan `wallet-service`. |
| 3 | ✅ | Edit/archive Wallet melalui Home wallet sheet dan service database. |
| 4 | ✅ | Transfer antar-Wallet melalui form transaksi. |
| 5 | ✅ | Transfer netral terhadap total kekayaan; tercakup test database. |
| 6 | ✅ | Kategori Transfer global otomatis dan warna warning. |
| 7 | ✅ | Satu Budget plan global per Budget period di `plan-service`. |
| 8 | ✅ | Default tanggal 1 dan perubahan tanggal mulai dari Rencana. |
| 9 | ✅ | Item Pendapatan dan realisasi otomatis dari ledger. |
| 9a | ✅ | Tombol Catat membuka form income dengan preset item. |
| 9b | ✅ | Peringatan income yang mungkin dobel; koreksi transaksi tersedia dari form edit/hapus. |
| 10 | ✅ | Fixed expense terikat kategori expense tanpa transaksi otomatis. |
| 11 | ✅ | Progress Fixed expense diturunkan dari transaksi kategori. |
| 12 | ✅ | Tombol Bayar membuka transaksi dengan nominal sisa, termasuk pembayaran sebagian. |
| 13 | ✅ | Tidak ada recurring/auto-payment; semua transaksi dibuat manual atau lewat shortcut yang dikonfirmasi user. |
| 14 | ✅ | Goal dengan target dan tanggal target opsional. |
| 15 | ✅ | Goal memakai Wallet Goal; Nabung adalah transfer ke Wallet tersebut. |
| 15a | ✅ | Penarikan darurat dari Goal memakai konfirmasi dan transaksi. |
| 16 | ✅ | Goal dapat diedit dan diarsipkan. |
| 17 | ✅ | Spare budget = target Pendapatan − fixed expense − kontribusi Goal aktif. |
| 18 | ✅ | AI suggestion dipicu manual dan menerima konteks plan/wallet/goal. |
| 19 | ✅ | Daftar suggestion terstruktur dengan tombol Terapkan. |
| 20 | ✅ | Fallback deterministik lokal saat AI tidak tersedia. |
| 21 | ✅ | AI read-only sampai user menekan Terapkan. |
| 22 | ✅ | Pencatatan transaksi Income harian. |
| 23 | ✅ | Pencatatan transaksi Expense berkategori. |
| 24 | ✅ | Wallet dipilih eksplisit di form transaksi. |
| 25 | ✅ | Tap transaksi membuka form edit yang sama; hapus memakai konfirmasi. |
| 26 | ✅ | Saldo berasal dari saldo awal + ledger; koreksi menghasilkan transaksi adjustment. |
| 26a | ✅ | Hero Rencana memakai SALDO TERSEDIA bersama dengan Home/Report dan memecah bebas/terikat Goal. |
| 27 | ✅ | Wallet bertransaksi di-archive, bukan dihapus. |
| 28 | ✅ | Warning over-budget tetap mengizinkan penyimpanan. |
| 29 | ✅ | Goal tercapai berlabel Tercapai dan tidak dihitung dalam spare budget. |
| 30 | ✅ | Net saving negatif berlabel Defisit dan memakai warna expense. |
| 31 | ✅ | Kategori income/expense di-seed otomatis. |
| 32 | ✅ | Kategori dapat dibuat, diedit, dan diarsipkan melalui form transaksi. |
| 33 | ✅ | Kategori income/expense memakai warna semantic. |
| 34 | ✅ | Kategori terpakai diarsipkan sehingga histori tetap valid. |
| 35 | ✅ | Expense di atas alokasi tetap tercatat dan ditandai over-budget. |
| 36 | ✅ | Report menampilkan income, expense, dan net saving. |
| 37 | ✅ | Pie expense per kategori diurutkan terbesar. |
| 38 | ✅ | Tap kategori pie melakukan drill-down ke Riwayat berfilter. |
| 39 | ✅ | Line chart net saving default 3 periode dan pilihan rentang. |
| 40 | ✅ | Agregasi Report mengikuti Budget period custom. |
| 41 | ✅ | AI insight on-demand, satu-shot, dan Bahasa Indonesia. |
| 42 | ✅ | AI insight memiliki fallback deterministik lokal. |
| 43 | ✅ | Theme light/dark tersimpan melalui Settings. |
| 44 | ✅ | Backup seluruh data menjadi JSON berversi via share sheet. |
| 45 | ✅ | Restore mengganti data dengan konfirmasi dan validasi version. |
| 46 | ✅ | Currency default IDR dan tanpa konversi. |
| 47 | ✅ | Pilihan currency lain tersedia dan tersimpan global. |
| 48 | ✅ | UI, prompt, fallback, dan output AI menggunakan Bahasa Indonesia. |

## Automated acceptance

- `npm.cmd test -- --runInBand` — seluruh suite harus hijau.
- `npx.cmd tsc --noEmit` — typecheck harus hijau.
- `npm.cmd run lint` — tidak boleh ada error lint; warning legacy dicatat di output lint.
- `git diff --check` — tidak boleh ada whitespace error.

## Manual native QA yang tersisa

Ini bukan implementasi kode yang tertunda, tetapi pemeriksaan yang memerlukan simulator/device dan interaksi native:

1. Jalankan `npm.cmd start`, buka Android/iOS, lalu cek semua tab pada light dan dark mode; khususnya safe-area, footer tab bar, hero card, modal, keyboard, dan scroll pada layar sempit.
2. Di Rencana, uji tambah/edit/hapus item, Terapkan saran `add_goal`, Bayar sebagian, Goal tercapai, dan over-budget.
3. Di Beranda/Riwayat/Harian/Report, tap transaksi untuk edit/hapus, tap pie untuk drill-down, stepper + kalender, dan filter.
4. Di Settings, lakukan export sampai share sheet native muncul; restore file JSON yang valid dan file dengan `version` salah untuk memastikan konfirmasi/error tampil.
5. Untuk build produksi, letakkan `EXPO_PUBLIC_GROQ_API_KEY` melalui secret/environment build. Jangan commit API key; produksi idealnya memakai proxy server-side sesuai catatan spec.
