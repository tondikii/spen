# Open Design — Guide Operasional untuk Spen

Panduan memakai **Open Design** (nexu-io/open-design) dengan **local coding agent (Codex)** untuk menghasilkan design aplikasi Spen yang konsisten, align dengan domain, dan siap dirujuk oleh `/to-tickets` serta implementasi.

> **Prinsip**: `docs/design/DESIGN.md` adalah satu-satunya tempat keputusan visual. Guide ini hanya operasional — cara pakai Open Design untuk Spen. Konten produk & domain ada di file yang dirujuk, bukan disalin di sini.
> Sumber konten: `CONTEXT.md` (glossary) · `docs/spec.md` (user stories & keputusan) · `docs/design-brief.md` (produk & UX) · `docs/design/DESIGN.md` (brand contract) · `docs/design/design-tokens.md` (slot token tanpa nilai).
> Riset best practice dengan sumber primer: `docs/design/research-open-design-best-practices.md`.

---

## 1. Cara Kerja Open Design (fakta dari sumber primer)

- Desktop app (Windows x64) **tidak punya agent sendiri** — design engine-nya adalah CLI coding agent lokal yang sudah terpasang. Codex didukung resmi: `od mcp install codex`.
- **Working directory agent = root project Open Design.** Arahkan ke repo ini (`C:\Users\Engineer\Documents\projects\spen`) supaya semua path relatif (`docs/...`) resolve, dan hasil render bisa disimpan ke repo.
- **Satu render = satu layar = satu `index.html`** di root project. Ini hard rule template `mobile-app`: *"Single screen, single job."* Jangan paksa beberapa layar dalam satu prompt — agent akan menolak atau memecahnya sendiri.
- Setiap render mengomposisi (urutan): full `DESIGN.md` → `tokens.css` → craft rules (`state-coverage`, `animation-discipline`) → skill body. **Perbaiki `DESIGN.md` → semua render berikutnya ikut membaik.** Ini lever utama konsistensi lintas layar.
- Ada **linter anti-ai-slop** otomatis: pelanggaran P0/P1 dilaporkan ke UI dan dikirim balik ke agent untuk self-correction.

---

## 2. Persiapan (sekali saja)

### a. Brand contract — sudah siap

- `docs/design/DESIGN.md` — brand contract (9 section: visual theme, color roles, typography, spacing, components, states, do's & don'ts, accessibility, agent prompt guide).
- `docs/design/design-tokens.md` — slot token & peran **tanpa nilai**; agent yang mengisi nilainya saat render.

Semua prompt **wajib menyuruh agent membaca keduanya**. `design-tokens.md` tidak dibaca otomatis — perlu instruksi eksplisit.

### b. Rekam balik nilai (setelah layar inti disetujui)

Open Design menjadikan **`tokens.css` sebagai kanonik nilai konkret**, dan `DESIGN.md` (prosa) harus **sinkron dengan tokens.css**. Setelah layar inti disetujui: kunci nilai yang dipilih agent ke `docs/design/tokens.css` (dengan `[data-theme="dark"]` override), sinkronkan prosa `DESIGN.md`, dan tambahkan `manifest.json` bila mau jadi package (`design-systems/spen/`). Dari `tokens.css` inilah developer menurunkan token React Native 1:1.

> Jangan isi nilai di `design-tokens.md` — file itu tetap slot; nilai mengalir ke `tokens.css` + `DESIGN.md`.

---

## 3. Template & Archetype

**Template**: `mobile-app` — frame iPhone 15 Pro pixel-accurate (390×844, radius device 56px / screen 44px, Dynamic Island, status bar SVG, home indicator). Seed menyediakan: `.device`, `.ph-img`, `data-od-id`, `.num`, tab bar, dan **enam variabel `:root` yang wajib diganti agent**: `--bg --surface --fg --muted --border --accent`.

> **Tab bar Spen = 5 slot dengan "+" tengah** (`Beranda | Rencana | [+] | Report | Settings`). Seed default 4 tab — agent harus **menambah slot ke-5 dan tombol "+" tengah yang menonjol**, dengan style tambahan didefinisikan di `<style>` seed (diizinkan oleh class-inventory rule). Sebutkan ini eksplisit di tiap prompt layar bertab.

Archetype (dari `references/layouts.md`; pilih yang paling cocok dengan **aksi utama** layar):

| Layar Spen | Archetype | Tab bar? |
|---|---|---|
| Setup wizard (welcome, buat wallet, pilih currency) | **C — Onboarding** | buang |
| Beranda (total saldo, wallet cards, transaksi terbaru) | **F — Focus** (hero angka saldo) | ya |
| Rencana (hero saldo tersedia + section cards) | **F — Focus** (hero angka) | ya |
| Report (ringkasan + charts) | **F — Focus** | ya |
| Form transaksi / form wallet (full-screen modal) | **E — Checkout/form** | buang |
| Detail wallet bottom sheet | **B — Detail** | buang |
| Goal / fixed expense item | **B — Detail** | buang |
| Riwayat transaksi (list) | **A — Feed** | ya |
| Settings (list) | **A — Feed** | ya |
| AI Suggestion / AI Insight sheet | render layar dasarnya (Rencana/Report) + sheet terbuka | sesuai dasar |

Aturan tab bar: archetype Onboarding/Detail/Checkout → **buang** `<nav class="tabbar">`; Feed/Focus → **pertahankan**.

---

## 4. Prompt per Layar (templat best-practice)

```
Gunakan design system Spen: baca docs/design/DESIGN.md + docs/design/design-tokens.md
(slot token tanpa nilai — isi nilainya sendiri, konsisten, dan map ke enam variabel
:root seed: --bg --surface --fg --muted --border --accent). Jangan ubah frame-nya.
Baca seed assets/template.html + references/layouts.md + references/checklist.md.
Juga baca untuk akurasi domain & konten: CONTEXT.md (glossary), docs/spec.md (user stories
& keputusan), docs/design-brief.md (produk & UX). Gunakan istilah & perilaku fitur yang benar dari sana.

Buat prototype mobile (template mobile-app, archetype [A-F]) untuk layar: [NAMA].
[Untuk layar bertab: tab bar Spen = 5 slot Beranda | Rencana | [+] | Report | Settings,
+ tengah menonjol; tab aktif sesuai layar ini.]

KONTEKS PRODUK:
- [fitur & data yang tampil di layar ini, pakai istilah domain: Wallet, Budget plan,
  Pendapatan, Fixed expense, Goal, Spare budget, Saldo tersedia, Transaksi penyesuaian]

ISI LAYAR (spesifik — copy asli, bukan placeholder; angka contoh realistis & konsisten lintas layar):
- [konten: nominal Rp 2.500.000, label Bahasa Indonesia, status "Lunas ✓"/"Melebihi Budget", dsb.]

ARAHAN TEMA (opsional — override dari DESIGN.md):
- [misal: "hero saldo tersedia paling menonjol di layar ini"]

KERJAKAN:
- Satu layar, satu archetype. Frame iPhone 15 Pro utuh (Dynamic Island, status bar SVG, home indicator).
- Theme: DUA frame — light + dark (seed single-theme; jangan andalkan [data-theme]).
- Caption di atas device: "SPEN · [NAMA LAYAR]".
- Tab bar sesuai archetype (buang untuk C/B/E; pertahankan untuk F/A dengan tab aktif benar).
- data-od-id di device/content/header/section utama. Nominal pakai .num (mono). Display pakai var(--font-display).
- Accent ≤ 2× per layar (1 tab aktif + 1 CTA). Jangan emoji untuk ikon (SVG monoline);
  jangan URL gambar eksternal (pakai .ph-img); jangan gradient dua-stop; jangan >12 hex mentah di luar :root.
- State penting (sesuai layar): empty, loading, over-budget, defisit, goal tercapai, error — jangan cuma populated.
- Copy realistis & spesifik, Bahasa Indonesia. Selesai: self-check checklist (P0 wajib). Jangan tanya-tanya dulu.
```

**Kunci yang sering meleset (sebutkan eksplisit kalau perlu):** satu aksen maksimal 2×; nominal besar & `.num`; istilah domain dari `CONTEXT.md` (bukan sinonim); angka contoh konsisten antar layar (pakai blok data pengguna yang sama).

---

## 5. Checklist Rendering (per layar)

Checklist resmi template (`references/checklist.md`) — P0 wajib. Yang paling sering meleset & relevan Spen:

**P0 (wajib)**
- [ ] Frame utuh: Dynamic Island, status bar SVG asli (signal/wifi/battery, bukan teks `· · · 5G`), home indicator terakhir terlihat. Jangan tulis ulang frame.
- [ ] Content scroll, frame tidak (`<main class="content">` `overflow-y: auto`).
- [ ] Tap target ≥ 44px; body ≥ 14px.
- [ ] Satu aksen, ≤ 2× per layar.
- [ ] Tanpa URL gambar eksternal — pakai `.ph-img`.
- [ ] Tab bar sesuai archetype; Spen = 5 slot + "+" tengah.
- [ ] Display heading pakai `var(--font-display)`.
- [ ] Tanpa emoji ikon (SVG monoline).
- [ ] `data-od-id` di device/content/header/section utama.

**P1 (sebaiknya)**
- [ ] Caption di atas device: "SPEN · [NAMA LAYAR]".
- [ ] Status bar jam `9:41`.
- [ ] Nominal `.num` (mono) — angka sejajar.
- [ ] Copy realistis & spesifik ("Gaji +13.700.000", bukan "Rp X").
- [ ] Aksi utama muat di frame 844px tanpa scroll.

**Relevan Spen**
- [ ] Semantic color benar: income=success, expense=error, transfer=warning, goal=brand.
- [ ] Light + dark (dua frame).
- [ ] Bahasa Indonesia natural; istilah domain konsisten (Pendapatan, Saldo tersedia, Transaksi penyesuaian).

**Anti-fake-device** — kalau muncul: sudut device tidak lebih rounded dari layar, Dynamic Island hilang, status bar abu-abu, home indicator hilang, tab bar tanpa border/blur → layar terlihat "kartu berpura-pura jadi HP".

---

## 6. Alur untuk Spen

1. **Render layar inti dulu** (paling menentukan arah): Setup wizard (C) → Beranda (F) → Rencana (F) → Form transaksi (E).
2. **Review per layar** — mulai dari Beranda/Rencana. Kalau kurang pas, **refine `DESIGN.md` dulu**, baru render layar berikutnya (setiap render membaca ulang DESIGN.md, jadi perbaikan menyebar otomatis).
3. **Render sisa layar** (Report, Settings, detail wallet, goal, fixed expense, riwayat, AI sheets) dengan design system yang sudah mantap.
4. **Rekam nilai balik** ke `docs/design/tokens.css` + sinkronkan `DESIGN.md` (lihat §2b).
5. **Handoff ke engineering** — lihat §7.

**Iterasi (bukan regenerate):** pakai pola refine resmi — pilih satu arah (clarity / hierarchy / polish / accessibility / responsiveness / fidelity), patch terkecil, critique terhadap DESIGN.md. Jangan generate ulang dari nol; jangan pakai plan mode (boros limit).

---

## 7. Handoff ke `/to-tickets` & Implementasi (strategis)

### a. Struktur output — anchor untuk ticket

Satu layar = satu folder = satu `index.html` (+ frame dark), disimpan di **`docs/design/renders/<slug>/`**:

```
docs/design/renders/
├── setup-wizard/      index.html (+ dark)
├── beranda/           index.html (+ dark)
├── rencana/           index.html (+ dark)
├── report/            index.html (+ dark)
├── settings/          index.html (+ dark)
├── form-transaksi/    index.html (+ dark)
├── detail-wallet/     ...
└── ...
```

Tiga anchor stabil yang bisa dirujuk ticket & implementasi:
1. **Path folder** — `docs/design/renders/<slug>/index.html` = referensi visual per ticket UI.
2. **Caption** — "SPEN · BERANDA" dst. memberi identitas layar yang konsisten antar dokumen.
3. **`data-od-id`** — section anchor (hero, header, feed, dst.) untuk menunjuk bagian spesifik layar.

### b. Rekam nilai → token implementasi

Setelah disetujui, kunci nilai ke `docs/design/tokens.css` (kanonik) + sinkronkan prosa `DESIGN.md`. Developer menurunkan token React Native **1:1** dari file itu: warna/font/radius/spacing/typography scale. Motion: map durasi & easing token ke RN `Animated`/Reanimated. State yang didesain (empty/loading/over-budget/defisit/tercapai/error) menjadi state yang diimplementasikan.

### c. Saat `/to-tickets`

Ticket yang menyentuh UI menyebut referensi visual sebagai sumber primer, misal:

> **Visual reference:** `docs/design/renders/beranda/` (caption: "SPEN · BERANDA", `data-od-id` section: `hero`, `wallet-cards`)

Ini membuat tiap ticket self-contained secara visual, dan `/implement` bisa menuntut kesesuaian terhadap render. Hasil render = HTML/CSS asli — bisa di-drop ke agent implementasi sebagai referensi langsung (bukan sekadar gambar).

### d. Konversi ke React Native (pola resmi `od-react-export`)

- Ambil boundary komponen **terkecil** yang mempertahankan design.
- Props **minimal** — hanya konten/state yang memang bervariasi.
- Pertahankan semantik aksesibilitas (heading, button, label, focus).
- Jangan flatten ke div generik; jangan tambah component library baru.
- Token dari `tokens.css` → konstanta RN (warna, font, spacing, radius); proporsi komponen (tinggi tombol 48px, radius 14px, tab bar blur) ditiru dari HTML.

---

## 8. Catatan Penting

- **Satu layar per render adalah hard rule** template `mobile-app` — jangan digabung dalam satu prompt.
- **`design-tokens.md` tidak dibaca otomatis** — instruksikan eksplisit di prompt.
- **DESIGN.md yang di-attach/read sebagai design system**; nilai konkret direkam ke `tokens.css` setelah disetujui.
- **Output per layar**: satu `index.html` → simpan ke `docs/design/renders/<layar>/`.
- **JANGAN pakai plan mode** di agent design — langsung build.
- **Hemat limit**: refine via patch kecil per layar, bukan regenerate; jaga DESIGN.md & brief tetap lean (prompt terlalu besar → `AGENT_PROMPT_TOO_LARGE`).
- **Bahasa**: brief & copy Bahasa Indonesia (istilah domain konsisten dari `CONTEXT.md`).
- Riset lengkap dengan sumber: `docs/design/research-open-design-best-practices.md`.
