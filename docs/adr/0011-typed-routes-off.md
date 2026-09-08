# ADR-0011: Typed routes Expo Router sengaja tidak diaktifkan (untuk sekarang)

Status: Accepted · 8 September 2026

## Konteks

Panduan development seksi 18 menyebut typed routes (`experiments.typedRoutes`) sebagai opsi, dengan syarat tipe route di-generate dan diverifikasi (mis. di CI). Keputusan "tak perlu" selama ini hanya tercatat informal di `.commandcode/taste`, bukan di repo. Route Spen menerima parameter via `useLocalSearchParams` dan memvalidasi/me-parse manual (lihat `src/app/(tabs)/create.tsx`), dengan test navigasi eksplisit.

## Keputusan

Typed routes **tetap nonaktif** untuk fase ini. Alasan:
- Generate tipe route berjalan setiap perubahan struktur `src/app`; fase refactor aktif (development-refactor) masih sering memindahkan/me-nest route, sehingga biaya regenerasi tinggi dan sinyal typecheck jadi berisik.
- Parameter divalidasi manual di batas aplikasi (T03) dan diuji; typed routes tidak menghilangkan kebutuhan validasi runtime.
- Web hanya 2 route dokumen + native utama; keuntungan autocomplete lintas 5 tab kecil dibanding biaya sekarang.

## Konsekuensi

- Keputusan ini ditinjau ulang saat struktur route stabil (pasca refactor) atau saat bug typo route muncul; aktivasi cukup satu baris di `app.json` + `npx expo customize tsconfig.json` + generate di CI.
- Catatan informal di taste tidak lagi menjadi satu-satunya jejak; keputusan terdokumentasi di sini (ADR-0009 amandemen: route adapter tetap satu-satunya penyambung data).
