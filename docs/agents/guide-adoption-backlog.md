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
⬜ **Terbuka**: T01 (#81 — noUncheckedIndexedAccess dicoba, ~50 error; catatan lengkap di isu), T04 (#82), T05 (#83), T06 (#86). Wave 2 backlog: T13, T15, T18, T19 (butuh produk/hosting), T20 (butuh produk).

### Wave 0 — Baseline harian
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T01 | tsconfig: `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (bertahap; audit `undefined` ke prop opsional) | — | open (GH) |
| T02 | Guard submit ganda + tangani rejection simpan di batas UI (`transaction-form`, `wallet-form`; pakai `useErrorToast`) | — | open (GH) |
| T03 | Validasi route params eksplisit `(tabs)/create.tsx` (`amount` NaN, `categoryId`/`transactionId`) | — | open (GH) |
| T04 | Pecah `src/types/domain.ts`: hapus legacy `@deprecated`, pindahkan tipe milik fitur, sisakan yang lintas | — | open (GH) |
| T05 | Ekstraksi file >400 baris batch 1: `transaction-form.tsx` (512), `transaction-category-picker.tsx` (503), `plan-repository.ts` (553), `settings-screen.tsx` (467) | — | open (GH) |
| T06 | `SettingsScreen` ikuti kontrak pure screen ADR-0008 (hapus props opsional + injeksi DB dari route) | — | open (GH) |
| T07 | Hentikan impor barrel fitur sendiri → path langsung (4 file: plan, setup, settings) | — | open (GH) |
| T08 | Amandemen panduan (selaraskan §2/§4/§6/§14 + `db/migrations`→`drizzle/`, route-adapter, tanpa `.types.ts`, `docs/adr/`) + commit panduan ke `docs/` | D2–D6 | open (GH) |
| T21 | Rapikan sisa refactor: hapus/konfirmasi `screen-skeleton.tsx` (tanpa konsumen); putuskan status provider (lapisan app) | — | open (backlog) |

### Wave 1 — Data persisten
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T09 | Backup hardening: ekspor snapshot konsisten (transaksi), batas ukuran/jumlah restore, tolak backup versi > app, bersihkan file sementara + cache picker | — | open (GH) |
| T10 | Uji migrasi dari DB versi lama: fixture skema m000N + lompatan beberapa versi, data lama utuh | — | open (GH) |
| T11 | `Number.isSafeInteger` pada hasil agregat (`SUM` SQL, `.reduce` ledger) | — | open (GH) |

### Wave 2 — Pra-rilis
| ID | Tiket | Blocker | Status |
|---|---|---|---|
| T12 | `src/app/+not-found.tsx` + test navigasi route tak dikenal | — | open (backlog) |
| T13 | App variants: applicationId berbeda per profile (eas) + `expo-dev-client` untuk development | — | open (backlog) |
| T15 | Error domain: pesan fallback hardcoded Bahasa Indonesia di service layer → kode error + pesan generik terlokalisasi (ADR-0006) | — | open (backlog) |
| T16 | `CONTRIBUTING.md` + checklist pra-merge/rilis resmi (panduan §15) | — | open (backlog) |
| T17 | Typed routes: formalisasi keputusan off → ADR | — | open (backlog) |
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
- Refactor ekstraksi besar (T05) & flip tsconfig ketat (T01) — butuh review bertahap agar tak meninggalkan state rusak; dijadwalkan lanjut otomatis.

## Lanjutan otomatis
Job cron satu-kali (durable) dijadwalkan untuk melanjutkan tiket open berikutnya saat sesi berikutnya terbuka. Bila job tak jalan (app tertutup), mulai sesi berikutnya dengan membaca dokumen ini lalu `gh issue list` untuk frontier.
