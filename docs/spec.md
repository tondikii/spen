# Spen — AI Budget Planner (MVP)

## Problem Statement

Pengguna kesulitan merencanakan dan mengelola keuangan bulanan secara terstruktur: pendapatan tersebar di beberapa tempat (cash, bank, e-wallet), pengeluaran tetap dan tabungan untuk goal (nikah, umroh, motor) sulit dipantau, dan tidak ada laporan yang membantu keputusan. Aplikasi budget planner biasa terlalu kaku (bulan kalender, satu "akun") dan tidak dibantu AI untuk menerjemahkan angka-angka menjadi saran yang actionable.

## Solution

Spen adalah aplikasi mobile budget planner berbahasa Indonesia dengan AI, data lokal di perangkat. Pengguna mengelola beberapa Wallet (tempat uang), menyusun satu Budget plan global per periode (pendapatan, fixed expense, goal), mencatat transaksi harian (income/expense/transfer), dan melihat report (pie chart expense per kategori, line chart net saving per periode) dengan AI insight. Semua data lokal, tanpa akun server. AI (Groq) dipicu manual, read-only (tidak menulis data); user yang mengeksekusi saran via tombol "Terapkan", dengan fallback deterministik.

## User Stories

1. As a pengguna baru, I want menjalani setup wizard saat pertama membuka app, so that saya bisa membuat wallet pertama dan mengatur currency sebelum mulai memakai app.
2. As a pengguna, I want membuat beberapa Wallet dengan nama bebas (misal "Tunai", "BCA", "GoPay"), so that saya bisa memisahkan uang sesuai tempat penyimpanan aslinya.
3. As a pengguna, I want mengedit dan mengarsipkan Wallet, so that saya bisa memperbaiki atau menonaktifkan wallet yang sudah tidak dipakai tanpa kehilangan data transaksinya.
4. As a pengguna, I want memindahkan uang antar Wallet via Transfer, so that saya bisa mencerminkan perpindahan uang di dunia nyata.
5. As a pengguna, I want Transfer tercatat netral terhadap total kekayaan, so that memindahkan uang antar wallet tidak mengubah saldo keseluruhan atau progress budget.
6. As a pengguna, I want Transfer memakai satu kategori tunggal global dengan warna warning, so bahwa transfer konsisten dan tidak perlu memilih kategori.
7. As a pengguna, I want menyusun satu Budget plan global per periode, so that saya bisa merencanakan pendapatan, fixed expense, dan goal dalam satu rencana terpusat.
8. As a pengguna, I want Budget period default dimulai tanggal 1 dan tanggal mulainya bisa disesuaikan mengikuti tanggal gajian langsung dari layar Rencana, so that perencanaan bulanan saya selaras dengan arus kas.
9. As a pengguna, I want mencatat pendapatan bulanan di Budget plan sebagai item target (misal "Gaji" 14jt) yang realisasinya terisi otomatis dari transaksi income kategori tersebut, so that saya tahu rencana vs yang benar-benar masuk.
9a. As a pengguna, I want tombol "Catat" di item pendapatan membuat transaksi income (pilih wallet + kategori), so bahwa mencatat pendapatan sekaligus menambah saldo wallet dan realisasi plan.
9b. As a pengguna, I want saat mencatat income yang mirip (kategori + nominal + wallet sama dalam satu hari) mendapat peringatan "mungkin dobel?", so bahwa saya bisa menghindari gajian keinput dua kali (human error tetap bisa dikoreksi: hapus item pendapatan menghapus transaksinya dan mengurangi saldo).
10. As a pengguna, I want menambahkan Fixed expense yang terikat pada satu kategori expense (berperilaku seperti alokasi), so that saya bisa menganggarkan pengeluaran tetap (sewa, cicilan, langganan) tanpa transaksi otomatis.
11. As a pengguna, I want Fixed expense progress terisi dari transaksi expense kategori tersebut (seperti alokasi), so that pembayaran lewat transaksi biasa tercermin otomatis.
12. As a pengguna, I want membayar Fixed expense dari layar Rencana via tombol "Bayar" (bisa sebagian), so that saya bisa membayar langsung tanpa harus buat transaksi manual.
13. As a pengguna, I want tidak ada transaksi otomatis / recurring, so that semua transaksi selalu manual dan saya kontrol penuh.
14. As a pengguna, I want menambahkan Goal opsional (misal dana nikah, umroh, motor) dengan target biaya dan jangka waktu, so that saya tahu berapa harus menabung tiap bulan untuk mencapainya.
15. As a pengguna, I want Goal memiliki wallet tabungan sendiri (wallet goal), dan menabung = transaksi transfer ke wallet itu (saldo wallet goal naik, saldo wallet asal turun), so that progress menabung = saldo wallet goal (misal goal 100jt, saldo wallet goal 10jt = 10%).
15a. As a pengguna, I want penarikan darurat dari wallet goal diperbolehkan dengan konfirmasi, so bahwa saya bisa memakai uang tabungan saat darurat (progress goal turun, saldo tetap konsisten).
16. As a pengguna, I want mengedit dan mengarsipkan Goal, so that saya bisa memperbarui target atau menonaktifkan goal yang tidak relevan.
17. As a pengguna, I want Budget plan menghitung spare budget (pendapatan − fixed expense − kontribusi goal), so that saya tahu sisa uang yang bisa dipakai.
18. As a pengguna, I want memicu AI suggestion budget secara manual (satu-shot), so that saya mendapat saran berbahasa Indonesia tentang alokasi spare budget berdasarkan pendapatan, fixed expense, dan goal saya.
19. As a pengguna, I want AI suggestion menghasilkan daftar saran terstruktur yang tiap itemnya punya tombol "Terapkan", so bahwa saya bisa langsung mengeksekusi saran yang saya setujui tanpa mengubah semua.
20. As a pengguna, I want AI suggestion memakai fallback deterministik lokal saat AI tidak tersedia, so bahwa saya tetap melihat hitungan spare budget meski offline.
21. As a pengguna, I want AI suggestion bersifat read-only, so that saran tidak mengubah data saya tanpa persetujuan (hanya tombol "Terapkan" yang mengubah plan).
22. As a pengguna, I want mencatat transaksi harian Income, so that saya bisa melacak pemasukan.
23. As a pengguna, I want mencatat transaksi harian Expense dengan kategori, so that saya bisa melacak pengeluaran dan progress budget.
24. As a pengguna, I want memilih wallet secara eksplisit di tiap transaksi, so that saya tahu dari mana uang keluar/masuk.
25. As a pengguna, I want mengedit dan menghapus transaksi, so that saya bisa memperbaiki catatan yang salah (tap transaksi → form edit yang sama dengan create, dalam edit state).
26. As a pengguna, I want saldo wallet selalu dicatat sebagai transaksi, termasuk saldo awal saat creation (kategori "Saldo Awal") dan perubahan saat edit (income ketika bertambah, expense ketika berkurang; kategori "Penyesuaian Saldo"), so that saldo tetap konsisten dengan riwayat dan saya bisa mengoreksi saldo yang melenceng tanpa harus tahu ke mana uang pergi.
26a. As a pengguna, I want hero Rencana menampilkan saldo tersedia yang dipecah menjadi Tersedia bebas (total saldo − saldo wallet goal) dan Terikat goal, so that saya tahu "uang yang benar-benar bisa kupakai" dan "yang sudah kualokasikan ke tabungan" tanpa plan dan dompet kelihatan beda.
27. As a pengguna, I want wallet yang sudah dipakai (punya transaksi) tidak bisa dihapus, hanya di-archive, so bahwa data transaksi tidak hilang.
28. As a pengguna, I want mendapat peringatan lembut saat transaksi membuat alokasi melebihi budget (tetap diizinkan), so bahwa saya sadar sebelum over-budget.
29. As a pengguna, I want goal yang tercapai ditandai "Tercapai" dan berhenti dihitung dalam spare budget, so bahwa perhitungan spare akurat.
30. As a pengguna, I want net saving negatif ditampilkan sebagai "Defisit" (merah), so bahwa saya tahu periode itu defisit.
31. As a pengguna, I want kategori income dan expense di-seed secara otomatis, so that saya bisa langsung memakai kategori yang relevan tanpa setup.
32. As a pengguna, I want membuat, mengedit, dan menghapus kategori, so that saya bisa menyesuaikan kategori dengan kebutuhan.
33. As a pengguna, I want kategori income berwarna success dan expense berwarna error, so that saya bisa membedakan tipe secara visual.
34. As a pengguna, I want kategori yang sudah dipakai transaksi di-archive (bukan dihapus), so that transaksi lama tetap valid dan kategori tidak muncul di pilihan baru.
35. As a pengguna, I want transaksi expense yang melebihi alokasi plan tetap tercatat dan ditandai over budget, so bahwa app tidak menolak pengeluaran nyata dan saya tahu sedang melebihi budget.
36. As a pengguna, I want report bulanan menampilkan ringkasan (total income, expense, net saving), so that saya bisa melihat kesehatan keuangan periode itu.
37. As a pengguna, I want report menampilkan pie chart expense per kategori, diurutkan dari terbesar, so that saya tahu ke mana uang paling banyak pergi.
38. As a pengguna, I want mengetuk kategori di pie chart untuk melihat transaksi kategori itu (drill-down), so that saya bisa memeriksa detail pengeluaran.
39. As a pengguna, I want report menampilkan line chart net saving per periode (default 3 bulan, bisa pilih rentang), so that saya bisa melihat perkembangan keuangan dari bulan ke bulan.
40. As a pengguna, I want report mengikuti Budget period (tanggal mulai custom), so that agregasi selaras dengan tanggal gajian saya.
41. As a pengguna, I want memicu AI insight report secara manual (on-demand, satu-shot), so that saya mendapat analisis berbahasa Indonesia tentang kategori terbesar, perbandingan net saving, dan saran actionable.
42. As a pengguna, I want AI insight memakai fallback deterministik lokal saat AI tidak tersedia, so bahwa report tetap berguna meski offline.
43. As a pengguna, I want mengatur tema light/dark di Settings, so that tampilan sesuai preferensi.
44. As a pengguna, I want melakukan backup seluruh data (wallet, transaksi, kategori, goal, pengaturan) ke file JSON via share sheet, so that data saya aman dan bisa dipindah.
45. As a pengguna, I want restore dari file backup JSON (timpa semua dengan konfirmasi), so that saya bisa mengembalikan data setelah reinstal/pindah device.
46. As a pengguna, I want currency global default IDR (tanpa konversi), so bahwa tampilan uang sesuai dengan yang saya pakai.
47. As a pengguna, I want memilih mata uang lain selain IDR di Settings, so bahwa saya bisa menampilkan uang sesuai mata uang yang saya pakai sehari-hari (tanpa konversi nilai).
48. As a pengguna, I want seluruh UI dan output AI dalam Bahasa Indonesia, so bahwa saya nyaman memakai app.

## Implementation Decisions

### Arsitektur umum
- **Single-context app**, bukan monorepo. Seluruh kode di `src/` (sudah ada: Expo Router starter dengan tabs index/explore, komponen themed, hooks theme).
- **Satu seam**: lapisan service domain (`db/` + `services/`) yang membungkus semua logika bisnis dan akses data. UI memakai lapisan ini via React hooks/context. Ini satu-satunya seam; testing difokuskan di sini.

### Database & ORM (ADR-0001)
- **`expo-sqlite` ~57.0.2** sebagai engine lokal, **Drizzle ORM** (`drizzle-orm/expo-sqlite`) sebagai schema/query, migrasi di-generate `drizzle-kit`, di-bundle, dijalankan saat startup.
- `SQLiteProvider` + `useSQLiteContext` untuk integrasi React; migrasi via `useMigrations`.
- **Async API** (bukan sync) agar tidak memblokir JS thread; `withExclusiveTransactionAsync` untuk transaksi yang butuh isolasi.
- Native-only untuk data (web support alpha) — MVP fokus Android/iOS.

### Model data (ADR-0003: global budget plan)
- **Wallet**: id, nama, saldo awal, archived, flag tabungan (bool, untuk wallet goal). Wallet adalah tempat simpan; tidak punya plan sendiri; tidak punya tipe. **Setiap mutasi saldo, termasuk saldo awal, selalu menjadi transaksi ledger** (income jika bertambah, expense jika berkurang). Saldo awal memakai kategori khusus "Saldo Awal", sedangkan **edit saldo langsung di UI = shortcut yang otomatis membuat transaksi penyesuaian** dengan kategori "Penyesuaian Saldo" (bukan mengubah saldo tanpa jejak). Wallet yang sudah dipakai (punya transaksi) tidak bisa dihapus, hanya di-archive.
- **Transfer**: transaksi khusus netral (dari wallet A ke wallet B), kategori transfer global tunggal, warna warning.
- **Category**: id, nama, tipe (income/expense/transfer), ikon, warna (income=success, expense=error, transfer=warning), seed sebagai data row (bisa diedit), archived saat sudah dipakai transaksi.
- **Budget period**: id, tanggal mulai (default tanggal 1), durasi satu bulan. Satu plan global per periode. Periode aktif = periode berjalan (dari tanggal mulai); saat berganti, plan baru kosong dibuat otomatis; plan lama tersimpan untuk report historis.
- **Budget plan**: global, satu per periode; berisi item Pendapatan, fixed expense, kontribusi goal, dan alokasi.
- **Pendapatan (item plan)**: id, nama (misal "Gaji", "Freelance"), kategori income, nominal (target periode ini). **Realisasi item = total transaksi income kategori tersebut dalam periode aktif**; ringkasan Pendapatan Plan menghitung seluruh transaksi income dalam periode aktif. Tombol "Catat" membuat transaksi income (pilih wallet). Item pendapatan bisa lebih dari satu; masing-masing terikat satu kategori income. **Hapus item pendapatan = hapus juga transaksi income yang dibuat darinya** (undo+redo saldo), sehingga tidak ada realisasi yang menggantung.
- **Fixed expense**: id, nama, kategori expense, jumlah, **berperilaku seperti alokasi** — progress terisi dari transaksi expense kategori tersebut. **Tidak ada transaksi otomatis**; pembayaran lewat transaksi biasa atau tombol "Bayar" di layar Rencana yang membuat transaksi (bisa sebagian).
- **Goal**: id, nama, target jumlah, tanggal target (opsional), **wallet tabungan (wallet goal, flag tabungan)**, archived. Opsional; jangka waktu opsional (tanpa jangka waktu, kontribusi 0, tidak mempengaruhi spare). **Menabung = transaksi transfer ke wallet goal** (saldo goal naik, saldo wallet asal turun); **progress = saldo wallet goal** (bisa diisi lewat saldo awal wallet goal). **Penarikan darurat = transaksi keluar dari wallet goal** (progress turun, dengan konfirmasi — tidak diblokir). Saat saldo wallet goal ≥ target, ditandai "Tercapai" dan berhenti dihitung dalam spare.
- **Transaction**: id, tipe (income/expense/transfer), wallet (untuk income/expense), kategori, jumlah, tanggal, catatan. **Edit transaksi = undo + redo** (kurangi wallet lama, tambah wallet baru) agar saldo konsisten. **Saldo awal wallet = transaksi ledger otomatis** dengan kategori khusus "Saldo Awal". **Koreksi saldo = transaksi penyesuaian** (kategori khusus "Penyesuaian Saldo", dibuat otomatis saat user mengubah saldo wallet langsung di UI); tidak mengisi progress item plan mana pun, tetapi mengurangi saldo wallet dan saldo tersedia.
- **Spare budget**: pendapatan − fixed expense − kontribusi goal (goal tercapai tidak dihitung). Dasar AI suggestion & fallback deterministik.
- **Invariant plan = dompet**: setiap angka uang di plan adalah target (rencana, ditulis manual) ATAU turunan transaksi (realita) — tidak ada angka ketiga. Saldo wallet, realisasi pendapatan, progress expense, saldo tersedia, dan spare dihitung dari tabel transaksi yang sama, sehingga plan dan dompet selalu konsisten (sinkron by construction, bukan dijaga manual).
- **Over-budget**: transaksi boleh melebihi alokasi plan (progress > 100%, ditandai merah + label "Melebihi Budget"); saat input transaksi yang membuat over-budget, tampilkan peringatan lembut (tetap diizinkan).
- **Net saving**: pendapatan − expense − transferOut + transferIn per periode; jika negatif disebut "Defisit" (merah).
- **Archive**: soft-delete untuk kategori/wallet/goal (flag), bukan hapus permanen; transaksi lama tetap valid.
- **Currency**: curated list (IDR, USD, SGD, MYR, EUR, GBP, JPY, AUD, SAR, AED); format angka id-ID + simbol currency.
- **Backup/restore**: JSON berisi semua data + field `version`; restore = timpa semua (bukan merge), dengan konfirmasi; validasi version + pesan error kalau beda.
- **Goal & saldo**: goal memiliki wallet tabungan sendiri; menabung = transaksi transfer ke wallet goal sehingga saldo riil ikut berpindah. Kontribusi bulanan = (target − saldo wallet goal) ÷ bulan tersisa; tanpa jangka waktu → kontribusi 0. **Saldo tersedia** (realita, diturunkan transaksi) = total saldo seluruh wallet; di layar Rencana dipecah menjadi **Tersedia bebas** (total saldo − saldo wallet goal) dan **Terikat goal**, sehingga "uang di dompet" selalu cocok dengan plan (spare = rencana; saldo tersedia = realita).
- **Alokasi & Fixed expense**: dua konsep dengan perilaku sama — keduanya "item alokasi" di plan, progress dari transaksi kategori. Bedanya semantik: Fixed expense = tagihan tetap (Sewa, Cicilan), Alokasi = budget spending fleksibel (Makan, Transport). Keduanya bisa dihapus/arsip (transaksi lama tetap valid); edit nominal → progress otomatis menyesuaikan (transaksi ÷ nominal baru).
- **Transfer di report**: netral — tidak muncul di pie chart (expense saja) dan tidak mempengaruhi net saving; tetap muncul di riwayat transaksi (label "Transfer: X → Y").

### AI Service (ADR-0002)
- Satu `AIService` dengan dua fungsi: `suggestBudget` (model `gpt-oss-20b`, output JSON terstruktur via Structured Outputs `json_schema` strict) dan `generateInsight` (model `gpt-oss-120b`, teks Bahasa Indonesia).
- **Saran budget berupa daftar saran terstruktur** (bukan teks bebas); tiap saran punya tipe aksi (misal "ubah alokasi", "tambah goal", "ubah nominal fixed expense") + tombol **"Terapkan"** yang mengubah Budget plan. Eksekusi oleh pengguna, bukan AI — AI tetap read-only.
- Dipicu manual, satu-shot. Fallback deterministik lokal saat AI tidak tersedia (offline/rate limit).
- API Groq OpenAI-compatible (`POST /openai/v1/chat/completions`); API key via env (dev) / BYOK (nanti).
- **Penting**: untuk rilis produksi, panggilan Groq harus lewat backend tipis (key server-side). MVP native boleh langsung dari app (key dev).

### Layar Rencana (Plan)
- Header: judul "Rencana" + label periode `[1–30 Sep ▾]` (tap → modal ubah tanggal mulai Budget period) + tombol **AI Suggestion** di header.
- **Hero spare budget**: angka besar + breakdown kecil (pendapatan − fixed expense − kontribusi goal).
- **Section cards**: Pendapatan, Fixed Expense, Goal, Alokasi — tiap section punya header + tombol "+ Tambah".
- **Fixed expense item**: progress + status bayar ("Lunas ✓", "x/y dibayar", "Belum dibayar") + tombol **"Bayar"** (buka form bayar → pilih wallet → buat transaksi). **Fixed expense = alokasi**: progress terisi dari transaksi kategori; tidak ada mode "bayar langsung vs dianggarkan" — semua item punya tombol "Bayar" sebagai shortcut, dan progress juga terisi dari transaksi biasa.
- **Goal item**: progress (saved/target) + kontribusi bulanan.
- **Alokasi item**: progress + over-budget (merah + label "Melebihi Budget") kalau >100%.
- **AI Suggestion sheet**: hasil daftar saran terstruktur, tiap saran punya tombol "Terapkan"; fallback deterministik saat AI tidak tersedia.

### Report & Chart
- Pie chart: expense per kategori, urut terbesar, dalam Budget period.
- Line chart: net saving per periode (income − expense − transferOut + transferIn), default 3 bulan, bisa pilih rentang.
- Drill-down: tap kategori di pie → daftar transaksi kategori itu.
- Report mengikuti Budget period (tanggal mulai custom).

### Settings
- Theme light/dark (existing `useTheme`/`useColorScheme` diperluas ke setting persist).
- Backup seluruh data → JSON via share sheet; restore dari file yang sama.
- Currency global (default IDR), **dengan pilihan mata uang lain** (tampilan saja, tanpa konversi).

### Bahasa
- UI dan seluruh output AI dalam Bahasa Indonesia.

## Testing Decisions

- **Prinsip**: hanya test perilaku eksternal (behavior), bukan detail implementasi. Fokus pada apa yang user lihat/alami, bukan internal function.
- **Seam yang diuji**: satu lapisan service domain (`db/` + `services/`) — satu-satunya seam, di sini semua logika bisnis diuji.
- **Modul yang diuji**:
  - Perhitungan `spare budget` & progress plan (termasuk over budget > 100%)
  - Logika Fixed expense (progress dari transaksi kategori; bayar sebagian via tombol "Bayar")
  - Netralitas Transfer (tidak mengubah total kekayaan / progress plan)
  - Goal progress (target vs terkumpul; tercapai → berhenti di spare)
  - Agregasi report (pie per kategori, line net saving per periode, drill-down)
  - Fallback deterministik AI (offline → hitungan lokal)
- **Prior art**: belum ada test di repo ini (fresh Expo starter). Ini test pertama; pola yang dipakai: unit test murni untuk logika perhitungan + integration test untuk service yang menyentuh DB lokal (in-memory/temp DB via expo-sqlite test setup).

## Out of Scope

- Bahasa lain / i18n penuh (post-MVP)
- BYOK AI (post-MVP; MVP pakai key dev)
- Default wallet / wallet favorit (post-MVP)
- AI interaktif (follow-up conversation) — MVP satu-shot
- Sinkronisasi cloud / akun server
- Konversi mata uang / nilai tukar
- Backend produksi untuk proxy Groq (dicatat, bukan MVP)
- Web support untuk data (native-only di MVP)

## Further Notes

- **Setup skills sudah selesai** (`/setup-matt-pocock-skills`): issue tracker = GitHub (`gh`), triage labels default, domain docs single-context. Spec ini dipublish ke GitHub Issues dengan label `ready-for-agent`.
- **Rekomendasi Drizzle version**: `drizzle-orm@rc` / `drizzle-kit@rc` (line v1.0 RC) sesuai docs Drizzle; atau stable `latest` (0.45.x). Pastikan kompatibel dengan expo-sqlite 57.
- **expo version**: pertahankan `expo` ≥ 57.0.17 (fix regresi memori Hermes di SDK 57).
- **Proses** (sesuai alur agentic): spec ini → `/to-tickets` untuk memecah jadi tracer-bullet tickets → `/implement` per ticket (tdd + code-review).
- **Setup wizard** saat pertama buka: welcome → buat wallet pertama (nama + saldo awal) → pilih currency (IDR). Tanggal mulai Budget period diubah dari layar Rencana, bukan di wizard.
