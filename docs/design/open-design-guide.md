# Open Design — Ultimate Guide untuk Spen

Panduan end-to-end untuk membuat design Spen dengan **Open Design** (nexu-io/open-design, open-design.ai). Tool ini beda dari Stitch/Figma Make: ini **desktop app / CLI local** yang menjalankan **coding agent** (Claude Code, Codex, dll.) sebagai design engine, dan **semua render wajib baca `DESIGN.md`** sebagai brand contract.

> **Prinsip utama**: `DESIGN.md` adalah satu-satunya tempat keputusan visual. Prompt per-layar hanya menyebut konten/fitur layar + archetype — biar konsisten dan hemat iterasi.

---

## 1. Konsep & Alur

```
DESIGN.md (brand contract, 1x)  +  brief layar (konten/fitur)  →  Open Design (agent)
                                                                   →  index.html per layar (iPhone 15 Pro frame)
```

- **Mode**: prototype (HTML single-file). Satu layar per render.
- **Template**: `mobile-app` — frame iPhone 15 Pro pixel-accurate. **Seed sudah menyediakan**: Dynamic Island, status bar SVG (signal/wifi/battery, jam `9:41`), home indicator, tab bar, `.device`, `.ph-img` (placeholder gambar), `data-od-id`, token `:root` (warna/typografi). **Jangan tulis ulang frame-nya**.
- **Satu layar per render** ("single screen, single job"). Kalau butuh beberapa layar, render satu per satu (ulangi brief per layar).
- **Light + dark**: template `mobile-app` default-nya satu tema. Untuk light+dark, render **dua frame** (satu light, satu dark) atau pakai `[data-theme="dark"]` bila seed mendukung — perjelas di prompt kalau mau dua-duanya.
- **Keputusan visual ada di `DESIGN.md`** — kamu cuma arahkan tema di sini, design agent yang menentukan & konsisten.
- **Akses file**: pastikan agent membaca `docs/design/DESIGN.md` + `docs/design/design-tokens.md` (attach sebagai konteks, atau sebut path-nya di prompt). `design-tokens.md` berisi slot tanpa nilai — agent yang mengisi nilainya.

---

## 2. Persiapan (1x, paling penting)

### a. Siapkan `DESIGN.md` (brand contract Spen)

Ini file yang paling menentukan hasil. Bisa diletakkan di `docs/design/DESIGN.md`, lalu di-attach/dipilih sebagai design system saat render. **Target: ≥7 H2 substantif.** Kerangka yang disarankan:

```markdown
# Spen — Design System

> Category: Fintech & Budgeting
> AI budget planner Bahasa Indonesia. Calm finance: tenang, teratur, tepercaya.

## 1. Visual Theme & Atmosphere
[calm finance; pengguna datang mengelola uang, bukan ditekan. Rapi, lapang, tidak ramai.]

## 2. Color Palette & Roles
[Beri peran, bukan nilai: background, surface, text, border.
TETAPKAN peran semantic: income = success, expense = error, transfer = warning, goal = brand.
Brand color: 1 warna yang menenangkan & tepercaya (arahkan nuansa, agent pilih nilainya). Light + dark.]

## 3. Typography Rules
[Penting untuk angka: pilih font dengan tabular numerals / mono untuk nominal.
Angka adalah raja: nominal tampil besar & jelas. Judul jelas, body ringan.
ARAHKAN nuansa (modern/bersih); agent pilih family-nya.]

## 4. Spacing & Layout
[Base grid konsisten (misal 4/8px), radius seragam, elevation halus. Safe area dihormati.]

## 5. Components
[Kartu wallet, kartu ringkasan budget, progress bar (alokasi & goal), pie chart,
line chart, list transaksi, bottom sheet, full-screen modal, tab bar +, kategori picker,
status chip (Lunas/Belum/Tercapai/Melebihi Budget).]

## 6. States
[empty, loading AI, over-budget (>100%), defisit, goal tercapai, error.]

## 7. Do's & Don'ts
[Do: angka menonjol; konsisten semantic color; nominal pakai format Rp 2.500.000.
Don't: merah untuk non-error; warna semantic dipakai di luar perannya; angka kecil/sempit.]

## 8. Accessibility
[Kontras teks ≥ 4.5:1, target sentuh ≥ 44px, focus-visible, reduced-motion.]
```

### b. Siapkan `design-tokens.md` (slot & peran, tanpa nilai)

Definisikan **nama slot + peran** token di `docs/design/design-tokens.md` — **tanpa nilai konkret** (warna hex, font, ukuran). Nilai dipilih design agent saat render dan direkam balik. Kerangka slot yang sudah ada:

- **Warna peran**: `--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`, `--accent-on`, `--success` (income), `--error` (expense), `--warning` (transfer).
- **Tipografi peran**: `--font-display`, `--font-body`, `--font-mono` (numerik/nominal — utamakan tabular numerals).
- **Spacing/radius**: `--space-*`, `--radius-*` (skala konsisten).
- **Motion**: `--ease-standard` (ease-out kuat), `--motion-enter`/`--motion-exit` (~200/140ms).

> Jangan isi nilai. Kalau agent butuh nilai, dia yang pilih dan rekam balik setelah disetujui.

### c. (Opsional) Bikin design-system package

Kalau mau dipakai berulang sebagai system, bikin folder `design-systems/spen/` berisi `manifest.json` + `DESIGN.md` + token CSS, atau cukup attach `DESIGN.md` di tiap render.

---

## 3. Memilih Template & Archetype

**Template**: `mobile-app` (frame iPhone 15 Pro). **Archetype per layar** (dari `design-templates/mobile-app/references/layouts.md`):

| Layar Spen | Archetype | Tab bar? |
|---|---|---|
| Setup wizard (welcome, buat wallet, pilih currency) | **C — Onboarding** | tidak |
| Beranda (total saldo, wallet cards, transaksi terbaru) | **F — Focus** (hero angka saldo) atau **A — Feed** | ya |
| Rencana (hero spare budget + section cards) | **F — Focus** (hero angka) | ya |
| Report (ringkasan + charts) | **F — Focus** / **A — Feed** | ya |
| Form transaksi / form wallet (full-screen modal) | **E — Checkout/form** | tidak |
| Detail wallet bottom sheet | **B — Detail** | tidak |
| Goal / fixed expense item | **B — Detail** | tidak |
| Settings | **A — Feed** (list) | ya |

> `mobile-app` = 1 layar per render. Jangan gabung 2 archetype dalam 1 screen. Sesuai archetype: **Onboarding/Detail/Checkout → buang tab bar**; Feed/Focus/Profile → pertahankan.

**Arahkan archetype yang paling cocok dengan aksi utama layar.** Beranda budget planner intinya *total saldo* (angka besar) → **F (Focus)** lebih pas daripada A (Feed); A cocok untuk list (riwayat, settings).

---

## 4. Prompt per Layar (templat)

```
Gunakan design system Spen: baca docs/design/DESIGN.md + docs/design/design-tokens.md
(slot token tanpa nilai — isi nilainya sendiri, konsisten).
Buat prototype mobile (template mobile-app, archetype [A-F]) untuk layar: [NAMA].
Baca seed assets/template.html + references/layouts.md; jangan tulis ulang frame-nya.
Juga baca untuk akurasi domain & konten: CONTEXT.md (glossary), docs/spec.md (user stories
& keputusan), docs/design-brief.md (produk & UX). Gunakan istilah & perilaku fitur yang benar dari sana.

KONTEKS PRODUK:
- [fitur & data yang tampil di layar ini, pakai istilah domain: Wallet, Budget plan,
  Pendapatan, Fixed expense, Goal, Spare budget, Saldo tersedia, Transaksi penyesuaian]

ISI LAYAR (spesifik, bukan "isi aja"):
- [konten: angka contoh yang realistis, label Bahasa Indonesia, status, dsb.]

ARAHAN TEMA (opsional — kalau mau override dari DESIGN.md):
- [misal: "untuk layar ini, tekankan saldo tersedia / tersedia bebas"]

KERJAKAN:
- Satu layar, satu archetype. Frame iPhone 15 Pro. Theme [light / dark / light+dark].
- Buang <nav class="tabbar"> kalau archetype Onboarding/Detail/Checkout.
- Pakai data-od-id di device/content/header/section. Nominal pakai .num (mono).
- Jangan emoji untuk ikon (SVG monoline saja); jangan URL gambar eksternal (pakai .ph-img).
- Copy realistis & spesifik, Bahasa Indonesia. Selesai: self-check checklist (P0 wajib).
- Jangan tanya-tanya dulu — langsung buat.
```

---

## 4b. Prompt Siap-Tempel — Layar Beranda (contoh)

```
Gunakan design system Spen: baca docs/design/DESIGN.md + docs/design/design-tokens.md
(slot token tanpa nilai — isi nilainya sendiri, konsisten).
Buat prototype mobile (template mobile-app, archetype F — Focus/hero, adaptasi) untuk layar: Beranda.
Baca seed assets/template.html + references/layouts.md; jangan tulis ulang frame-nya.
Juga baca untuk akurasi domain & konten: CONTEXT.md (glossary), docs/spec.md (user stories
& keputusan), docs/design-brief.md (produk & UX). Gunakan istilah & perilaku fitur yang benar dari sana.

KONTEKS PRODUK:
- Aplikasi budget planner Bahasa Indonesia. Multi-wallet (Tunai, BCA, GoPay), satu Budget plan global per periode.
- Header: total saldo semua wallet + nama Budget period (misal "[1–30 Sep ▾]").
- Wallet cards horizontal + "+ Tambah Wallet". Tap kartu → detail bottom sheet (lihat saldo, edit, arsip, koreksi saldo).
- Ringkasan budget plan (progress + spare budget).
- Transaksi terbaru (list pendek) + "Lihat Semua".

ISI LAYAR (spesifik):
- Total saldo: Rp 11.000.000 (angka besar, hero). Wallet: Tunai Rp 3.000.000, BCA Rp 6.000.000, GoPay Rp 1.000.000, + Tambah Wallet.
- Periode: [1–30 Sep ▾].
- Ringkasan budget: Pendapatan 14jt / Masuk 13,7jt · Spare budget Rp 1.000.000.
- Transaksi terbaru: "Gaji" income +13.700.000 (BCA, hari ini), "Koreksi saldo" −3.700.000 (BCA), "Makan" −45.000 (GoPay).

ARAHAN TEMA: angka (total saldo) paling menonjol di layar ini.

KERJAKAN:
- Satu layar, satu archetype. Frame iPhone 15 Pro. Theme light + dark (dua frame).
- Pertahankan tab bar (Beranda = tab aktif). Pakai data-od-id; nominal .num (mono).
- Jangan emoji untuk ikon (SVG monoline); jangan URL gambar eksternal (pakai .ph-img).
- Copy realistis & spesifik, Bahasa Indonesia. Selesai: self-check checklist (P0 wajib).
- Jangan tanya-tanya dulu — langsung buat.
```

> Setelah layar pertama, **review dulu**, refine `DESIGN.md`/`design-tokens.md` kalau perlu — baru render layar lain. Ini menghemat banyak iterasi.

---

## 5. Checklist Rendering (per layar)

Pakai checklist resmi template (`mobile-app/references/checklist.md`) — P0 wajib. Yang paling sering meleset & relevan untuk Spen:

**P0 (wajib)**
- [ ] Frame tetap utuh: Dynamic Island, status bar SVG (signal/wifi/battery, bukan teks), home indicator di paling bawah. Jangan tulis ulang frame (`border-radius` jangan diubah).
- [ ] Content scroll, frame tidak. `<main class="content">` punya `overflow-y: auto`.
- [ ] Tap target ≥ 44px; body text ≥ 14px (sub-text minimal 13px).
- [ ] Satu aksen, dipakai ≤ 2× per layar (misal 1 tab aktif + 1 CTA).
- [ ] Tidak ada URL gambar eksternal — pakai `.ph-img`.
- [ ] Tab bar sesuai archetype: Onboarding/Detail/Checkout → buang `<nav class="tabbar">`; Feed/Focus/Profile → pertahankan.
- [ ] Display heading pakai `var(--font-display)` — jangan override ke system-sans.
- [ ] Tidak ada emoji untuk ikon (SVG monoline). Emoji di copy boleh, tapi bukan di UI icon.
- [ ] `data-od-id` di device/content/header/section utama.

**P1 (sebaiknya)**
- [ ] Caption di atas device menyebut nama layar (misal "SPEN · BERANDA").
- [ ] Status bar jam `9:41`.
- [ ] Nominal pakai `.num` (mono) — angka sejajar.
- [ ] Copy realistis & spesifik ("Gaji +13.700.000", bukan "Rp X").
- [ ] Konten utama muat di frame 844px tanpa scroll untuk aksi utama.

**Relevan Spen**
- [ ] Semantic color benar: income=success, expense=error, transfer=warning, goal=brand.
- [ ] Light + dark (dua frame) kalau diminta.
- [ ] Bahasa Indonesia natural; istilah domain konsisten (Pendapatan, Saldo tersedia, dll.).

**Anti-fake-device** — kalau salah satu ini muncul, layar terlihat seperti "kartu yang berpura-pura jadi HP": sudut device tidak lebih rounded dari layar, Dynamic Island hilang, status bar abu-abu, home indicator hilang, tab bar tanpa border/blur.

---

## 6. Alur yang Disarankan untuk Spen

1. **Siapkan `DESIGN.md` + `design-tokens.md`** (section 2) — ini 80% hasil.
2. **Render layar inti dulu** (paling menentukan arah):
   - Setup wizard (C) → Beranda (F) → Rencana (F) → Form transaksi (E)
3. **Review 1 layar**, refine design system (`DESIGN.md`) kalau perlu — sebelum render sisanya. Ini menghemat banyak iterasi.
4. **Render sisa layar** (Report, Settings, detail wallet, goal, fixed expense, riwayat, AI sheets) pakai `DESIGN.md` yang sudah mantap.
5. **Handoff ke engineering**: tiap layar = satu `index.html` (HTML/CSS real). Kumpulkan, lalu pakai sebagai referensi visual untuk komponen React Native (Expo).

---

## 7. Catatan Penting

- **Beda dari Figma Make/Stitch**: Open Design bukan "generate semua layar sekali jalan" — ini per-layar, tapi konsistensi dijaga oleh `DESIGN.md`.
- **`design-tokens.md` bukan design system yang dibaca otomatis** — ini dokumen slot+peran (tanpa nilai). Agent perlu **diinstruksikan eksplisit** untuk membacanya dan mengisi nilainya; `DESIGN.md` yang di-attach sebagai design system.
- **Output per layar**: satu `index.html` per layar. Kalau render banyak layar, simpan di folder terpisah (misal `design/renders/beranda/`, `design/renders/rencana/`).
- **JANGAN pakai plan mode** di agent design (boros credit/limit free tier) — langsung build.
- **Hemat credit**: refine via point-and-edit / edit code, bukan regenerate dari nol.
- **Bahasa**: brief & copy dalam Bahasa Indonesia (istilah domain konsisten dari `CONTEXT.md`).
- **Konten domain**: pastikan semua prompt merujuk `CONTEXT.md` + `docs/spec.md` + `docs/design-brief.md` yang sudah di-revisi (Pendapatan item + realisasi, Goal = wallet tabungan, koreksi saldo, hero Saldo tersedia).
