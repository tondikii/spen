# Backlog Adopsi Panduan Development Expo React Native

Tanggal: 8 September 2026 · Branch: `development-refactor`
Sumber analisis: `docs/agents/guide-adoption-gap.md` (matriks gap). Acuan: `docs/expo-react-native-development-guide.md` (panduan; diamandemen §24).
Cara pakai: kerjakan tiket open yang paling depan (blockers-first). Tiap tiket: test-first, `npm run verify` hijau, lalu tandai status di sini dan tutup isu GitHub-nya.

## Keputusan terpilih (8 Sep, otorisasi penuh pemilik)

| ID | Konflik (gap doc) | Keputusan | Status |
|---|---|---|---|
| D1 | #2 Migrasi squash vs incremental | **Tetap incremental** (ADR-0001 + skill spen-db). Test compat di-rewrite ke invariant model incremental. Squash hanya bila diputuskan terpisah menjelang rilis | ✅ DONE — ADR-0010 + test hijau |
| D2 | #3 Layering screen/route | Pertahankan **ADR-0008** (pure screen, data via route adapter) + **ADR-0009** (route tipis). Panduan §6/§17 diamandemen: contoh screen ber-state tidak berlaku untuk Spen | 🎫 Amandemen panduan (T08) |
| D3 | #4 Lokasi file tipe | Pertahankan struktur ADR-0009. **Tidak** mengadopsi `.types.ts` per fitur; tipe view-model dekat pemilik. `src/types/domain.ts` dipecah: legacy dihapus, tipe milik fitur pindah ke fitur | 🎫 T04 |
| D4 | #5 Pemilik UI wallet/goal | Fitur data-only (`wallet`, `goal`) sah; UI boleh tinggal di fitur konsumen (home/plan). Dikunci di ADR-0009 (amandemen) — tanpa perpindahan file besar | 🎫 T08 |
| D5 | #6 Ambang ukuran file | Target bertahap ke panduan (300 warn/400 review) via ekstraksi; eslint tetap 600 error sampai ekstraksi selesai | 🎫 T05 |
| D6 | #7 Lokasi keputusan | `docs/adr/` menang (standar repo); panduan §14 diamandemen | 🎫 T08 |
| D7 | #9 Default bahasa web | **English** default web (sesuai CONTEXT/ADR-0006) — kode yang menyimpang dikoreksi | ✅ DONE — `web.ts` + test |
| D8 | #8 Multi-currency | Produk display-only tanpa konversi (CONTEXT) dipertahankan; klausa panduan tentang minor units tidak berlaku. Risiko format non-IDR dicatat, tanpa ubah kode | 📝 dicatat |
| D9 | #1 Groq API key | MVP langsung dari client sah per ADR-0002; **produksi wajib backend tipis**. Key tetap gitignored. Ticket pra-rilis dibuat | 🎫 T19 |

## Tiket

Nomor GitHub: T01=#81 · T02=#91 · T03=#84 · T04=#82 · T05=#83 · T06=#86 · T07=#90 · T08=#87 · T09=#85 · T10=#89 · T11=#88. (Isu #73 = spec ADR-0009 yang sudah ada sebelumnya, terkait.)

### Status malam 8 Sep
✅ **Selesai & isu ditutup**: T02 (#91), T03 (#84), T07 (#90), T09 (#85), T10 (#89), T11 (#88), T08 (#87). Tanpa isu: T12 (+not-found), T16 (CONTRIBUTING + release checklist), T17 (ADR typed routes), T21 (skeleton + provider, amandemen ADR-0009). D1 & D7 dikerjakan langsung (ADR-0010 + web locale).
⬜ **Terbuka**: Wave 2 backlog: T15 (dikerjakan 9 Sep), T18, T19 (butuh produk/hosting), T20 (butuh produk).

### Lanjutan otomatis 9 Sep
✅ **T01 (#81) selesai** — `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` aktif; `npm run verify` hijau (commit `2406480`, `06912d5`). Isu ditutup.
✅ **T04 (#82) selesai** — tipe milik fitur plan pindah ke `features/plan/model.ts` (commit `11d881f`); `domain.ts` hanya tipe lintas. Isu ditutup.
✅ **T05 (#83) selesai** — efektif turun: `transaction-form` 524→272, `transaction-category-picker` 489→312, `plan-repository` 532→347, `settings-screen` 467→126; sibling modul baru per fitur. Isu ditutup.
✅ **T06 (#86) selesai** — `SettingsScreen` pure screen ADR-0008: props wajib (tanpa default longgar), DB/berkas/link pindah ke route adapter `(tabs)/settings/index.tsx`. Isu ditutup.
✅ **T13 selesai** — `app.json` → `app.config.js`: application ID per profile EAS (`com.spen.budget.{dev,preview,app}`); `expo-dev-client` terpasang (development profile sudah `developmentClient: true`).
✅ **T15 selesai** — error domain terlokalisasi: seluruh throw `AppError` di service/data layer memakai kode + params (tanpa pesan hardcoded); pesan generik per locale lewat `errors.*` di boundary UI (commit `cd6d74e`). Penyerta: perbaikan setup jest untuk reanimated 4.5.1 + worklets 0.10.1 (mock holder API + `mock.js` reanimated, commit `5a31139`); suite penuh hijau 34/34.
✅ **T21 selesai** — `screen-skeleton.tsx` tanpa konsumen dihapus (commit `d7c5e78`); status provider = lapisan aplikasi dikunci di amandemen ADR-0009 + dikecualikan di eslint. `structure-recommendation.md` dipertahankan sebagai sumber ADR-0009.
✅ **Spec #73 ditutup** — seluruh tracer bullet (#74–#80) + T21 + audit struktur ADR-0009 tuntas; repo hijau.

### Wave 0 — Baseline harian
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T01 | tsconfig: `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (bertahap; audit `undefined` ke prop opsional) | — | ✅ selesai & isu ditutup (9 Sep) |
| T02 | Guard submit ganda + tangani rejection simpan di batas UI (`transaction-form`, `wallet-form`; pakai `useErrorToast`) | — | ✅ selesai & isu #91 ditutup |
| T03 | Validasi route params eksplisit `(tabs)/create.tsx` (`amount` NaN, `categoryId`/`transactionId`) | — | ✅ selesai & isu #84 ditutup |
| T04 | Pecah `src/types/domain.ts`: hapus legacy `@deprecated`, pindahkan tipe milik fitur, sisakan yang lintas | — | ✅ selesai & isu ditutup (9 Sep) |
| T05 | Ekstraksi file >400 baris batch 1: `transaction-form.tsx` (512), `transaction-category-picker.tsx` (503), `plan-repository.ts` (553), `settings-screen.tsx` (467) | — | ✅ selesai & isu ditutup (9 Sep) |
| T06 | `SettingsScreen` ikuti kontrak pure screen ADR-0008 (hapus props opsional + injeksi DB dari route) | — | ✅ selesai & isu ditutup (9 Sep) |
| T07 | Hentikan impor barrel fitur sendiri → path langsung (4 file: plan, setup, settings) | — | ✅ selesai & isu #90 ditutup |
| T08 | Amandemen panduan (selaraskan §2/§4/§6/§14 + `db/migrations`→`drizzle/`, route-adapter, tanpa `.types.ts`, `docs/adr/`) + commit panduan ke `docs/` | D2–D6 | ✅ selesai & isu #87 ditutup |
| T21 | Rapikan sisa refactor: hapus/konfirmasi `screen-skeleton.tsx` (tanpa konsumen); putuskan status provider (lapisan app) | — | ✅ selesai (commit `d7c5e78`; amandemen ADR-0009) |

### Wave 1 — Data persisten
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T09 | Backup hardening: ekspor snapshot konsisten (transaksi), batas ukuran/jumlah restore, tolak backup versi > app, bersihkan file sementara + cache picker | — | ✅ selesai & isu #85 ditutup |
| T10 | Uji migrasi dari DB versi lama: fixture skema m000N + lompatan beberapa versi, data lama utuh | — | ✅ selesai & isu #89 ditutup |
| T11 | `Number.isSafeInteger` pada hasil agregat (`SUM` SQL, `.reduce` ledger) | — | ✅ selesai & isu #88 ditutup |

### Wave 2 — Pra-rilis
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T12 | `src/app/+not-found.tsx` + test navigasi route tak dikenal | — | ✅ selesai (tanpa isu; `+not-found.tsx` ada) |
| T13 | App variants: applicationId berbeda per profile (eas) + `expo-dev-client` untuk development | — | ✅ selesai (9 Sep) |
| T15 | Error domain: pesan fallback hardcoded Bahasa Indonesia di service layer → kode error + pesan generik terlokalisasi (ADR-0006) | — | ✅ selesai (9 Sep) — commit `cd6d74e`; suite hijau |
| T16 | `CONTRIBUTING.md` + checklist pra-merge/rilis resmi (panduan §15) | — | ✅ selesai (tanpa isu; `CONTRIBUTING.md` + `docs/release-checklist.md` ada) |
| T17 | Typed routes: formalisasi keputusan off → ADR | — | ✅ selesai (tanpa isu; `docs/adr/0011-typed-routes-off.md`) |
| T18 | Aksesibilitas pass: `accessibilityHint` pada kontrol ikon; dokumen uji perangkat (TalkBack/VoiceOver) di acceptance checklist | perangkat | open (backlog) |
| T19 | Groq backend tipis pra-rilis (ADR-0002) | produk/hosting | open (backlog) |
| T20 | Enkripsi at-rest & backup (keputusan produk; risiko backup JSON plaintext) | produk | open (backlog) |

### Dikerjakan otomatis malam 8 Sep (tanpa tiket)
- ADR-0010 + rewrite `migration-compat.test.ts` → suite hijau (D1).
- `src/i18n/web.ts` + test: default web `en` (D7).
- Sweep warning lint sisa refactor: `date-field.tsx`, `goal-repository.ts`, `plan-screen.test.tsx`, `public-document-screen.test.tsx`.
- `docs/adr/0010-incremental-migrations.md`, `docs/agents/guide-adoption-gap.md`, dokumen ini.

## Tidak dikerjakan otomatis semalam (alasan)
- Uji perangkat nyata (a11y, smoke native) — butuh device/build.
- Keputusan produk: enkripsi at-rest (T20), backend Groq (T19), kelayakan FlatList (butuh dataset nyata).
- Refactor ekstraksi besar (T05) — butuh review bertahap agar tak meninggalkan state rusak; dijadwalkan lanjut otomatis. (T01 tsconfig ketat selesai 9 Sep.)

## Lanjutan otomatis
Job cron satu-kali (durable) dijadwalkan untuk melanjutkan tiket open berikutnya saat sesi berikutnya terbuka. Bila job tak jalan (app tertutup), mulai sesi berikutnya dengan membaca dokumen ini lalu `gh issue list` untuk frontier.

### Keadaan frontier (9 Sep, setelah T15 + #73)
- Semua isu GitHub CLOSED (termasuk spec #73). Sisa open hanya di dokumen ini (Wave 2): **T18** (a11y — butuh uji perangkat TalkBack/VoiceOver untuk verifikasi penuh), **T19** (backend Groq — butuh keputusan produk/hosting), **T20** (enkripsi at-rest — butuh keputusan produk).
- T18 punya bagian kode yang bisa dikerjakan tanpa device (`accessibilityHint` pada kontrol ikon + dokumen uji perangkat di acceptance checklist). Bila sesi berikutnya tanpa device: kerjakan bagian kode T18, tandai verifikasi perangkat sebagai langkah manusia, lalu commit.
- `npm run verify` lokal = jalur keputusan: format:check + lint + typecheck + `npm test` (NODE_ENV=test via cross-env).
