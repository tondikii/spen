# Design Agent Prompts — Spen

Kumpulan prompt untuk AI design agents. Gunakan bersama `docs/design-brief.md`, `docs/spec.md`, dan `CONTEXT.md` sebagai konteks.

**Urutan yang disarankan:** Stitch (gratis, mobile-first, mockup cepat) → Open Design (HTML/CSS + design tokens, paling gampang diimplement ke RN) → Figma Make (prototype fungsional + code, tapi kredit mahal).

## Cara pakai (penting — baca dulu)

- **JANGAN pakai plan mode** — semua prompt di bawah sudah lengkap & detail untuk **langsung build** (direct-build), jadi nggak perlu plan dulu. Plan mode malah boros credit/limit (free tier kena batas).
- Setiap prompt di bawah **langsung menghasilkan** semua layar + design system + state penting dalam satu shot. Ini menghemat limit.
- **Hemat limit**: jangan regenerate dari nol; untuk perubahan kecil, refine dengan percakapan (Stitch/Open Design) atau point-and-edit/edit code (Figma Make).
- Selalu attach `docs/design-brief.md` sebagai konteks utama (atau tempel isinya).
- Kalau hasilnya kurang pas, **refine per-layar** (pakai "Prompt lanjutan" di bawah), bukan generate ulang semua.

---

## 1. Stitch (Google Labs) — stitch.withgoogle.com

### Prompt utama (mulai di sini) — langsung build semua layar

```
Bantu aku mendesain "Spen", aplikasi mobile AI budget planner berbahasa Indonesia.
Setel mode layout ke MOBILE. Gunakan mobile phone frame (iPhone 15/16 & Pixel).
LANGSUNG hasilkan semua layar di bawah dalam satu shot — jangan tanya-tanya dulu, jangan pakai plan mode.

KONTEKS PRODUK:
- Multi-wallet (wallet dinamai bebas: Tunai, BCA, GoPay — tanpa tipe). Satu budget plan global per bulan; tanggal mulai periode bisa diubah langsung di layar Rencana.
- Transaksi harian: income/expense/transfer. Transfer netral (warning color).
- Budget plan: pendapatan, fixed expense, goal, spare budget.
- Report: pie chart expense per kategori, line chart net saving, AI insight.
- AI suggestion & insight dipicu manual, Bahasa Indonesia.
- Settings: theme light/dark, backup JSON, currency (default IDR, bisa pilih mata uang lain).

DESIGN SYSTEM:
- Bahasa visual: tenang, teratur, "calm finance" (tidak menegangkan).
- Angka adalah raja: nominal tampil besar & jelas, format Rp 2.500.000.
- Warna: income=success(hijau), expense=error(merah), transfer=warning(kuning).
- Brand color: biru/hijau/teal yang menenangkan.
- Dukung tema LIGHT dan DARK. Ikon kategori yang konsisten.

LAYAR YANG HARUS DIHASILKAN (frame mobile, light + dark):
1. Setup wizard (3 langkah: Welcome + value prop → buat wallet pertama (nama + saldo awal) → pilih currency, default IDR. TANPA step periode budget & TANPA tipe wallet)
2. Beranda (hub: total saldo + nama periode, wallet cards horizontal + "+ Tambah Wallet", ringkasan budget plan, transaksi terbaru + "Lihat Semua")
3. Detail wallet bottom sheet (lihat saldo, edit, arsip)
4. Form wallet (full-screen modal: nama + saldo awal, TANPA tipe)
5. Form tambah transaksi (FULL-SCREEN modal, bukan bottom sheet: pilih tipe income/expense/transfer → wallet → kategori → nominal → simpan. Kategori diffilter sesuai tipe; transfer SKIP kategori, langsung pakai kategori transfer global. Picker kategori mendukung inline create/update/delete. Form yang SAMA dipakai untuk EDIT transaksi — edit state: pre-filled, judul "Edit Transaksi", tombol "Simpan Perubahan", plus tombol "Hapus" dengan konfirmasi)
6. View transaksi harian (DAILY + STEPPER: stepper ‹ › geser hari + label relatif "Hari Ini"/"Kemarin"/"Sen, 1 Sep" + tap label → calendar picker lompat tanggal + ringkasan hari "Masuk/Keluar" + list transaksi hari itu dengan jam. TANPA filter & TANPA infinite scroll — data per hari sedikit. Empty state: "Tidak ada transaksi pada {tanggal}" + CTA tambah)
7. Layar riwayat transaksi (dari "Lihat Semua Transaksi": grouped by day + section header sticky (tanggal + total hari) + infinite scroll + filter chips di atas; ciut ke tombol "Filter" jika penuh)
8. Rencana (struktur: header "Rencana" + label periode "[1–30 Sep ▾]" (tap → ubah tanggal mulai) + tombol ✨ AI Suggestion di header; HERO spare budget (angka besar + breakdown pendapatan−fixed−goal); SECTION CARDS: Pendapatan, Fixed Expense (item: progress + status bayar "Lunas ✓"/"x/y dibayar"/"Belum dibayar" + tombol "Bayar"; fixed expense = alokasi, progress dari transaksi kategori, TANPA transaksi otomatis), Goal (progress saved/target + kontribusi bulanan; "Tercapai" saat penuh), Alokasi (progress + over-budget merah "Melebihi Budget" jika >100%); tiap section ada tombol "+ Tambah"; kategori picker dengan inline create/update/delete + filter sesuai tipe)
9. AI Suggestion sheet (hasil DAFTAR SARAN TERSTRUKTUR, bukan teks bebas — tiap saran punya tombol "Terapkan" yang mengubah plan; read-only dari AI, eksekusi oleh user; Bahasa Indonesia; fallback deterministik saat offline)
10. Report (ringkasan + pie chart expense per kategori + line chart net saving + tombol "AI Insight")
11. AI Insight sheet (analisis Bahasa Indonesia)
12. Settings (theme, currency — default IDR + pilihan mata uang lain, backup/restore)

NAVIGASI & TAB BAR:
- Tab bar 5 slot: Beranda | Rencana | [+] | Report | Settings.
- **+** di TENGAH tab bar → buka full-screen modal create transaksi (aksi utama, paling menonjol).
- Settings paling kanan (tidak ada data profil, jadi header kosong; Settings jadi tab).
- Tidak ada tab "Transaksi" — list transaksi diakses dari Beranda ("Lihat Semua") sebagai layar di-push.

STATE PENTING: empty state (belum ada transaksi), loading (AI), over-budget (>100%), defisit (net saving negatif, merah), goal tercapai, error.
Gunakan istilah domain: Wallet, Budget plan, Fixed expense, Goal, Spare budget, Net saving.

POLA INTERAKSI (terapkan di semua layar, biar hasilnya konsisten & berkualitas):
- Nominal selalu besar, jelas, tabular (angka sejajar), format Rp 2.500.000 — jangan pernah kecil/sempit.
- Warna semantic dijaga ketat: income=success(hijau), expense=error(merah), transfer=warning(kuning) — jangan dipakai untuk hal lain.
- Empty state selalu ada CTA (misal "Tambah Transaksi") — bukan cuma teks.
- Loading state AI: skeleton/spinner + teks "Menganalisis…", lalu hasil muncul (jangan langsung kosong).
- Over-budget: progress bar merah + label "Melebihi Budget" (bukan cuma angka >100%).
- Bottom sheet: drag handle + rounded top + scrim; full-screen modal: header dengan judul + tombol tutup (X) + tombol simpan jelas.
- Tab bar: 5 slot, ikon + label; **+** tengah menonjol (raised/lingkaran) — aksi utama.
- Konsisten: spacing 4pt grid, radius seragam, elevation halus; safe area (notch, home indicator) dihormati.
- Dark mode: kontras cukup, tidak silau; jangan cuma invert light mode — pilih warna yang pas untuk dark.
```

### Prompt lanjutan (untuk refine/iterasi)

```
Perbaiki layar [NAMA LAYAR]:
- [masalah spesifik, misal: "nominal terlalu kecil", "progress bar kurang jelas", "warna expense terlalu mencolok"]
- Pertahankan design system yang sudah ada; jangan ubah dari nol.
- Pastikan konsisten dengan layar lain (spacing, radius, tipografi, warna).
```

---

## 2. Open Design (nexu-io/open-design) — open-design.ai

### Prompt utama (via coding agent-mu)

```
Baca docs/design-brief.md, docs/spec.md, dan CONTEXT.md.
Gunakan design system package "mobile-app".
Bangun DESAIN Spen: semua layar utama (dari brief bagian 4) dalam frame mobile,
tema light + dark, dengan design tokens (JSON) untuk warna/tipografi/spacing.
Ikuti prinsip "calm finance" dan semantic color (income=success, expense=error, transfer=warning).
Perhatikan detail penting di brief: tab bar 5 slot dengan **+** tengah, view transaksi harian
(daily + stepper + calendar picker), kategori picker dengan inline create/update/delete,
nominal besar format Rp 2.500.000, empty state ber-CTA.
Hasilkan HTML/CSS yang bisa dipreview, plus tokens.css + manifest.json.
```

### Catatan

- Open Design menjalankan coding agent-mu sebagai "design engine" — jadi hasilnya berupa file HTML/CSS di project, bukan Figma-native.
- Setiap render membaca `DESIGN.md` sebagai brand contract; pastikan brief dijadikan `DESIGN.md` atau diacu darinya.
- Mulai dari template `mobile-app` (iPhone 15 Pro / Pixel frame), lalu deskripsikan variasinya.
- Iterasi lewat percakapan, bukan regenerate dari nol.

---

## 3. Figma Make — figma.com/make

### Prompt utama (disarankan) — langsung build prototype fungsional

```
Bantu aku mendesain "Spen", aplikasi mobile AI budget planner berbahasa Indonesia.
Buat prototype fungsional mobile app, bukan static mockup.
LANGSUNG hasilkan semua layar + interaktivitas di bawah dalam satu shot — jangan tanya-tanya dulu, jangan pakai plan mode (free tier, hemat credit).

KONTEKS PRODUK (baca file terlampir: design-brief.md, spec.md, CONTEXT.md):
- Multi-wallet (wallet dinamai bebas: Tunai, BCA, GoPay — tanpa tipe). Satu budget plan global per bulan; tanggal mulai periode bisa diubah langsung di layar Rencana.
- Transaksi harian: income/expense/transfer. Transfer netral (warning color).
- Budget plan: pendapatan, fixed expense, goal, spare budget.
- Report: pie chart expense per kategori, line chart net saving, AI insight.
- AI suggestion & insight dipicu manual, Bahasa Indonesia.
- Settings: theme light/dark, backup JSON, currency (default IDR, bisa pilih mata uang lain).

DESIGN SYSTEM:
- Bahasa visual: tenang, teratur, "calm finance" (tidak menegangkan).
- Angka adalah raja: nominal tampil besar & jelas, format Rp 2.500.000.
- Warna: income=success(hijau), expense=error(merah), transfer=warning(kuning).
- Brand color: biru/hijau/teal yang menenangkan.
- Dukung tema LIGHT dan DARK. Ikon kategori yang konsisten.

LAYAR YANG HARUS DIHASILKAN (frame mobile, light + dark):
1. Setup wizard (3 langkah: Welcome + value prop → buat wallet pertama (nama + saldo awal) → pilih currency, default IDR. TANPA step periode budget & TANPA tipe wallet)
2. Beranda (hub: total saldo + nama periode, wallet cards horizontal + "+ Tambah Wallet", ringkasan budget plan, transaksi terbaru + "Lihat Semua")
3. Detail wallet bottom sheet (lihat saldo, edit, arsip)
4. Form wallet (full-screen modal: nama + saldo awal, TANPA tipe)
5. Form tambah transaksi (FULL-SCREEN modal, bukan bottom sheet: pilih tipe income/expense/transfer → wallet → kategori → nominal → simpan. Kategori diffilter sesuai tipe; transfer SKIP kategori, langsung pakai kategori transfer global. Picker kategori mendukung inline create/update/delete. Form yang SAMA dipakai untuk EDIT transaksi — edit state: pre-filled, judul "Edit Transaksi", tombol "Simpan Perubahan", plus tombol "Hapus" dengan konfirmasi)
6. View transaksi harian (DAILY + STEPPER: stepper ‹ › geser hari + label relatif "Hari Ini"/"Kemarin"/"Sen, 1 Sep" + tap label → calendar picker lompat tanggal + ringkasan hari "Masuk/Keluar" + list transaksi hari itu dengan jam. TANPA filter & TANPA infinite scroll — data per hari sedikit. Empty state: "Tidak ada transaksi pada {tanggal}" + CTA tambah)
7. Layar riwayat transaksi (dari "Lihat Semua Transaksi": grouped by day + section header sticky (tanggal + total hari) + infinite scroll + filter chips di atas; ciut ke tombol "Filter" jika penuh)
8. Rencana (struktur: header "Rencana" + label periode "[1–30 Sep ▾]" (tap → ubah tanggal mulai) + tombol ✨ AI Suggestion di header; HERO spare budget (angka besar + breakdown pendapatan−fixed−goal); SECTION CARDS: Pendapatan, Fixed Expense (item: progress + status bayar "Lunas ✓"/"x/y dibayar"/"Belum dibayar" + tombol "Bayar"; fixed expense = alokasi, progress dari transaksi kategori, TANPA transaksi otomatis), Goal (progress saved/target + kontribusi bulanan; "Tercapai" saat penuh), Alokasi (progress + over-budget merah "Melebihi Budget" jika >100%); tiap section ada tombol "+ Tambah"; kategori picker dengan inline create/update/delete + filter sesuai tipe)
9. AI Suggestion sheet (hasil DAFTAR SARAN TERSTRUKTUR, bukan teks bebas — tiap saran punya tombol "Terapkan" yang mengubah plan; read-only dari AI, eksekusi oleh user; Bahasa Indonesia; fallback deterministik saat offline)
10. Report (ringkasan + pie chart expense per kategori + line chart net saving + tombol "AI Insight")
11. AI Insight sheet (analisis Bahasa Indonesia)
12. Settings (theme, currency — default IDR + pilihan mata uang lain, backup/restore)

NAVIGASI & TAB BAR:
- Tab bar 5 slot: Beranda | Rencana | [+] | Report | Settings.
- **+** di TENGAH tab bar → buka full-screen modal create transaksi (aksi utama, paling menonjol).
- Settings paling kanan (tidak ada data profil, jadi header kosong; Settings jadi tab).
- Tidak ada tab "Transaksi" — list transaksi diakses dari Beranda ("Lihat Semua") sebagai layar di-push.

INTERAKTIVITAS (penting untuk prototype fungsional):
- Tab bar: 5 tab (Beranda, Rencana, +, Report, Settings) bisa dinavigasi.
- Tombol **+** tengah → buka full-screen modal form transaksi (pilih tipe → wallet → kategori → nominal → simpan). Kategori diffilter sesuai tipe transaksi; transfer tidak menampilkan picker kategori. Picker kategori bisa create/update/delete kategori inline.
- Di Beranda: tap kartu wallet → detail bottom sheet (edit/arsip); "+ Tambah Wallet" → form full-screen modal.
- "Lihat Semua" transaksi → view transaksi harian (daily + stepper): ‹ › geser hari, tap label tanggal → calendar picker, ringkasan hari (Masuk/Keluar), list transaksi hari itu.
- "Lihat Semua Transaksi" (di bawah view harian) → layar riwayat (grouped by day, infinite scroll, filter chips).
- Tap kategori di pie chart → drill-down transaksi kategori itu (layar riwayat dengan filter kategori + scope periode).
- Tap "AI Suggestion" → buka sheet hasil: daftar saran terstruktur, tiap saran punya tombol "Terapkan" (mengubah plan); loading state dulu, lalu hasil Bahasa Indonesia.
- Theme toggle light/dark → seluruh layar berubah.

STATE PENTING: empty state (belum ada transaksi), loading (AI), over-budget (>100%), defisit (net saving negatif, merah), goal tercapai, error.
Gunakan istilah domain: Wallet, Budget plan, Fixed expense, Goal, Spare budget, Net saving.
```

### Prompt alternatif (lebih ringkas, hemat credit — kalau sudah puas dengan Stitch)

```
Baca file terlampir: design-brief.md, spec.md, CONTEXT.md.
Buat prototype fungsional mobile app "Spen" — AI budget planner Bahasa Indonesia.
LANGSUNG build semua layar dari brief bagian 4 dalam satu shot (tanpa plan mode, hemat credit).
Tema light + dark, semantic color (income=success, expense=error, transfer=warning),
angka besar format Rp 2.500.000. Hasilkan: layout + theme + interaktivitas
(full-screen modal create transaksi, tab bar 5 slot dengan **+** tengah, view transaksi
harian daily + stepper + calendar picker, drill-down pie chart).
```

### Prompt lanjutan (untuk refine/iterasi)

```
Perbaiki [LAYAR/STATE] di prototype:
- [masalah spesifik]
- Gunakan point-and-edit atau edit code langsung untuk perubahan kecil (hemat credit),
  bukan prompt baru.
- Pertahankan design system dan interaktivitas yang sudah ada.
```

### Catatan khusus Figma Make

- **JANGAN pakai plan mode** — free tier kena limit; semua prompt sudah direct-build, langsung hasilkan dalam satu shot.
- **Gunakan model yang tepat**: Auto (default), Claude Opus (fidelity/ketepatan), Gemini Flash (cepat/murah untuk tweak kecil).
- **Hemat credit**: prefer point-and-edit / edit code langsung untuk perubahan kecil; scope context (frame vs screenshot); jangan biarkan chat history menggelembung (start fresh/duplicate file kalau perlu).
- **Attach `guidelines.md`** di code editor untuk standing instructions (design system + istilah domain).
- **Output**: prototype fungsional + code; snapshot ke Figma Design (paid); export code (Full seat).
- **Batasan**: web-oriented (bukan mobile-first seperti Stitch); mobile lewat attach context; dark mode via prompt/guidelines, bukan toggle bawaan.
