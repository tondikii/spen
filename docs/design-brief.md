# Spen — Design Brief (untuk AI Design Agent)

Dokumen ini adalah sumber kebenaran desain untuk **Spen**, aplikasi mobile AI budget planner berbahasa Indonesia. Gunakan dokumen ini sebagai konteks utama saat mendesain UI. Baca `CONTEXT.md` dan `docs/spec.md` untuk detail domain dan user stories.

---

## 1. Ringkasan Produk

Spen adalah aplikasi mobile budget planner dengan AI, semua data lokal di perangkat (tanpa akun server). Pengguna mengelola beberapa **Wallet** (tempat uang: cash, bank, e-wallet — dinamai bebas), menyusun satu **Budget plan** global per periode (pendapatan, fixed expense, goal), mencatat transaksi harian (income/expense/transfer), dan melihat **report** (pie chart expense per kategori, line chart net saving per periode) dengan AI insight.

- **Platform**: mobile (iOS + Android native-first), via React Native / Expo.
- **Bahasa**: seluruh UI dan output AI dalam **Bahasa Indonesia**.
- **Target user**: individu yang ingin merencanakan keuangan bulanan secara terstruktur; gajian bisa di tanggal berapa pun.

---

## 2. Prinsip Desain

1. **Ketenangan finansial (calm finance)**: UI harus terasa tenang, teratur, dan tidak menegangkan — pengguna datang untuk mengelola uang, bukan untuk ditekan. Hindari merah mencolok untuk hal-hal yang bukan error.
2. **Angka adalah raja**: nominal uang adalah elemen paling penting di setiap layar. Tampilkan besar, jelas, dan konsisten. Gunakan format angka Indonesia (contoh: `Rp 2.500.000`).
3. **Satu aksi utama per layar**: setiap layar punya satu primary action yang jelas (misal "Tambah Transaksi", "Simpan Rencana").
4. **Konsistensi visual**: gunakan design system yang sama di semua layar (spacing, radius, tipografi, warna). Tema **light/dark** harus didukung sejak awal.
5. **Bahasa Indonesia yang natural**: label, tombol, dan empty state dalam Bahasa Indonesia yang alami, bukan terjemahan kaku.

---

## 3. Bahasa Visual & Komponen

- **Tipografi**: gunakan font modern yang bersih dan mudah dibaca untuk angka (tabular numbers penting untuk nominal). Judul jelas, body ringan.
- **Warna**:
  - **Warna utama (brand)**: pilih warna yang menenangkan dan tepercaya — biru/hijau/teal adalah kandidat kuat. Hindari warna "murahan".
  - **Semantik** (penting, konsisten):
    - **Income → success** (hijau)
    - **Expense → error** (merah)
    - **Transfer → warning** (kuning/oranye)
  - **Tema light/dark**: kedua tema harus didesain sejak awal, dengan kontras yang cukup dan tidak silau.
- **Ikon**: setiap kategori transaksi punya ikon (misal makanan, transportasi, gaji, hiburan). Ikon harus konsisten dan mudah dikenali.
- **Komponen utama**: kartu wallet, kartu ringkasan budget, progress bar (untuk alokasi budget & goal), pie chart, line chart, list transaksi, bottom sheet / modal untuk input, tombol **+** tengah (floating action di tab bar) untuk tambah transaksi, **kategori picker**.
- **Kategori picker**: komponen pemilih kategori yang muncul di form create transaksi dan di layar Rencana. Perilaku:
  - **Filter sesuai tipe**: saat membuat transaksi income → hanya kategori income; transaksi expense → hanya kategori expense; **transfer → tidak ada picker kategori** (memakai satu kategori transfer global otomatis).
  - **Inline create/update/delete**: dari dalam picker, user bisa membuat kategori baru, mengedit, dan menghapus/arsip kategori tanpa keluar dari form. Hapus = arsip jika kategori sudah dipakai transaksi (transaksi lama tetap valid).

---

## 4. Struktur Navigasi & Layar

### Navigasi utama (tab bar, 5 slot)
- `Beranda | Rencana | [+] | Report | Settings`
- **+** (tengah) → **create transaksi** (full-screen modal). Ini aksi utama, makanya paling menonjol di tengah.
- **Settings** (paling kanan) → karena tidak ada data profil, header tidak punya isi; Settings jadi tab tersendiri (theme, currency, backup/restore, bahasa, tentang).

1. **Beranda (Home)** — hub ringkasan. Urutan (compact, biar CRUD wallet & transaksi fit di satu layar):
   - **Header**: total saldo semua wallet + nama Budget period (bukan profil — ini isi yang berguna).
   - **Wallet cards**: kompak, horizontal scroll (wallet biasanya 2–5). Tap kartu → **detail bottom sheet** (lihat saldo, edit, arsip). Kartu "+ Tambah Wallet" → **form wallet full-screen modal** (keyboard-heavy). Edit/arsip dari sheet yang sama. Hapus permanen hanya jika wallet kosong (belum ada transaksi); jika sudah dipakai → **arsip**.
   - **Ringkasan budget plan**: progress + spare budget (ringkas; detail di tab Rencana).
   - **Transaksi terbaru**: list pendek (misal 5, transaksi terbaru) + "Lihat Semua" → buka **view transaksi harian** (daily + stepper).
2. **Rencana (Plan)** — budget plan bulan ini. Struktur:
   - **Header**: judul "Rencana" + label periode `[1–30 Sep ▾]` (tap → modal ubah tanggal mulai Budget period) + tombol **✨ AI Suggestion** di header (selalu kelihatan).
   - **Hero spare budget**: angka besar + breakdown kecil (pendapatan − fixed expense − kontribusi goal).
   - **Section cards**: Pendapatan, Fixed Expense, Goal, Alokasi — tiap section punya header + tombol "+ Tambah".
   - **Fixed expense item**: progress + status bayar ("Lunas ✓", "x/y dibayar", "Belum dibayar") + tombol **"Bayar"** (buka sheet: pilih wallet → nominal default sisa, bisa diubah → konfirmasi → buat transaksi expense). **Fixed expense = alokasi**: progress terisi dari transaksi kategori; tidak ada transaksi otomatis.
   - **Goal item**: progress (saved/target) + kontribusi bulanan.
   - **Alokasi item**: progress + over-budget (merah + label "Melebihi Budget") kalau >100%.
   - **AI Suggestion sheet**: hasil daftar saran terstruktur, tiap saran punya tombol **"Terapkan"** (mengubah plan; eksekusi oleh user, bukan AI).
3. **Report** — ringkasan periode, pie chart expense per kategori, line chart net saving per periode, AI insight, drill-down per kategori.
4. **Settings** — theme light/dark, currency (default IDR, bisa pilih mata uang lain), backup/restore, bahasa, tentang app.

### Layar pendukung
- **Form transfer** — dari **+** → pilih tipe Transfer → wallet asal + wallet tujuan (dua dropdown + tombol swap ↕), nominal, tanggal, catatan. Tercatat di view harian/riwayat sebagai "Transfer: Tunai → BCA" (warna warning). Saldo kedua wallet langsung ter-update; netral terhadap total.
- **Alur "Bayar" fixed expense** — tombol "Bayar" di item → sheet: pilih wallet asal → nominal (default sisa belum dibayar, bisa diubah = bayar sebagian) → konfirmasi → buat transaksi expense + progress plan ter-update; status jadi "Lunas ✓" kalau full. Tidak ada transaksi otomatis.
- **Multi-periode** — satu plan per periode. Periode aktif = periode berjalan (dari tanggal mulai). Saat periode berganti, plan baru kosong dibuat otomatis; plan lama tersimpan untuk report historis. Tanggal mulai bisa diubah kapan saja.
- **Backup/restore** — JSON berisi semua data + field `version`; restore = timpa semua (bukan merge), dengan konfirmasi.
- **Detail wallet sheet** — "Masuk/Keluar bulan ini" memakai Budget period aktif (konsisten report).
- **Notifikasi/reminder** — di luar MVP.
- **Currency** — curated list umum (IDR, USD, SGD, MYR, EUR, GBP, JPY, AUD, SAR, AED); format angka id-ID + simbol currency.
- **View transaksi harian** (dari Beranda, bagian "Transaksi") — **daily + stepper**, layar/panel yang menampilkan transaksi **satu hari**. Struktur:
  - **Stepper tanggal** di header: `‹` `›` geser hari demi hari; label relatif ("Hari Ini", "Kemarin") kalau dekat, format "Sen, 1 Sep" kalau jauh; tombol "Hari Ini" muncul saat tidak di hari ini.
  - **Tap label tanggal** → buka **calendar picker** (lompat ke tanggal mana pun — ini penting, bukan cuma ‹ ›).
  - **Ringkasan hari**: total masuk & keluar di header.
  - **List transaksi hari itu**, kronologis dengan jam. **Tanpa filter** (data per hari sedikit) dan **tanpa infinite scroll** (list pendek; FlatList tetap dipakai, tanpa pagination).
  - **Empty state**: "Tidak ada transaksi pada {tanggal}" + CTA tambah.
- **Layar riwayat transaksi** (dari "Lihat Semua Transaksi" di Beranda) — layar penuh di-push, **bukan** tab & bukan modal. Untuk scan riwayat panjang & drill-down report. Struktur:
  - **Grouped by day** (section header sticky: tanggal + total hari), **infinite scroll** (pagination `onEndReached`).
  - **Filter**: chips ringkas (tipe/wallet/kategori/periode). **Guard kepenuhan**: jika chips > 4 atau mulai penuh → ciutkan jadi satu tombol "Filter" yang buka filter sheet; chips berubah jadi badge filter aktif.
  - Dipakai ulang untuk **drill-down report** (tinggal di-pass filter kategori + scope periode).
- **Form create transaksi** — **full-screen modal** (bukan bottom sheet): keyboard-heavy (nominal, tanggal, catatan + picker tipe/wallet/kategori). Pilih tipe income/expense/transfer → wallet → **kategori (diffilter sesuai tipe; transfer skip kategori, langsung pakai kategori transfer global)** → nominal → simpan. Picker kategori mendukung **inline create/update/delete**.
- **Edit transaksi** — **form yang sama persis** dengan create, dalam **edit state**: pre-filled dari transaksi, judul "Edit Transaksi", tombol simpan "Simpan Perubahan", plus tombol **"Hapus"** (dengan konfirmasi). Tap transaksi di list mana pun (view harian, riwayat, drill-down) langsung buka form edit ini — tanpa detail sheet.
- **Form wallet** — full-screen modal (keyboard-heavy): nama, saldo awal. (Tanpa tipe.)
- **Setup wizard** (saat pertama buka) — **3 langkah**: Welcome (branding + value prop) → buat wallet pertama (nama + saldo awal) → pilih currency (default IDR). **Tidak ada** step periode budget (diubah langsung dari layar Rencana) dan **tidak ada** tipe wallet.
- **Detail & form lainnya** — form fixed expense, form goal, form kategori. (Detail transaksi = form edit transaksi, bukan layar terpisah.)
- **AI Suggestion sheet** — hasil saran AI berupa **daftar saran terstruktur** (read-only dari AI), tiap saran punya tombol **"Terapkan"** (mengubah Budget plan; eksekusi oleh user). Dipicu manual, Bahasa Indonesia.
- **AI Insight sheet** — hasil analisis AI report (read-only, dipicu manual).

---

## 5. Alur Utama (User Flows) — Desain Ini

1. **Onboarding**: setup wizard → Welcome → buat wallet pertama (nama + saldo awal) → pilih currency (IDR) → masuk Beranda.
2. **Tambah transaksi**: tap **+** (tengah tab bar) → full-screen modal → pilih tipe (income/expense/transfer) → pilih wallet → pilih kategori → isi nominal → simpan.
2b. **Edit/hapus transaksi**: tap transaksi di list mana pun (view harian, riwayat, drill-down) → **form yang sama persis dengan create, dalam edit state** (pre-filled, "Edit Transaksi", "Simpan Perubahan", tombol "Hapus" dengan konfirmasi).
3. **Kelola wallet**: di Beranda → tap kartu wallet → detail bottom sheet (lihat saldo, edit, arsip). "+ Tambah Wallet" → form full-screen modal. Hapus permanen hanya jika wallet kosong; jika sudah dipakai → arsip.
4. **Lihat transaksi**: di Beranda → "Lihat Semua" → **view transaksi harian** (daily + stepper): `‹` `›` geser hari, tap label tanggal → **calendar picker** (lompat), lihat ringkasan & list transaksi hari itu. "Lihat Semua Transaksi" (di bagian bawah) → **layar riwayat** (grouped by day, infinite scroll, filter chips; ciut ke tombol "Filter" jika penuh).
5. **Tambah fixed expense**: buka Rencana → tambah fixed expense → pilih kategori → isi nominal → simpan. (Progress terisi dari transaksi kategori; tombol "Bayar" untuk bayar langsung.)
6. **Tambah goal**: buka Rencana → tambah goal → isi nama, target nominal, jangka waktu, jumlah sudah terkumpul → simpan. Progress goal terlihat.
7. **AI Suggestion**: buka Rencana → tap "AI Suggestion" → (loading) → lihat saran alokasi spare budget dalam Bahasa Indonesia.
8. **Lihat report**: buka Report → pilih periode → lihat ringkasan, pie chart, line chart → tap kategori di pie → drill-down transaksi (layar riwayat dengan filter kategori + scope periode) → tap "AI Insight" → lihat analisis.
9. **Transfer**: tap **+** → pilih tipe transfer → pilih wallet asal & tujuan → isi nominal → simpan. Netral terhadap total kekayaan.
10. **Settings**: ganti tema light/dark; backup semua data ke file JSON; restore dari file.

---

## 6. Persyaratan Fungsional Utama (untuk konteks desain)

- Multi-wallet: wallet dinamai bebas (Tunai, BCA, GoPay), tanpa tipe. Saldo = saldo awal + transaksi (tidak bisa edit manual; koreksi via transaksi penyesuaian). Wallet ber-transaksi tidak bisa dihapus, hanya arsip. Transfer antar wallet netral (tidak mengubah total kekayaan).
- Satu **Budget plan global** per periode; periode default mulai tanggal 1, tanggal mulai bisa diubah (mengikuti gajian) **langsung dari layar Rencana**.
- Fixed expense: **berperilaku seperti alokasi** — progress terisi dari transaksi kategori; **tidak ada transaksi otomatis**; pembayaran via transaksi biasa atau tombol "Bayar" di Rencana (bisa sebagian).
- Kategori: income & expense di-seed otomatis, bisa diedit/ditambah/dihapus; transfer punya satu kategori global. Kategori yang sudah dipakai di-archive.
- Over budget: transaksi boleh melebihi alokasi plan, progress > 100% ditandai (merah/over-budget state); saat input transaksi yang membuat over-budget, tampilkan peringatan lembut (tetap diizinkan).
- Goal: target + jangka waktu (opsional) + sudah terkumpul → progress; saat tercapai ditandai "Tercapai" dan berhenti dihitung di spare.
- Net saving negatif = "Defisit" (merah).
- Report: ringkasan (income/expense/net saving), pie expense per kategori (urutan terbesar, drill-down), line chart net saving per periode (default 3 bulan, pilih rentang), AI insight.
- AI (Groq): suggestion & insight dipicu manual, satu-shot, read-only, Bahasa Indonesia; fallback deterministik saat offline.
- Backup: seluruh data → file JSON (export/share sheet) & restore.
- Currency: global, default IDR, bisa pilih mata uang lain (tampilan saja, tanpa konversi).

---

## 7. Yang Harus Dihasilkan Design Agent

Mohon hasilkan, minimal:

1. **Design system**: palet warna (light/dark), tipografi, spacing, radius, elevation/shadow, ikon style. Idealnya sebagai **design tokens** (JSON) yang bisa dipakai developer.
2. **Semua layar utama** (dari bagian 4) dalam frame mobile (iPhone 15/16 & Android standar), untuk tema light **dan** dark.
3. **State penting**: empty state (belum ada transaksi), loading state (AI suggestion), over-budget state, defisit (net saving negatif), goal tercapai, error state.
4. **Interaksi**: full-screen modal create transaksi, tab bar dengan **+** tengah, detail bottom sheet wallet, drill-down pie chart, view transaksi harian (daily + stepper + calendar picker), layar riwayat (infinite scroll + filter chips).

---

## 8. Konteks Teknis untuk Design Agent

- Framework: React Native / Expo SDK 57 (native-first; web tidak prioritas).
- Data lokal (expo-sqlite + Drizzle); tidak ada backend.
- AI: Groq (model gpt-oss); dipicu manual.
- Komponen UI yang umum di RN: `View`, `Text`, `Pressable`, `TextInput`, `ScrollView`, `Modal`/bottom sheet, `FlatList`. Library chart: pie & line chart (misal `react-native-gifted-charts` atau sejenisnya, atau custom SVG).
- Desain harus **feasible di React Native**: hindari efek yang butuh web-only CSS; gunakan spacing/radius/shadow standar RN; perhatikan safe area (notch, home indicator).

---

## 9. Referensi

- `CONTEXT.md` — glossary domain (istilah: Wallet, Budget plan, Budget period, Fixed expense, Goal, Category, Spare budget, Net saving, Transfer, dll). **Gunakan istilah ini secara konsisten.**
- `docs/spec.md` — spec lengkap (48 user stories, implementation decisions, testing decisions).
