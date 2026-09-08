# Contributing — Spen

Terima kasih sudah ingin berkontribusi. Repo ini single-context: `CONTEXT.md` adalah glossary domain (plus `_Avoid_`), `docs/adr/` berisi keputusan arsitektur, dan `docs/agents/` berisi prosedur untuk agen.

## Sebelum mulai

- Baca `CONTEXT.md` — istilah domain dipakai apa adanya; sinonim di `_Avoid_` dihindari.
- Baca ADR terkait area kerja (daftar di `docs/adr/`). Keputusan baru ditulis sebagai ADR, bukan komentar.
- Panduan gaya & arsitektur: `docs/expo-react-native-development-guide.md` (diamandemen sesuai ADR; lihat lampiran di dalamnya).
- Skills agen yang relevan ada di `.agents/skills/` (pola per domain).

## Alur kerja

1. Ambil/masukkan ticket lewat `gh` (issues GitHub). Kerjakan blockers dulu.
2. **Test-first** di seam service layer (DB nyata `node:sqlite` untuk repository; RNTL untuk layar). Lihat `.agents/skills/spen-db` dan `spen-rn-testing`.
3. Pastikan hijau: `npm run verify` (format → lint → typecheck → test). Jangan push dengan verify merah.
4. Semua teks UI lewat i18n (`id` default + `en`, paritas key dijaga test). Copywriting: ringkas, santai-tenang, tanpa kesan AI.
5. Uang = integer; transaksi yang mengubah invariant saldo memakai `withExclusiveTransactionAsync`.
6. Commit lokal per slice kecil dengan pesan conventional (`feat|fix|refactor|test|docs|chore`), referensikan ticket. Push ke branch lalu buka PR ke `development`.

## Checklist sebelum PR/merge

Lihat `docs/release-checklist.md` dan `docs/acceptance-checklist.md` (item device tetap diverifikasi pemilik di perangkat).

## Menyentuh schema?

Ubah `src/db/schema/`, generate migrasi (`npx drizzle-kit generate`), review SQL hasil generate, dan jangan edit migrasi lama (ADR-0010).
