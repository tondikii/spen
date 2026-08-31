# ADR-0001: Local database with expo-sqlite and Drizzle ORM

Kita menyimpan semua data lokal di perangkat. Keputusan: `expo-sqlite` (versi SDK 57, ~57.0.2) sebagai engine, dengan Drizzle ORM (`drizzle-orm/expo-sqlite`) sebagai lapisan schema/query, dan migrasi yang di-generate `drizzle-kit`, di-bundle ke dalam app, lalu dijalankan saat startup.

Alternatif yang dipertimbangkan: penyimpanan `kv-store`/AsyncStorage (tidak cukup untuk relasi wallet, transaksi, kategori, dan agregasi report), serta `op-sqlite` (tidak direkomendasikan oleh docs SDK 57; Drizzle tidak mengintegrasikannya secara resmi untuk Expo). Docs SDK 57 mendokumentasikan Drizzle dan Knex sebagai dua integrasi third-party yang didukung.

Catatan operasional: `withTransactionAsync` tidak eksklusif — gunakan `withExclusiveTransactionAsync` untuk isolasi; async API direkomendasikan agar tidak memblokir JS thread; pertahankan `expo` ≥ 57.0.17 untuk perbaikan regresi memori Hermes di SDK 57.
