# Audit Gap — Adopsi Panduan Development Expo React Native

Tanggal: 8 September 2026 · Branch: `development-refactor` (4f6acc0)
Metode: 4 agent audit paralel — struktur kode, penulisan TSX/React, data/UI, tooling/workflow — membandingkan tiga sisi: **panduan** (`docs/expo-react-native-development-guide.md`; kini diamandemen §24) vs **niat terdokumentasi** (CONTEXT.md, `docs/adr/0001–0009`, `docs/design/DESIGN.md`, skill di `.agents/skills/`) vs **realita kode**.
Status `npm run verify` (8 Sep): awalnya **GAGAL** pada `migration-compat.test.ts` (konflik #2); malam harinya dihijaukan via ADR-0010 + rewrite test (model incremental). Sisa lint: 15 warning, 0 error (mayoritas `require()` di test DB yang disengaja).

Legenda: **KONFLIK** = antar-dokumen/praktik berselisih, butuh putusan manusia. MISSING = belum ada. PARTIAL = ada sebagian. DONE = sudah terpenuhi. N-A = kondisional (belum berlaku karena fitur belum ada).

## 1. Konflik lintas dokumen — butuh putusan dulu

| # | Topik | Pihak berselisih | Inti persoalan | Bukti kunci |
|---|---|---|---|---|
| 1 | Groq API key | Panduan §12/§20 (rahasia tak boleh di bundle) vs ADR-0002 (panggil langsung dari client untuk MVP; produksi via backend tipis) vs `docs/acceptance-checklist.md` (key lewat env build) | Kode memakai `EXPO_PUBLIC_GROQ_API_KEY` langsung dari client; `.env.local` berisi key nyata. Putusan: backend tipis / BYOK / bundle-dengan-risiko-didokumentasikan | `src/lib/ai-service.ts:168`; `docs/adr/0002-groq-ai-provider.md`; `.env.example` |
| 2 | Strategi migrasi DB | `migration-compat.test.ts` ("schema sudah final — squash jadi 1 baseline, tolak migrasi baru") vs ADR-0001 + skill spen-db (generate migrasi per perubahan) vs isi bundle | Test menuntut 1 migrasi; `drizzle/migrations.js` mengekspor 14 (m0000–m0013). **Suite merah terverifikasi 8 Sep**: `bundles exactly one migration` menerima 14, dan `re-applies the baseline` gagal (`table allocation_items already exists` — migrasi 1–14 tidak idempoten seperti squash). Refactor migrasi (squash?) tampak belum tuntas | `src/db/__tests__/migration-compat.test.ts:7-9`; `drizzle/migrations.js:18-52`; `.agents/skills/spen-db/SKILL.md:30-36` |
| 3 | Layering layar & route | Panduan §6/§17 (screen = komponen ber-state + data-hook sendiri) vs ADR-0008 (pure screen, data hanya via route) + ADR-0009 (route tipis) vs praktik "single-file routes" | `plan.tsx` 133 baris memuat query + callback mutasi lintas fitur + penyusunan draft; `create.tsx` 115 baris. Panduan menaruh pola itu di komponen fitur + `screens/` per fitur; refactor aktif memakai route tunggal + form besar | `src/app/(tabs)/plan.tsx:24-133`; `src/app/(tabs)/create.tsx:39-113`; `docs/adr/0008`; `docs/adr/0009` |
| 4 | Lokasi file tipe | Panduan §4 (`.types.ts` per fitur, dekat pemilik) vs struktur ADR-0009 (tanpa slot type) vs realita | `src/types/domain.ts` 183 baris menampung tipe lintas fitur + legacy `@deprecated`; view-model terbaru sudah dekat pemilik (di `read.ts`/repository). Nol `*.types.ts` di seluruh repo. Konvensi struktur tidak saling memetakan | `src/types/domain.ts`; `drizzle.config.ts:7` (perbandingan) — cek `src/features/*/read.ts` |
| 5 | Pemilik UI wallet & goal | Panduan §1/§2 (kode sedekat mungkin dengan fitur pemilik) vs realita refactor | Fitur `wallet` & `goal` hanya `data/` + barrel; UI-nya (wallet-form, wallet-cards, goal-section) tinggal di `home/components` & `plan/components`. Putusan: fitur penuh atau subdomain data milik home/plan | `src/features/wallet/`; `src/features/goal/`; `src/features/home/components/` |
| 6 | Ambang ukuran file | Panduan §7 (300 warn / 400 review) vs eslint (`max-lines` 600 error) | ≥9 file produksi >300 baris, 4 di antaranya >400 (plan-repository 553, transaction-form 512, transaction-category-picker 503, settings-screen 467). Sinyal ambigu bila ambang tidak disamakan | `eslint.config.js:15`; seksi 7 panduan |
| 7 | Lokasi keputusan | Panduan §14 (`docs/decisions/`) vs standar repo (`docs/adr/`) | Penamaan beda, isi sudah 9 ADR di `docs/adr/` | `AGENTS.md:26`; `docs/agents/domain.md:20-24` |
| 8 | Multi-currency | Panduan §9 (minor units eksplisit bila multi-currency) vs kontrak produk (currency = tampilan global tanpa konversi) | Settings menawarkan 10 kode mata uang tapi nilai disimpan integer "rupiah tanpa desimal" & diformat `maximumFractionDigits:0` → mata uang non-IDR kehilangan minor units; implikasi tak terdokumentasi | `src/db/schema/settings.ts:8-13`; `src/utils/money.ts:8-23`; `CONTEXT.md:84-86` |
| 9 | Default bahasa web | CONTEXT/ADR-0006 (English default web) vs kode | `resolveWebLocale` fallback `'id'` untuk URL/navigator tak dikenal, dan test mengunci `id`. Kode menyimpang dari niat terdokumentasi | `src/i18n/web.ts:11,15`; `src/i18n/__tests__/web.test.ts:11-12` |

## 2. Delta per wave prioritas (tabel prioritas panduan §23)

### Wave 0 — Baseline harian (seksi 4, 6, 8, 11, 16, 17)

**MISSING**

| Praktik | Delta konkret | Bukti |
|---|---|---|
| tsconfig: `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` | Hanya `strict` aktif. Konsekuensi `exactOptionalPropertyTypes`: audit pengiriman `undefined` eksplisit ke prop opsional dulu | `tsconfig.json:4` |
| Lindungi submit dari ganda (`isSaving`/ref guard) | Belum ada; tombol Simpan aktif selama simpan async | `transaction-form.tsx:160-212`; `wallet-form.tsx:52-63` |
| Tangani rejection di batas UI | Prop `onSave: (draft) => void` tapi route mengirim fungsi async tanpa try/catch → rejection tak tertangani; `useErrorToast` ada tapi tak terpakai | `transaction-form.tsx:45`; `src/app/(tabs)/create.tsx:99-102` |
| Lint lanjutan: `consistent-type-imports`, `no-floating-promises`, `no-misused-promises`, larangan `eslint-disable` tanpa alasan | Flat config perlu penyesuaian; aturan type-aware butuh type info | `eslint.config.js` |
| Error boundary & fallback render | Tidak ada; hanya default Expo Router — perlu keputusan apakah cukup | grep `ErrorBoundary` = 0 |

**PARTIAL**

| Praktik | Delta konkret | Bukti |
|---|---|---|
| Validasi batas aplikasi: route params | `amount` di-`Number()` tanpa cek NaN; `categoryId`/`transactionId` dipakai mentah | `src/app/(tabs)/create.tsx:77-89` |
| Ekstraksi hook pada komponen besar | `transaction-form.tsx` 512 baris, `plan-screen.tsx` 353 — lolos eslint 600 tapi di atas ambang review panduan; urutan ekstraksi ada di panduan §7 | `features/transactions/.../transaction-form.tsx`; `plan/screens/plan-screen.tsx` |
| Validasi form: kapan ditampilkan | Guard submit diam-diam (`return` tanpa pesan field "wajib diisi"); hanya warning over-budget/duplikat | `transaction-form.tsx:160-161` |
| Impor barrel diri sendiri | 4+ file fitur mengimpor `@/features/<fitur-sendiri>` — ubah ke path module langsung | `plan/components/plan-item-form-modal.tsx:19`; `settings/screens/settings-screen.tsx` |
| Konsistensi kontrak screen | `SettingsScreen` masih props opsional + injeksi DB dari route, belum setara pure screen lain | `settings/screens/settings-screen.tsx:46-49` |

**DONE** (jangan dikerjakan ulang): urutan isi file & declaration scope konsisten; derived dihitung saat render (bukan effect); hook top-level sebelum early return; event `handle*`/prop `on*`; loading/error/retry via `DataState` di tiap route; repository bebas toast/navigasi dengan `AppError` berkode + retry transient; parse uang eksplisit + `Number.isSafeInteger` di input; reset editor via `key` (bukan effect); race handling (`cancelled`-flag, debounce + cleanup AI); `import type` konsisten, nol `any`; eslint react-hooks v7 + `no-restricted-imports` ADR-0009.

### Wave 1 — Data persisten (seksi 9, 19)

**KONFLIK**: strategi migrasi — lihat konflik #2 (test squash vs ADR-0001/skill vs bundle 14 migrasi). Ini blokir untuk kerja migrasi apa pun.

**MISSING**

| Praktik | Delta konkret | Bukti |
|---|---|---|
| Backup = snapshot konsisten | Ekspor logis 11 tabel via `Promise.all` tanpa transaksi → bisa tak konsisten bila ada write di sela ekspor | `backup-repository.ts:113-178` |
| Batas ukuran/jumlah record saat restore | Tidak ada cek byte/record; hanya validasi versi + bentuk array | `backup-repository.ts:60-96` |
| Kebijakan file backup lebih baru dari versi app; bersihkan file sementara | Belum ada; file backup permanen di `documentDirectory`, cache DocumentPicker tak dibersihkan | `backup-repository.ts:178-200` |
| Uji migrasi dari data lama (fixture versi lama, lompatan beberapa versi) | Test hanya dari DB kosong/baseline | `src/db/__tests__/migration-compat.test.ts` |
| `Number.isSafeInteger` pada hasil penjumlahan (SUM/reduce) | Cek ada di input, belum di hasil agregasi | `src/utils/domain/ledger.ts:27-53` |
| Output migrasi ke `db/migrations` | `drizzle.config.ts` `out: './drizzle'`; panduan menamai `db/migrations` — sinkronkan penamaan + riwayat | `drizzle.config.ts:7` |

**DONE**: uang integer tanpa float; transfer dua sisi + biaya dalam satu baris atomik; saldo derived via SQL (ADR-0004/0005); `date`+`time` terpisah, periode half-open (ADR-0007); init DB terpusat WAL+FK, migrasi sebelum UI, migrasi di-bundle; parameter binding penuh (nol interpolasi); FK/unique/index berdasar query nyata (`to_wallet_idx` dari EXPLAIN).

### Wave 2 — Pra-rilis (seksi 10, 13, 15, 18, 20)

**MISSING**

| Praktik | Delta konkret | Bukti |
|---|---|---|
| `+not-found.tsx` | Tidak ada (hanya `+html`, `_layout`, privacy, terms) | `src/app/` |
| App variants: application ID berbeda per variant | Satu `com.spen.budget.app` untuk semua profile; app.json statis | `app.json:20,29`; `eas.json` |
| Development build berfungsi | `eas.json` `developmentClient: true` tapi `expo-dev-client` tidak ada di dependencies → dev build tak penuh; kemungkinan masih Expo Go | `package.json`; `eas.json:7-9` |
| Logger/error reporting terpusat | Grep `logger|console` di `src/` kosong — kondisional, perlu keputusan | — |
| `CONTRIBUTING.md` | Tidak ada | glob = 0 |
| Checklist pra-merge/rilis sebagai dokumen | CI `verify` ada; checklist lengkap (state, i18n/a11y, secret, migrasi) belum terdokumentasi | `.github/workflows/quality.yml` |

**PARTIAL**

| Praktik | Delta konkret | Bukti |
|---|---|---|
| Default bahasa web | Fallback `'id'` vs niat English (konflik #9) | `src/i18n/web.ts:11,15` |
| Pesan error tak bocor hardcoded | `AppError` service layer ber-Bahasa Indonesia bisa bocor untuk kode tak dikenal | `wallet-repository.ts:16,58,93,129` |
| Aksesibilitas | `accessibilityRole`/`Label` luas (219/39 file), hit target ≥44px, reduce-motion dihormati; `accessibilityHint` jarang; belum ada bukti uji TalkBack/VoiceOver/font besar | lintas layar |
| Typed routes | Mati (`experiments.typedRoutes` absen); keputusan "tak perlu" hanya informal di taste, bukan ADR | `app.json` |
| Smoke test release / uji native setelah perubahan native | Hanya checklist device manual | `docs/acceptance-checklist.md:69` |

**DONE**: token tema + komponen themed; format angka/tanggal per locale teruji; `DataState`/`EmptyState`/toast; i18next + interpolasi, paritas key dijamin test (ADR-0006); safe area/keyboard/platform; reduce motion; React Compiler dicek = off, tidak diasumsikan; bootstrap urut (splash → font → DB+migrasi → seed → locale/currency/theme → hide, dengan `DatabaseErrorState` + retry); route params serializable + refresh saat focus; app.json bersih tanpa permission tambahan (fitur kamera/lokasi/notifikasi memang tidak ada); CNG tanpa folder native, migrasi SQL di-bundle via metro/babel minimal.

### Sesuai kebutuhan & berdasarkan pengukuran (seksi 12, 21, 22)

| Praktik | Status | Catatan |
|---|---|---|
| FlatList/SectionList untuk daftar | **0 penggunaan**; semua daftar `.map` di ScrollView. Kelayakan tergantung dataset nyata — baseline 10.000 tx sudah ada, indikasi perlu | `docs/performance-baseline.md`; daftar di daily/home/plan |
| `expo-doctor` & `expo install --check` otomatis | Tidak ada script/step CI | `package.json` |
| Drizzle rc → stable | `drizzle-orm`/`drizzle-kit` 1.0.0-rc.4; tercatat di `docs/dependency-audit.md` (#45), belum ada keputusan | `package.json:11,50` |
| Pin Node/package manager repo | `engines` kosong, tanpa `.nvmrc`; hanya CI yang pin | `.github/workflows/quality.yml:17` |
| Sinkronkan `jest` vs `@types/jest` | ^29.7.0 vs ^30.0.0 (masalah yang memang ditunjuk panduan) | `package.json:46,53` |

**DONE/N-A**: baseline query + EXPLAIN ada (`docs/performance-baseline.md`, script `benchmark:database`); ekspo SDK 57 konsisten dengan README/AGENTS; lint correctness terpisah dari Prettier; ESLint 9 flat + `eslint-config-expo`; lockfile di-commit + `npm ci`; OTA/crash reporting/background task/enkripsi at-rest/auth = belum fitur (klausa kondisional panduan → N-A). Catatan risiko: backup JSON plaintext berisi seluruh data finansial — keputusan enkripsi belum ada.

## 3. Sudah kuat, jangan dikerjakan ulang

Struktur top-level `src/` sesuai pohon panduan; subfolder fitur dibuat hanya bila berisi; shared dipindah hanya bila lintas fitur dengan arah dependensi naik yang ditegakkan eslint; barrel publik per fitur tanpa barrel global; penamaan kebab-case/hook `use*`/suffix `-screen` konsisten; layar murni tanpa SQL (ADR-0008) untuk home/plan/report/daily/faq/public-doc; pemisahan row DB vs input vs view-model; pengujian di service layer dengan DB nyata (node:sqlite) + RNTL (33 file test).

## 4. Belum bisa dinilai tanpa konteks

- Enkripsi at-rest (keputusan produk belum ada); pengujian a11y perangkat; scroll perf/kelayakan FlatList; debounce AI (butuh pengukuran); kecukupan error boundary default Expo Router; retry semua error read (non-transient?).
- `src/components/layout/screen-skeleton.tsx` tanpa konsumen — sisa refactor? (konfirmasi lalu hapus)
- `src/providers/*` mengimpor fitur (titik pemasangan level app, di-exempt eslint) — putuskan status: lapisan app (boleh) atau shared (tidak)
- Lokasi read model tidak seragam: `read.ts` di akar fitur (home/plan/report) vs `data/*-read.ts` (transactions)
- Status suite terverifikasi (8 Sep): 32/33 hijau; merah hanya `migration-compat.test.ts` (2 test, konflik #2). Lint: 20 warning 0 error — mayoritas `require()` di test DB (disengaja, node:sqlite) + sisa refactor: `date-field.tsx` import `View` tak terpakai, `goal-repository.ts` 2 import tak terpakai, `plan-screen.test.tsx`/`public-document-screen.test.tsx` destructure tak terpakai, `use-focused-read.ts` exhaustive-deps warning

## 5. Langkah lanjutan yang disarankan

1. **Putuskan konflik §1 satu per satu** (sesi keputusan → ADR baru atau amandemen panduan). Urutan yang saling menggantung: #2 migrasi (blokir Wave 1) → #3+#4 layering/tipe (blokir banyak delta Wave 0) → #6 ambang file → sisanya.
2. **Amandemen panduan** untuk penyimpangan yang diputuskan (mis. route-adapter ADR-0008, struktur tanpa `.types.ts`, `docs/adr/`) — supaya panduan tidak menyesatkan sesi berikutnya; catat alasan di ADR terkait (panduan §23).
3. **Eksekusi per wave** setelah peta keputusan jelas: delta jadi tiket berurutan (blockers-first), dikerjakan dengan test, ditutup code-review per PR.
4. Tinjau ulang panduan saat upgrade Expo SDK / perubahan arsitektur.
