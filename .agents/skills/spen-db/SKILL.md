---
name: spen-db
description: "Pola database Spen: expo-sqlite ~57.0.2 + Drizzle ORM (drizzle-orm@rc / drizzle-kit@rc), schema di db/schema.ts, migrasi di-generate lalu di-bundle dan dijalankan saat startup via useMigrations, transaksi eksklusif untuk menulis yang butuh isolasi. Gunakan saat membuat/mengubah schema, migrasi, query, atau integration test yang menyentuh DB lokal."
---

# Spen DB

Pola database lokal Spen. Konteks domain: `CONTEXT.md` (glossary + `_Avoid_`). Keputusan arsitektur: `docs/adr/0001-expo-sqlite-drizzle.md` dan `docs/adr/0004-plan-wallet-invariant.md`. Versi package: cek `package.json` — patokan versi: `expo-sqlite ~57.0.2`, `drizzle-orm@rc` / `drizzle-kit@rc` (line v1.0 RC, atau stable 0.45.x yang kompatibel).

## Setup yang sudah/seharusnya ada

- `drizzle.config.ts`: `dialect: 'sqlite'`, `driver: 'expo'`, `schema: './db/schema.ts'`, `out: './drizzle'`.
- `metro.config.js`: push `'sql'` ke `config.resolver.sourceExts` (agar file migrasi `.sql` ke-bundle).
- `babel.config.js`: plugin `["inline-import", { "extensions": [".sql"] }]` — **wajib**, tanpa ini migrasi gagal saat runtime.
- `SQLiteProvider databaseName="spen.db" onInit={migrateDbIfNeeded}` di root app, lalu `useMigrations(db, migrations)` dari `drizzle-orm/expo-sqlite/migrator` dengan `import migrations from './drizzle/migrations'`.
- `PRAGMA journal_mode = WAL` dan `PRAGMA foreign_keys = ON` saat inisialisasi DB.

Jika salah satu di atas belum ada, buat dulu sebelum menulis query baru.

## Aturan

- **Async API**: pakai `openDatabaseAsync` / `withExclusiveTransactionAsync` — jangan blokir JS thread dengan sync API di jalur UI. Sync API hanya untuk test yang butuh setup cepat.
- **Transaksi**: untuk menulis yang butuh isolasi (multi-row, invariant saldo, edit = undo+redo), **wajib** `withExclusiveTransactionAsync` — `withTransactionAsync` tidak eksklusif dan query async lain bisa ikut masuk transaksi (bug laten). Di dalamnya, jalankan query lewat objek `txn`, bukan `db`.
- **Semua angka uang**: simpan sebagai integer (rupiah tanpa desimal). Jangan pakai float.
- **Query yang memakai input user**: pakai prepared statement / parameter binding (`db.runAsync('... ?', [val])` atau `db.getAllAsync('... $x', { $x: val })`). Jangan pernah interpolasi string ke SQL.
- **Invariant (ADR-0004)**: angka realita (saldo wallet, realisasi pendapatan, progress expense, saldo tersedia, spare) **selalu diturunkan dari tabel transaksi** saat query, jangan disimpan sebagai kolom tersendiri. Koreksi saldo = transaksi penyesuaian (ADR-0005), bukan edit langsung.
- **Domain vocabulary**: gunakan istilah `CONTEXT.md` (Wallet, Budget plan, Transfer, Fixed expense, Goal, dsb.) sebagai nama tabel/kolom/type; hindari sinonim di `_Avoid_` (account, budget item, dll.).
- **Jangan menyimpan angka target sebagai realita**: target (nominal pendapatan, nominal fixed expense, kontribusi goal) ditulis manual; realisasi dihitung dari transaksi.

## Migrasi

1. Ubah `db/schema.ts` (satu sumber kebenaran schema).
2. `npx drizzle-kit generate` → menghasilkan file `.sql` baru di `drizzle/`.
3. **Review SQL hasil generate** — pastikan sesuai intent (nama tabel/kolom, index, constraint), jangan auto-apply tanpa lihat.
4. Migrasi dijalankan otomatis saat startup via `useMigrations`; jangan jalankan manual di production.
5. Setiap ticket yang menyentuh schema menyertakan migrasi yang sesuai. Jangan edit migrasi lama; generate yang baru.

## Testing DB

- Integration test service layer memakai **DB in-memory / temp**: buka DB via `SQLite.openDatabaseAsync` dengan `directory` menunjuk temp dir (mis. `$TMPDIR`/scratchpad), jalankan migrasi, lalu test. Jangan test terhadap DB production `spen.db`.
- Test diarahkan lewat **seam service layer** (`db/` + `services/`), bukan query internal. Lihat `spen-rn-testing` untuk setup runner.

## Referensi

- Expo docs SQLite (SDK 57): https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/
- Drizzle Expo guide: https://orm.drizzle.team/docs/get-started/expo-new
- ADR-0001, ADR-0004, ADR-0005: `docs/adr/`
