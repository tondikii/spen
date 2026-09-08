# ADR-0010: Migrasi bersifat incremental — test compat diselaraskan

Status: Accepted · 8 September 2026

## Konteks

`src/db/__tests__/migration-compat.test.ts` adalah artefak era "DB fix / schema final": mengunci migrasi di-squash menjadi **tepat satu baseline** dan mengharuskan eksekusi ulang mentah aman (idempoten via `IF NOT EXISTS`). Asersi itu bertentangan dengan:
- ADR-0001 + skill `spen-db`: migrasi di-generate `drizzle-kit` per perubahan; **jangan edit migrasi lama**;
- isi nyata bundle `drizzle/migrations.js`: 14 migrasi incremental (m0000–m0013).

Akibatnya suite `verify` merah (2 test gagal): jumlah migrasi 14 ≠ 1, dan migrasi incremental memang tidak dirancang idempoten untuk eksekusi ulang mentah.

## Keputusan

Migrasi **tetap incremental** (menegaskan ADR-0001). Test compat di-rewrite untuk menjaga invariant model incremental:
- jumlah migrasi = jumlah entri journal, berurutan (`idx` 0..n-1), tiap entri punya folder migrasi;
- penerapan berurutan seluruh migrasi pada DB kosong menghasilkan schema final (daftar tabel + kolom kunci).

Idempotensi runtime tidak diuji dengan eksekusi ulang mentah; dijamin `useMigrations` (drizzle) lewat tabel bookkeeping `__drizzle_migrations`.

## Konsekuensi

- Setiap perubahan schema = satu migrasi baru + test ikut menjaganya tetap konsisten.
- Squash baseline hanya sah bila diputuskan terpisah (mis. menjelang rilis untuk fresh install) dan tetap lewat mekanisme drizzle yang benar.
- Lokasi output migrasi tetap `drizzle/` (sesuai skill `spen-db`); sebutan `db/migrations` di panduan development tidak dipakai — panduan diamandemen (lihat backlog `guide-adoption`, tiket amandemen panduan).
