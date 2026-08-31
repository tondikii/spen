# Spen — Design System

> Category: Fintech & Budgeting
> AI budget planner Bahasa Indonesia. Calm finance: tenang, teratur, tepercaya. Angka adalah raja.
> Slot token & peran (tanpa nilai): lihat `docs/design/design-tokens.md`. Nilai konkret dipilih design agent saat render.

## 1. Visual Theme & Atmosphere

Spen adalah aplikasi budget planner mobile berbahasa Indonesia dengan AI. Suasana visualnya **tenang dan teratur** ("calm finance"): pengguna datang untuk mengelola uang, bukan untuk ditekan. UI harus terasa rapi, lapang, tidak ramai, dan tepercaya.

Prinsip yang menuntun semua keputusan visual:
- **Angka adalah raja**: nominal uang adalah elemen terpenting di hampir semua layar — tampilkan besar, jelas, menonjol, dan konsisten.
- **Tenang, bukan menegangkan**: hindari merah mencolok untuk hal yang bukan error.
- **Satu aksi utama per layar**: satu primary action yang jelas (misal "Tambah Transaksi", "Bayar", "Catat", "Simpan").
- **Konsisten**: design system yang sama di semua layar (spacing, radius, tipografi, warna).
- **Bahasa Indonesia yang natural**: label, tombol, dan empty state dalam Bahasa Indonesia yang alami, bukan terjemahan kaku.

## 2. Color Palette & Roles

Definisikan warna berdasarkan **peran**, bukan sekadar daftar nilai. Pastikan pasangan teks/latar memenuhi kontras (lihat Accessibility). Slot token: `docs/design/design-tokens.md`.

### Peran dasar (light & dark)
- **Background**: kanvas utama.
- **Surface**: kartu, sheet, modal.
- **Text / foreground**: teks utama.
- **Muted**: teks sekunder/tersier, meta.
- **Border / divider**: pemisah halus.

### Semantic colors (WAJIB konsisten — ini bahasa visual app)
- **Income → success** (hijau): pemasukan, angka positif.
- **Expense → error** (merah): pengeluaran, angka negatif, defisit, over-budget.
- **Transfer → warning** (kuning/oranye): transfer antar wallet, netral terhadap kekayaan.
- **Goal → aksen** (brand color): progress menabung, wallet goal.

### Brand color
Satu warna utama yang **menenangkan dan tepercaya** (kandidat kuat: hijau/teal/biru). Dipakai hemat: aksi utama, elemen brand, highlight. Jangan memakai warna brand untuk hal yang punya makna semantik (income/expense/transfer).

### Tema light & dark
Keduanya harus didesain sejak awal dengan kontras cukup dan tidak silau. Dark mode bukan sekadar invert light — pilih warna yang pas untuk dark.

## 3. Typography Rules

- **Font**: pilih font modern yang bersih dan mudah dibaca. Untuk **angka/nominal**, utamakan font dengan **tabular numerals** (angka sejajar) — atau gunakan font mono untuk nilai numerik.
- **Hierarki**: judul jelas dan tegas, body ringan dan terbaca. Nominal selalu tampil sebagai elemen paling menonjol di konteksnya.
- **Format angka Indonesia**: `Rp 2.500.000` (bukan `Rp2.500.000`). Gunakan titik sebagai pemisah ribuan.
- **Jangan pernah** menampilkan nominal kecil/sempit/terpotong.

## 4. Spacing & Layout

- **Base grid konsisten** (misal 4pt atau 8pt) untuk semua spacing.
- **Radius seragam** untuk kartu/sheet/modal/button — pilih skala yang konsisten.
- **Elevation halus**: shadow/ring lembut, hindari bayangan tebal.
- **Safe area** (notch, home indicator) dihormati di semua layar.
- **Nominal tidak pernah terpotong** oleh layout.

## 5. Components

Komponen yang dipakai lintas layar — definisikan gaya visualnya sekali, konsisten:

- **Kartu wallet**: nama + saldo, kompak; tap → detail sheet.
- **Kartu ringkasan budget / hero**: angka besar + breakdown.
- **Progress bar**: untuk alokasi budget, fixed expense, dan goal. State over-budget (>100%) ditandai.
- **Chart**: pie chart (expense per kategori), line chart (net saving per periode).
- **List transaksi**: baris ringkas (ikon kategori, label, nominal).
- **Bottom sheet**: detail wallet, AI suggestion, AI insight. Drag handle + rounded top + scrim.
- **Full-screen modal**: form transaksi, form wallet. Header + judul + tombol tutup + tombol simpan.
- **Tab bar**: 5 slot `Beranda | Rencana | [+] | Report | Settings`, dengan **+** di tengah (aksi utama, paling menonjol).
- **Kategori picker**: filter sesuai tipe transaksi; inline create/update/delete.
- **Status chip**: "Lunas ✓", "x/y dibayar", "Belum dibayar", "Tercapai", "Melebihi Budget", "Defisit".

## 6. States

Semua state penting ini harus didesain, bukan muncul apa adanya:

- **Empty**: belum ada data (misal "Tidak ada transaksi pada {tanggal}") — selalu dengan CTA.
- **Loading (AI)**: skeleton/spinner + teks "Menganalisis…", lalu hasil muncul.
- **Over-budget**: progress > 100%, ditandai (merah + label "Melebihi Budget").
- **Defisit**: net saving negatif, ditampilkan merah.
- **Goal tercapai**: ditandai "Tercapai".
- **Error**: pesan jelas, tidak menegangkan.

## 7. Do's & Don'ts

### Do
- Nominal selalu besar, jelas, tabular, format `Rp 2.500.000`.
- Semantic color dipakai konsisten: income=success, expense=error, transfer=warning, goal=brand.
- Satu aksi utama yang jelas per layar.
- Empty state selalu punya CTA.
- Bahasa Indonesia yang natural.

### Don't
- Jangan pakai merah untuk hal yang bukan error/defisit/over-budget.
- Jangan pakai warna semantic di luar perannya (misal hijau untuk tombol simpan yang bukan income).
- Jangan tampilkan angka kecil/sempit/terpotong.
- Jangan meniru "template finance" yang ramai dan menegangkan.
- Jangan pernah membuat transaksi otomatis terlihat seperti fitur — semua transaksi manual (kecuali transfer/penyesuaian yang memang sistem).

## 8. Accessibility

- Normal text: kontras ≥ 4.5:1; large text ≥ 3:1 (terhadap latar pasangannya).
- Tap target ≥ 44px.
- Setiap kontrol interaktif punya `:focus-visible` yang terlihat.
- Reduced motion: kurangi/hentikan animasi yang tidak penting.
- Jangan klaim konformansi tanpa mengecek tiap pasangan foreground/background.

## 9. Agent Prompt Guide

- Selalu baca `CONTEXT.md` + `docs/spec.md` + `docs/design-brief.md` untuk istilah domain dan keputusan terbaru.
- Istilah yang WAJIB dipakai: **Wallet**, **Budget plan**, **Budget period**, **Pendapatan** (item target + realisasi), **Fixed expense**, **Goal** (wallet tabungan), **Alokasi**, **Spare budget**, **Net saving**, **Saldo tersedia** (Tersedia bebas / Terikat goal), **Transaksi penyesuaian**.
- Saat merender layar, utamakan konten & fitur yang benar dari brief; keputusan visual ikut `DESIGN.md` ini.
- Jangan menambahkan layar/fitur di luar brief. Satu layar = satu pekerjaan.
