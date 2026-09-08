Untuk stack kamu, aku merekomendasikan struktur berbasis fitur (feature-first) dengan src/app khusus routing, serta database dan komponen bersama di luar folder route.

Expo mendukung src/app secara langsung. Pemisahan komponen, logika, dan pengujian dari folder route juga sejalan dengan panduan resminya. Sementara itu, pengelompokan berdasarkan fitur adalah pilihan arsitektur yang aku sarankan untuk project kamu—bukan aturan wajib Expo. Dokumentasi struktur Expo

Di bawah ini, transactions, wallets, dan reports hanya contoh nama fitur jika Spen merupakan aplikasi keuangan.

Struktur yang direkomendasikan

```text
spen/
  assets/
    images/
    icons/

  db/
    migrations/                   # Output migration dari Drizzle Kit

  scripts/
    database-baseline.cjs

  src/
    app/                          # Route dan layout Expo Router
      _layout.tsx
      +not-found.tsx
      (tabs)/
        _layout.tsx
        index.tsx
        wallets.tsx
        reports.tsx
        settings.tsx
      transactions/
        new.tsx
        [id].tsx

    features/
      transactions/
        components/
          transaction-card.tsx
          transaction-form.tsx
        screens/
          transactions-screen.tsx
          transaction-detail-screen.tsx
          create-transaction-screen.tsx
        hooks/
          use-transactions.ts
        data/
          transaction-repository.ts
          transaction-repository.test.ts
        utils/
          calculate-total.ts
          calculate-total.test.ts
        types.ts

      wallets/
        components/
        screens/
        hooks/
        data/

      reports/
        components/
        screens/
        hooks/
        data/

      settings/
        components/
        screens/

    components/                   # UI bersama lintas fitur
      ui/
        button.tsx
        text.tsx
        icon.tsx
      layout/
        screen.tsx
      feedback/
        empty-state.tsx
        error-state.tsx

    db/                           # Kode database yang ditulis manual
      client.ts
      database-provider.tsx
      schema/
        index.ts
        transactions.ts
        wallets.ts

    providers/
      app-providers.tsx

    lib/                          # Integrasi library/API platform
      file-system.ts
      sharing.ts

    hooks/                        # Hook bersama lintas fitur
      use-app-state.ts

    theme/
      colors.ts
      typography.ts
      spacing.ts
      index.ts

    i18n/
      index.ts
      locales/
        id.json
        en.json

    utils/                        # Fungsi murni lintas fitur
      format-currency.ts
      format-date.ts

    types/                        # Tipe bersama/deklarasi global
      assets.d.ts

    test/
      setup.ts
      render.tsx

  app.config.ts
  babel.config.js
  metro.config.js
  drizzle.config.ts
  eslint.config.js
  jest.config.js
  tsconfig.json
  package.json
```

1. Buat file route tetap tipis

src/app bertanggung jawab atas route, parameter navigasi, dan layout. Implementasi layar berada di fitur:

// src/app/transactions/new.tsx
export { CreateTransactionScreen as default } from
  '@/features/transactions/screens/create-transaction-screen';
// src/features/transactions/screens/create-transaction-screen.tsx
import { TransactionForm } from '../components/transaction-form';

export function CreateTransactionScreen() {
  return <TransactionForm />;
}

Untuk route dinamis, kamu bisa membaca dan memvalidasi parameter di file route, kemudian meneruskannya ke screen.

Jangan menaruh komponen biasa, utility, atau test di src/app, karena folder tersebut digunakan Expo Router untuk menentukan route. _layout.tsx digunakan untuk mengatur layout/navigator. Konsep Expo Router

2. Simpan kode sedekat mungkin dengan fitur pemiliknya

Gunakan aturan berikut:

Kode	Lokasi
Form transaksi	features/transactions/components/
Query dan operasi penyimpanan transaksi	features/transactions/data/
Hook transaksi	features/transactions/hooks/
Grafik khusus laporan	features/reports/components/
Tombol yang dipakai banyak fitur	components/ui/
Format mata uang lintas fitur	utils/
Konfigurasi warna dan font	theme/
Integrasi file system dan sharing	lib/

Mulai dari lokasi fitur, lalu pindahkan ke folder bersama ketika memang dibutuhkan lintas fitur. Jangan langsung membuat semua komponen menjadi komponen global.

Folder seperti services/, helpers/, atau common/ sering terlalu luas; pilih nama yang menjelaskan tanggung jawabnya.

3. Pisahkan database inti dari operasi setiap fitur

Untuk Drizzle + Expo SQLite, aku menyarankan pembagian ini:

Lokasi	Tanggung jawab
src/db/client.ts	Membuat koneksi SQLite dan instance Drizzle
src/db/schema/	Definisi tabel, relasi, dan tipe turunan schema
src/db/database-provider.tsx	Inisialisasi database serta status migrasi/error
src/features/*/data/	Query dan operasi database milik fitur
db/migrations/	File migrasi hasil generator

Dengan demikian, screen tidak berisi SQL atau query Drizzle langsung. Hook dapat menghubungkan data dengan React, sedangkan repository berisi operasi seperti listTransactions() dan createTransaction().

Untuk Expo, migrasi SQL perlu dibundel ke aplikasi dan dijalankan saat runtime. Tunggu migrasi selesai sebelum merender layar yang memakai database. Package babel-plugin-inline-import yang kamu punya relevan untuk alur ini. Drizzle dengan Expo SQLite

Lokasi di atas merupakan konvensi: arahkan konfigurasi schema ke src/db/schema dan output migrasi ke db/migrations.

4. Jaga arah dependensi tetap jelas

Aturan praktisnya:

app boleh mengimpor fitur dan provider.
Fitur boleh mengimpor komponen bersama, utility, dan database.
Komponen bersama tidak mengimpor fitur.
Database inti tidak mengimpor screen atau komponen fitur.
Hindari satu fitur mengambil komponen internal fitur lain.

Jika dua fitur memerlukan logika yang sama, tentukan pemiliknya atau ekstrak bagian yang benar-benar bersama. Tidak perlu langsung menambahkan layer domain, application, infrastructure, dan dependency injection.

5. Terapkan konvensi sederhana

Nama file: transaction-card.tsx, use-transactions.ts.
Nama komponen: TransactionCard, TransactionsScreen.
Export: named export untuk kode biasa; default export untuk route.
Style: letakkan bersama komponen; pisahkan jika file sudah sulit dibaca.
Test: dekat dengan kode yang diuji; src/test hanya untuk setup dan helper bersama.
Tipe: dekat dengan pemiliknya. Untuk model database, gunakan inferensi Drizzle agar tidak menduplikasi schema.
File platform: gunakan misalnya icon.ios.tsx dan icon.android.tsx ketika implementasi memang berbeda, termasuk untuk UI native.
State: mulai dari state lokal; provider untuk kebutuhan lintas aplikasi. Belum perlu membuat folder store tanpa kebutuhan konkret.

Tidak semua fitur harus langsung memiliki components, hooks, data, dan utils. Buat folder saat ada isinya.

Penyesuaian untuk project kamu

Gunakan alias berikut di tsconfig.json, dengan tetap mempertahankan opsi project yang sudah ada:

{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

Konfigurasi Expo, Metro, Babel, dan TypeScript tetap di root. Pertahankan "main": "expo-router/entry" dan gunakan satu lokasi routing, yaitu src/app. Panduan direktori src

Script formatter kamu sudah mencakup src dan db. Jika tipe dipindahkan dari root types/ ke src/types/, hapus argumen types dari script formatter ketika folder lamanya sudah tidak ada.

Prioritas penerapannya: rapikan src/app, pindahkan implementasi layar ke fitur, pisahkan akses database, kemudian ekstrak komponen bersama. Struktur ini cukup ringan untuk dikelola sendiri dan tetap jelas ketika fitur Spen bertambah.