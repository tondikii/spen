# Spen performance baseline

Tiket #35 menetapkan dataset dan cara ukur yang repeatable sebelum optimasi. Baseline ini tidak mengubah database produksi, schema, atau behavior aplikasi.

## Dataset

Benchmark membuat database SQLite in-memory dengan 10 Wallet, 50 Category, 20 Goal, dan 10.000 Transaksi. Seluruh migration SQL yang ada dijalankan sebelum data dibuat.

Jalankan:

```text
npm run benchmark:database
```

Output JSON berisi jumlah row, timing `minMs` dan `avgMs` untuk read utama, serta output `EXPLAIN QUERY PLAN`. Hasil benchmark harus disalin ke tiket optimasi terkait bersama versi Node, device profile, dan tanggal pengukuran.

## Host baseline yang direkam

Perintah dijalankan pada 2026-09-04 di Windows development host, Node v24.13.1. Ini adalah baseline query harness, bukan pengganti pengukuran native Android.

Contoh hasil query baseline pada dataset tersebut: `walletOverview` min 5,26 ms / rata-rata 6,18 ms; `transactions` min 15,74 ms / rata-rata 18,84 ms; `goals` min 0,03 ms / rata-rata 0,03 ms; `transactionById` min 0,01 ms / rata-rata 0,01 ms. Timing diulang lima kali dan dapat berubah karena beban host; output JSON dari setiap run adalah sumber kebenaran untuk pengukuran aktual.

Plan penting yang terekam: `walletOverview` melakukan scan tabel transaksi pada LEFT JOIN; `transactions` menggunakan `transactions_date_idx` namun memakai temporary B-tree untuk sebagian ordering; `goals` melakukan scan tabel kecil; `transactionById` menggunakan primary key. Optimasi hanya boleh dilakukan setelah pengukuran ulang di device target dan tetap mempertahankan invariant domain.

Setelah migration index `transactions_to_wallet_idx` pada #43, plan `walletOverview` berubah menjadi `MULTI-INDEX OR` dan contoh host timing turun dari rata-rata 6,18 ms menjadi 3,31 ms. Read lain tidak ditargetkan karena belum menunjukkan bottleneck yang layak dioptimasi.

## Android profile yang tersedia

Emulator `Pixel_4`, Android 13, berhasil digunakan dengan Expo Go pada pengukuran 2026-09-04. Pengukuran `adb shell monkey -p host.exp.exponent 1` setelah force-stop, lima kali, menghasilkan 1.298,57 ms; 492,63 ms; 517,97 ms; 302,07 ms; dan 275,46 ms (rata-rata 577,34 ms). Ini adalah launch dispatch Expo Go, bukan waktu sampai screen Spen selesai render; pengukuran screen-ready perlu dilakukan pada development build/standalone build ketika tersedia.

## Native Android startup baseline

Pengukuran startup harus dilakukan pada emulator/device Android yang terhubung, dengan development server dan build yang sama:

```text
adb devices
npx expo run:android
```

Catat profil device/emulator, versi Android, cold start dari launch sampai screen awal terlihat, dan minimal lima pengulangan. Saat belum ada device/emulator terhubung, angka startup tidak boleh dianggap tersedia atau diisi dengan estimasi.
