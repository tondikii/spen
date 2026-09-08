# Panduan Development Expo React Native — Spen

Panduan ini merangkum standar struktur project, arsitektur, penulisan TSX, database, testing, dan workflow rilis untuk project Expo Router + TypeScript + Drizzle ORM + Expo SQLite.

Audit dokumentasi: 8 September 2026. Acuan stack adalah package.json yang diberikan pengguna; panduan ini bukan hasil pengujian kompatibilitas seluruh versi package tersebut.

**Cara menggunakan panduan:** aturan integritas data dan Rules of React harus dipatuhi. Struktur folder, urutan deklarasi, nama `.types.ts`, serta batas baris adalah konvensi project. Auth, sinkronisasi server, background task, dan OTA hanya diterapkan jika fiturnya dibutuhkan. Tidak semua best practice harus menjadi dependency atau layer baru.

Struktur lengkap awal dipertahankan. Nama fitur keuangan adalah contoh domain Spen; file `.types.ts` pada struktur bersifat opsional berdasarkan kebutuhan reuse. Contoh kode yang menggunakan komponen/hook project adalah ilustrasi kontrak, bukan scaffold siap jalan.

## 1. Prinsip dasar

- Utamakan kode yang mudah dipahami dari atas ke bawah dan punya satu tanggung jawab jelas.
- Gunakan `src/app` hanya untuk routing Expo Router; simpan implementasi fitur di luar folder route.
- Letakkan kode sedekat mungkin dengan fitur pemiliknya. Pindahkan ke folder bersama hanya bila dipakai lintas fitur.
- Hindari menambah layer atau dependency sebelum ada kebutuhan konkret.
- Satu sumber kebenaran untuk setiap data: SQLite untuk data persisten, state lokal untuk interaksi sementara, context untuk state aplikasi yang benar-benar lintas layar.

## 2. Struktur project

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
          transaction-form.types.ts
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

Route harus tipis. Contoh:

```tsx
// src/app/transactions/new.tsx
export { CreateTransactionScreen as default } from
  '@/features/transactions/screens/create-transaction-screen';
```

Jangan membuat semua subfolder fitur sejak awal. Buat `components`, `hooks`, `data`, atau `utils` ketika memang ada isinya. Begitu pula, pindahkan kode dari fitur ke folder bersama hanya bila benar-benar dipakai lintas fitur.

| Kebutuhan | Lokasi |
| --- | --- |
| Form dan card transaksi | `features/transactions/components/` |
| Operasi baca/tulis transaksi | `features/transactions/data/` |
| Hook transaksi | `features/transactions/hooks/` |
| Grafik khusus laporan | `features/reports/components/` |
| Tombol yang dipakai lintas fitur | `components/ui/` |
| Formatter uang dan tanggal | `utils/` |
| Warna, font, spacing | `theme/` |
| File system dan sharing | `lib/` |

Aturan dependensi:

- `app` boleh mengimpor fitur dan provider.
- Fitur boleh mengimpor komponen bersama, utilitas, dan database.
- Komponen bersama tidak boleh mengimpor fitur.
- Database inti tidak boleh mengimpor UI atau screen.
- Hindari satu fitur mengimpor detail internal fitur lain.

Konfigurasi Expo, Babel, Metro, dan TypeScript tetap di root. Pertahankan `main: "expo-router/entry"`, gunakan hanya satu folder routing yaitu `src/app`, dan jangan meletakkan test/helper di dalamnya. Arahkan schema Drizzle ke `src/db/schema` dan output migrasi ke `db/migrations`. Jika root `types/` dipindah ke `src/types/`, sesuaikan script formatter agar tidak menunjuk folder yang sudah tidak ada.

Gunakan alias berikut:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 3. Batas tanggung jawab

| Bagian | Tanggung jawab | Jangan lakukan |
| --- | --- | --- |
| Route | Parameter navigasi, layout, menghubungkan screen | Query database dan aturan bisnis |
| Screen | Menyusun UI serta menghubungkan hook dengan komponen | SQL langsung |
| Component | Menampilkan UI dan menerima props/callback | Akses database pada UI reusable |
| Hook | Lifecycle React dan stateful logic | Menampung semua logic screen tanpa batas |
| Repository | Query dan mutation database | Toast, navigasi, state React |
| Fungsi bisnis | Validasi dan perhitungan domain | Bergantung pada React |
| `lib` | Adapter FileSystem, sharing, atau API platform | Aturan bisnis fitur |

Untuk CRUD sederhana, alur `screen → hook → repository` cukup. Buat use case/fungsi bisnis terpisah bila satu operasi melibatkan banyak langkah dan aturan, misalnya transfer antardompet.

## 4. TypeScript dan data eksternal

Aktifkan baseline berikut:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- Hindari `any`; gunakan `unknown` untuk input yang belum tepercaya.
- Validasi data pada batas aplikasi: route params, JSON impor, respons API, dan data lama dari storage.
- Jangan memakai type assertion sebagai pengganti validasi.
- Gunakan `import type` untuk import tipe.
- Tipe dekat dengan pemiliknya; schema database menjadi sumber tipe model DB.
- Gunakan tipe input khusus untuk operasi mutation.

### Lokasi dan nama file type

Memisahkan type ke file `.types.ts` membantu ketika tipe dipakai oleh lebih dari satu file atau membuat file implementasi sulit dipindai. Namun, jangan membuat file type hanya untuk satu interface props kecil yang digunakan sekali.

| Kondisi | Lokasi yang disarankan |
| --- | --- |
| Props yang hanya dipakai satu component kecil | Tetap di file `.tsx` component |
| Props, model view, atau union yang dipakai oleh beberapa component dalam satu fitur | `<nama-fitur>.types.ts` di folder fitur/component terkait |
| Tipe yang benar-benar dipakai lintas fitur | `src/types/` dengan nama yang spesifik |
| Input/output operasi database milik fitur | `features/<fitur>/data/<fitur>.types.ts` atau `features/<fitur>/types.ts` |
| Model tabel | Infer dari Drizzle schema di `src/db/schema/`, jangan menduplikasi |
| Deklarasi global seperti asset module | `src/types/*.d.ts` |

Contoh struktur yang cocok:

```text
src/features/transactions/
  components/
    transaction-form.tsx
    transaction-form.types.ts
  data/
    transaction-repository.ts
    transaction.types.ts
  types.ts                       # Type yang dipakai lintas bagian fitur
```

Gunakan `types.ts` ketika file memuat tipe yang bersifat umum untuk satu fitur. Gunakan `<nama>.types.ts` ketika tipe melekat pada satu module tertentu dan nama tersebut mencegah ambiguitas. Keduanya valid; yang terpenting adalah konsisten dalam satu project.

Jangan menjadikan `src/types/` tempat penampungan semua type. Folder ini hanya untuk tipe lintas fitur yang benar-benar stabil dan tidak memiliki pemilik fitur jelas.

```ts
type CreateTransactionInput = {
  walletId: string;
  amountRupiah: number;
  note?: string;
};

export function validateAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('INVALID_AMOUNT');
  }
}
```

## 5. Konvensi penamaan

| Elemen | Konvensi |
| --- | --- |
| File dan folder | `kebab-case` |
| Component dan type | `PascalCase` |
| Fungsi dan variabel | `camelCase` |
| Hook | `useTransactions` |
| Boolean | `isSaving`, `hasTransactions`, `canSubmit` |
| Callback prop | `onSubmit`, `onDelete` |
| Handler internal | `handleSubmit`, `handleDelete` |
| Konstanta tetap | `MAX_NOTE_LENGTH` |
| Nilai dengan satuan | `amountRupiah`, `timeoutMs` |

Gunakan named export untuk code biasa dan default export untuk file route Expo Router. Pilih nama yang menjelaskan tindakan, seperti `findWalletById`, bukan `getData`.

## 6. Guide penulisan file TSX

### Urutan isi file

Gunakan urutan ini sebagai default:

1. Imports.
2. Types dan props.
3. Konstanta statis.
4. Helper murni yang hanya digunakan file tersebut.
5. Component utama.
6. Component pendukung kecil, bila diperlukan.
7. Styles.

Di dalam component utama, urutkan berdasarkan ketergantungan:

1. Destructure props.
2. Context, router, dan translation hooks.
3. Local state dan ref.
4. Custom/data hooks yang membutuhkan state atau props sebelumnya.
5. Derived values.
6. Event handlers.
7. Effects bila diperlukan.
8. Early return untuk loading/error/empty state.
9. JSX utama.

Contoh urutan dengan state sebagai input hook query (komponen dan hook berikut berasal dari fitur project):

```tsx
export function TransactionsScreen() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const query = useTransactions({ searchText });

  const hasTransactions = query.items.length > 0;

  function handleSearchChange(value: string) {
    setSearchText(value);
  }

  if (query.isLoading) return <LoadingState />;
  if (query.error) return <ErrorState message={t('common.loadFailed')} />;

  return (
    <View>
      <TextInput
        accessibilityLabel={t('transactions.search')}
        value={searchText}
        onChangeText={handleSearchChange}
      />
      {hasTransactions ? (
        <TransactionList transactions={query.items} />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}
```

Kontrak contoh: `useTransactions` selalu menyediakan `items` sebagai array dan membedakan loading/error; bentuk hasil adalah keputusan project. Untuk pencarian saat mengetik, debounce input query jika pengukuran menunjukkan kebutuhan. Jangan memakai contoh ini sebagai kontrak API Drizzle.


Urutan kategori ini bukan aturan yang mengalahkan dependency. Jika hook membutuhkan state, deklarasikan state lebih dahulu.

### Declaration scope

| Deklarasi | Lokasi |
| --- | --- |
| Konstanta yang tidak berubah antar-render | Module scope |
| Helper murni yang hanya memakai argumen | Module scope |
| State dan ref per instance | Dalam component |
| Nilai turunan props/state | Dalam component |
| Handler yang memakai props/state | Dalam component |
| Helper untuk satu effect | Di dalam effect |
| Helper untuk satu handler | Di dalam handler |
| Static styles | Module scope |
| Style yang tergantung props/tema | Dalam component |

Jangan menyimpan state reaktif di module scope.

```tsx
const MAX_NOTE_LENGTH = 200;

function normalizeNote(value: string): string {
  return value.trim();
}

export function NoteField() {
  const [note, setNote] = useState('');
  const remainingCharacters = MAX_NOTE_LENGTH - note.length;

  // ...
}
```

### State, derived values, dan effect

Simpan hanya nilai yang berubah secara independen. Hitung nilai turunan saat render.

```tsx
const [amountText, setAmountText] = useState('');
const amountRupiah = Number(amountText);
const isAmountValid =
  amountText.trim() !== '' &&
  Number.isSafeInteger(amountRupiah) &&
  amountRupiah > 0;
```

Jangan gunakan `useEffect` untuk memperbarui `isAmountValid`, total, hasil filter, atau `canSubmit`. Gunakan `useMemo` hanya ketika kalkulasi benar-benar mahal atau stabilitas referensi dibutuhkan.

Effect hanya untuk sinkronisasi dengan sistem eksternal: listener AppState, timer, subscription, atau resource native. Satu effect menangani satu proses dan membersihkan resource yang dibuatnya.

```tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => subscription.remove();
}, [handleAppStateChange]);
```

Aksi pengguna seperti submit, delete, atau share berjalan di event handler, bukan effect.

### Custom hook dan pemisahan logic/view

Jangan mewajibkan semua component memiliki hook pasangan. Mulai dari satu file bila component sederhana. Ekstrak hook jika logic stateful dipakai ulang atau punya tanggung jawab yang jelas dan cukup kompleks.

```tsx
export function CreateTransactionScreen() {
  const form = useTransactionForm();

  return (
    <TransactionForm
      amountText={form.amountText}
      error={form.error}
      isSubmitting={form.isSubmitting}
      onAmountChange={form.changeAmount}
      onSubmit={form.submit}
    />
  );
}
```

- Hook mengembalikan data dan aksi, bukan JSX.
- Hook berbagi logic stateful, bukan state yang sama antarpemanggilan.
- Fungsi tanpa hook bukan custom hook; beri nama biasa seperti `getSorted`.
- Hindari hook generik seperti `useScreenLogic` yang menjadi tempat semua kebutuhan screen.

### Event dan JSX

- Gunakan `on...` untuk callback prop dan `handle...` untuk handler internal.
- Callback satu ekspresi boleh inline.
- Ekstrak handler bila memuat validasi, beberapa langkah, operasi async, atau percabangan.
- Jangan memasukkan proses panjang langsung ke JSX.
- Panggil hook biasa seperti `useState`, `useEffect`, dan custom hook di top level sebelum early return. API React `use` memiliki pengecualian untuk kondisi/loop; jangan menggeneralisasikan pengecualian itu ke hook lain. [React use](https://react.dev/reference/react/use)
- Jika hook lanjut membutuhkan data non-null, pecah component menjadi parent pemuat data dan child yang menerima data valid.
- Jangan mendefinisikan component di dalam component lain.
- Hindari ternary bertingkat.
- Gunakan kondisi eksplisit: `items.length > 0 && <List />`, bukan `items.length && <List />`.
- Gunakan ID stabil untuk `key` list.

### Contoh component

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type NoteEditorProps = {
  initialNote?: string;
  isSaving: boolean;
  errorMessage?: string;
  onSave: (note: string) => void;
};

const MAX_NOTE_LENGTH = 200;

function normalizeNote(value: string): string {
  return value.trim();
}

export function NoteEditor({
  initialNote = '',
  isSaving,
  errorMessage,
  onSave,
}: NoteEditorProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote);

  const normalizedNote = normalizeNote(note);
  const hasChanges = normalizedNote !== normalizeNote(initialNote);
  const canSave = hasChanges && !isSaving;

  function handleSave() {
    if (!canSave) return;
    onSave(normalizedNote);
  }

  return (
    <View style={styles.container}>
      <Text>{t('transactions.noteLabel')}</Text>
      <TextInput
        accessibilityLabel={t('transactions.noteLabel')}
        editable={!isSaving}
        maxLength={MAX_NOTE_LENGTH}
        multiline
        onChangeText={setNote}
        style={styles.input}
        value={note}
      />
      {errorMessage ? <Text accessibilityRole="alert">{errorMessage}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave, busy: isSaving }}
        disabled={!canSave}
        onPress={handleSave}
        style={[styles.button, !canSave && styles.buttonDisabled]}
      >
        <Text>{isSaving ? t('common.saving') : t('common.save')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: {
    minHeight: 96,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  button: { alignItems: 'center', padding: 12 },
  buttonDisabled: { opacity: 0.5 },
});
```

`onSave` pada contoh adalah callback sinkron untuk meneruskan aksi. Parent harus menangani promise, error, dan status mutation; jangan mengandalkan tipe `void` untuk menjamin callback tidak async. Error message sudah diterjemahkan oleh pemilik UI. Nilai styles literal pada contoh dapat diganti token tema.

`initialNote` hanya menjadi nilai awal saat mount. Bila editor berpindah ke entity berbeda dan draft harus direset, gunakan `key` pada component berdasarkan identitas entity; jangan otomatis menyalin prop ke state melalui effect.

## 7. Ukuran file

Hitung baris kode tanpa baris kosong dan komentar. Gunakan angka sebagai sinyal review, bukan pemicu otomatis pemecahan file.

| Jenis file | Target nyaman | Mulai evaluasi |
| --- | ---: | ---: |
| Route Expo Router | 5–50 | >100 |
| `_layout.tsx` | 30–120 | >200 |
| Component UI sederhana | 30–120 | >150 |
| Component kompleks/form | 100–250 | >300 |
| Screen | 100–250 | >300 |
| Custom hook | 30–150 | >200 |
| Repository/database query | 50–200 | >300 |
| Fungsi bisnis | 30–150 | >200 |
| Utility per topik | 20–100 | >150 |
| Styles | 50–200 | >300 |
| Test | 100–300 | >400 |

Untuk project ini: gunakan **300 baris sebagai warning** dan **lebih dari 400 baris harus ditinjau**. Pecah file jika ada beberapa tanggung jawab, JSX sulit dibaca karena detail proses, logic mulai berulang, atau pengujian membutuhkan mock berlebihan.

Urutan ekstraksi yang disarankan:

1. Pindahkan perhitungan dan validasi murni ke `.ts`.
2. Pindahkan akses database ke repository.
3. Ekstrak bagian UI dengan tanggung jawab jelas.
4. Ekstrak stateful logic kompleks ke custom hook.
5. Pisahkan styles bila mengganggu navigasi file.

Contoh rule ESLint:

```js
"max-lines": [
  'warn',
  { max: 300, skipBlankLines: true, skipComments: true },
],
```

Letakkan potongan ini di dalam objek `rules` pada konfigurasi ESLint project. Kecualikan file generated, migrasi generated, dan data deklaratif besar; gunakan batas berbeda untuk test. Batas baris bukan hard limit dan tidak berlaku pada panjang dokumen ini.

## 8. State, async, dan error

| Jenis state | Pilihan awal |
| --- | --- |
| Modal, input, pilihan sementara | `useState` |
| Form dengan banyak transisi terkait | `useReducer` |
| Tema dan bahasa | Provider/context |
| Data transaksi persisten | SQLite |
| Data query | Hook fitur dengan mekanisme refresh jelas |
| Data server | Evaluasi server-state library bila kebutuhan nyata muncul |

Aturan async:

- UI memiliki status loading, success, dan error yang relevan.
- Repository tidak boleh menampilkan toast atau melakukan navigasi.
- Jangan mengubah kegagalan query menjadi array kosong.
- Jangan memakai `catch {}` kosong.
- Selesaikan loading state dengan `finally`.
- Lindungi mutation dari submit ganda.
- Gunakan idempotensi/constraint untuk operasi kritis, tidak hanya menonaktifkan tombol.
- Jangan retry semua error secara otomatis.

Gunakan result terstruktur untuk kegagalan bisnis yang memang diperkirakan:

```ts
type SaveTransactionResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: 'INVALID_AMOUNT' | 'WALLET_NOT_FOUND' };
```

## 9. Database dan uang

- Kelola koneksi dan inisialisasi database secara terpusat.
- Jalankan migrasi sebelum UI yang membutuhkan database dirender.
- Commit migration ke version control.
- Jangan mengubah migration yang sudah dirilis; buat migration baru.
- Gunakan query builder atau parameter binding untuk semua input pengguna.
- Tambahkan foreign key, unique constraint, dan constraint lain untuk invariant penting.
- Gunakan transaksi untuk operasi yang harus berhasil/gagal bersama.
- Aktifkan foreign key pada setiap koneksi yang digunakan dan evaluasi WAL untuk database native. Konfigurasi harus dilakukan pada tahap inisialisasi yang tepat, bukan di tengah transaksi.
- Buat index berdasarkan query nyata.
- Batasi atau paginasi daftar besar.

Pada API Expo SQLite, `withTransactionAsync` dapat mencakup query lain yang berjalan saat transaksi aktif. `withExclusiveTransactionAsync` memakai objek `txn` untuk query di dalamnya, tidak didukung di web, dan write yang berkompetisi dapat gagal dengan `database is locked`. Pilih API sesuai kebutuhan, batasi durasi transaksi, serta uji konkurensi. Jangan mencampur API transaksi Drizzle dan Expo tanpa memahami driver yang digunakan. [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

Migrasi SQL Expo harus dibundel ke aplikasi; selaraskan Drizzle Kit, output migrasi, Babel inline import SQL, serta konfigurasi Metro. Uji migrasi dari versi data lama dan beberapa versi yang terlewat. [Drizzle Expo SQLite](https://orm.drizzle.team/docs/sqlite/connect-expo-sqlite)

Khusus data keuangan:

- Simpan rupiah sebagai integer.
- Jangan memakai floating point untuk nilai uang.
- Bila mendukung multi-currency, simpan currency dan unit terkecil secara eksplisit.
- Tetapkan satu konvensi tanda nominal.
- Bedakan waktu kejadian dan tanggal kalender.
- Tentukan zona waktu yang digunakan laporan bulanan.

## 10. UI, aksesibilitas, i18n, dan performa

- Gunakan token tema untuk warna, spacing, radius, dan typography.
- `StyleSheet.create` adalah default yang baik; inline style untuk nilai dinamis tetap wajar.
- Semua teks UI menggunakan i18next.
- Gunakan interpolasi/pluralization, bukan merangkai potongan terjemahan.
- Format angka dan tanggal berdasarkan locale.
- Sediakan loading, empty, error, dan success state bila relevan.
- Beri `accessibilityLabel` pada tombol ikon.
- Jangan hanya mengandalkan warna untuk status.
- Uji pembesaran font, keyboard, safe area, dan layar kecil.
- Pusatkan perbedaan platform pada adapter seperti `AppIcon`.

Untuk performa:

- Gunakan `FlatList` atau `SectionList` untuk daftar panjang.
- Gunakan key stabil.
- Agregasikan total besar di SQL bila perlu, bukan dari seluruh list di UI.
- Batasi titik grafik untuk rentang data panjang.
- Hindari pekerjaan sinkron berat di JavaScript thread.
- Jangan memasang `memo`, `useMemo`, atau `useCallback` di seluruh codebase tanpa pengukuran.

## 11. Tooling, lint, dan testing

Prettier menangani format, ESLint menangani pola berisiko, dan TypeScript menangani tipe.

Rule/batas yang layak ditegakkan:

- Rules of Hooks.
- Exhaustive dependencies.
- `consistent-type-imports`.
- `no-floating-promises`.
- `no-misused-promises`.
- Restricted imports untuk menjaga batas fitur.
- Larangan disable lint tanpa alasan.

Rule promise berbasis TypeScript memerlukan konfigurasi ESLint yang membaca type information.

Jalankan di CI:

```bash
npm ci
npm run verify
```

Prioritas testing:

| Jenis test | Fokus |
| --- | --- |
| Unit | Perhitungan uang, validasi, parsing, batas tanggal |
| Component | Submit, validasi, loading, error, interaksi pengguna |
| Database integration | Constraint, rollback, dan migrasi database lama |
| Device/E2E | Alur penting, restart app, impor-ekspor |

Gunakan React Native Testing Library untuk perilaku yang terlihat pengguna. Mock SQLite tidak membuktikan transaksi dan migration nyata bekerja; uji alur tersebut dengan database nyata.

Tinjau kompatibilitas `jest` dan `@types/jest` karena package saat ini memiliki major version berbeda.

## 12. Dependency, environment, dan keamanan data

- Gunakan satu package manager dan commit lockfile.
- Gunakan `npx expo install` untuk dependency yang terkait Expo/native runtime.
- Jalankan `npx expo install --check` dan `npx expo-doctor` berkala.
- Tambah dependency hanya bila manfaatnya jelas dibanding biaya maintenance.
- Upgrade Expo SDK dan native dependency secara terencana.
- Tinjau Drizzle secara khusus karena versi yang dipakai masih RC.
- Jangan simpan rahasia di `EXPO_PUBLIC_*`; nilai ini masuk ke bundle aplikasi.
- Jangan menulis token atau isi transaksi pribadi ke log.

## 13. Workflow development dan rilis

### Platform dan native project

Tetapkan target nyata: Android, iOS, web, atau kombinasi yang memang didukung produk. Jangan memaksakan abstraksi lintas platform untuk platform yang belum didukung.

Untuk Expo managed/CNG, jadikan app config dan config plugin sebagai sumber kustomisasi native. Hindari edit manual file hasil `prebuild` karena dapat hilang saat `prebuild --clean`.

Gunakan development build untuk pengujian rutin native dependency dan konfigurasi aplikasi; Expo Go saja tidak cukup untuk verifikasi semua integrasi native.

### App variants

Gunakan ID aplikasi berbeda agar development, preview, dan production dapat terpasang bersamaan.

| Variant | Contoh nama | Contoh application ID |
| --- | --- | --- |
| Development | Spen Dev | `com.example.spen.dev` |
| Preview | Spen Preview | `com.example.spen.preview` |
| Production | Spen | `com.example.spen` |

### Penyelesaian fitur

Selesaikan fitur sebagai satu alur penuh:

> Input pengguna → validasi → penyimpanan → pembaruan UI → penanganan kegagalan.

Sebuah fitur dianggap selesai bila alur utama dan failure case relevan berjalan, data tetap benar setelah restart, state UI tersedia, `verify` lulus, dan perubahan schema/native telah diuji sesuai dampaknya.

### Seed data dan lifecycle

Sediakan data development deterministik untuk database kosong, data normal, ribuan transaksi, teks panjang, pergantian bulan/tahun, dan data sebelum migrasi.

Uji lifecycle berikut:

- Aplikasi dibuka dari kondisi mati.
- Masuk background lalu kembali.
- Proses aplikasi dihentikan.
- Submit disebabkan beberapa ketukan cepat.
- Back saat form berubah.
- Deep link dengan data tidak ditemukan.
- Permission ditolak atau picker dibatalkan.

### Backup dan restore

Jika SQLite menyimpan data utama pengguna, perlakukan backup/restore sebagai fitur inti:

- Format ekspor memiliki `formatVersion`.
- Validasi seluruh file sebelum mengubah database.
- Jelaskan apakah impor mengganti atau menggabungkan data.
- Tentukan penanganan ID duplikat.
- Terapkan perubahan atomik bila memungkinkan.
- Uji ekspor → impor → bandingkan hasil pemulihan.

### Logging dan update

Gunakan logger terpusat dengan event dan konteks teknis tanpa data sensitif.

```ts
logger.error('transaction_save_failed', {
  operation: 'createTransaction',
  errorCode,
  appVersion,
});
```

Tampilkan versi aplikasi di halaman bantuan. Bila memakai EAS Update, perubahan JavaScript harus kompatibel dengan native runtime. Rollback code tidak otomatis membatalkan migration SQLite; rencanakan kompatibilitas schema sebelum rilis.

## 14. Dokumentasi repository

| Dokumen | Isi |
| --- | --- |
| `README.md` | Setup, command, cara menjalankan aplikasi |
| `AGENTS.md` | Aturan operasional coding agent dan pemeriksaan wajib |
| `CONTRIBUTING.md` | Konvensi coding serta workflow perubahan |
| `docs/decisions/` | Keputusan teknis penting dan alasannya |

Catat keputusan yang berdampak panjang: satuan uang, zona waktu, aturan tanda nominal, pemilik state, strategi migrasi, platform target, serta workflow native.

## 15. Checklist sebelum merge atau rilis

- [ ] Scope perubahan sesuai tugas.
- [ ] Route tetap tipis dan logic berada pada pemilik yang tepat.
- [ ] Tidak ada state turunan atau effect yang tidak perlu.
- [ ] Input eksternal tervalidasi.
- [ ] Error tidak disembunyikan sebagai data kosong.
- [ ] Mutation penting aman dari duplikasi dan inkonsistensi.
- [ ] Data tetap benar setelah aplikasi dimulai ulang.
- [ ] Loading, empty, dan error state relevan tersedia.
- [ ] i18n dan aksesibilitas dasar diperiksa.
- [ ] `npm run verify` lulus.
- [ ] Database migration dan perubahan native diuji sesuai dampaknya.
- [ ] Tidak ada secret atau data pribadi pada source maupun log.


## 16. Import, kontrak tipe, dan batas module

- Gunakan alias `@/` untuk lintas folder utama dan relative import pendek dalam module yang sama.
- Hindari circular dependency dan file `index.ts` yang mengekspor seluruh isi project. Public export fitur boleh dibuat untuk API stabil; file internal tidak mengimpor balik melalui barrel-nya sendiri.
- `.ts` untuk module tanpa JSX; `.tsx` untuk JSX; `.d.ts` khusus deklarasi ambient/module, bukan wadah semua type reusable.
- `type` maupun `interface` valid. Pilih `type` untuk union dan komposisi; gunakan `interface` jika membutuhkan extension/declaration merging. Konsistensi lebih penting daripada memaksakan satu bentuk.
- Shared type tetap berada pada pemilik domainnya bila jelas. Reuse lintas fitur tidak otomatis berarti pindah ke `src/types`.
- Gunakan `import type` dan bedakan row database, input mutation, data impor/API, serta view model. Infer row Drizzle; buat input yang membatasi field yang boleh diubah.
- Gunakan discriminated union untuk status yang saling eksklusif. Hindari kombinasi boolean yang memungkinkan keadaan mustahil.
- Jangan mewajibkan repository interface, class, dependency injection container, atau use case terpisah untuk setiap CRUD. Gunakan fungsi dan module biasa sampai ada kebutuhan yang jelas.

## 17. React lifecycle, form, dan async yang aman

### Render dan pemilik state

Render harus murni. Jangan mutasi props, hasil hook, atau array state; misalnya salin array sebelum `sort`. Jangan menjalankan query write, logging per-event, atau navigasi saat render. Gunakan functional state update jika nilai baru bergantung pada nilai sebelumnya. Ref cocok untuk handle/resource yang tidak perlu memicu render, bukan pengganti state UI. [Rules of React](https://react.dev/reference/rules)

Letakkan state sedekat mungkin dengan pemakainya. Hindari provider berisi semua data aplikasi; pisahkan konteks menurut kebutuhan dan frekuensi perubahan. Jangan menyalin seluruh database ke global store. Pilih query reaktif atau invalidasi/refetch setelah mutation dan gunakan secara konsisten.

Strict Mode membantu menemukan effect yang tidak dibersihkan. Inisialisasi harus aman terhadap pemanggilan ulang; jangan menonaktifkan pemeriksaan React untuk menyembunyikan write ganda.

### Form dan proses simpan

- Pisahkan input teks dari nilai domain hasil parsing. Keyboard numerik tidak menjamin input valid.
- Parse format uang secara eksplisit. `Number` pada contoh sederhana bukan parser angka berformat locale: string seperti `1.000` dapat berarti nilai berbeda.
- Tentukan kapan validasi ditampilkan, bagaimana draft disimpan, serta perilaku back/cancel dan reset setelah sukses.
- Inisialisasi editor dari data yang sudah siap atau mount editor dengan key entity. Jangan menimpa draft ketika refetch selesai.
- Jangan menutup form/navigasi sebelum penyimpanan benar-benar berhasil.
- Tangani rejection pada batas UI. `void promise` hanya mengabaikan hasil, tidak menangkap error.

Pola mutation berikut adalah ilustrasi bagian dalam component. `repository`, `logger`, `input`, `t`, dan `onSaved` merupakan dependensi project; validasi input dilakukan sebelum mutation.

```tsx
const savingRef = useRef(false);
const [isSaving, setIsSaving] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);

async function save(): Promise<void> {
  if (savingRef.current) return;
  savingRef.current = true;
  setIsSaving(true);
  setErrorMessage(null);

  try {
    await repository.create(input);
  } catch (error: unknown) {
    logger.error('transaction_save_failed', error); // Redaksi data sensitif di logger.
    setErrorMessage(t('transactions.saveFailed'));
    return;
  } finally {
    savingRef.current = false;
    setIsSaving(false);
  }

  onSaved(); // Callback sinkron setelah commit berhasil.
}

function handleSubmit(): void {
  void save().catch((error: unknown) => {
    logger.error('transaction_completion_failed', error);
  });
}
```

Guard ref hanya melindungi satu instance UI. Gunakan invariant database dan ID operasi untuk perlindungan lintas screen/task. Perlakukan kegagalan setelah commit secara berbeda dari kegagalan penyimpanan agar retry tidak membuat duplikat.

### Race condition dan cancellation

- Untuk query async, batalkan request bila API mendukung atau abaikan hasil yang sudah tidak sesuai input terbaru.
- Status loading query lama tidak boleh menimpa query baru.
- Cancellation request tidak membuktikan server membatalkan write. Jika hasil mutation tidak pasti, rekonsiliasi menggunakan ID operasi sebelum mengulangi.
- Retry hanya error sementara, dengan batas percobaan dan backoff; validasi dan kegagalan autentikasi perlu penanganan lain.
- Error boundary membantu kegagalan render; error handler async tetap harus ditangani secara eksplisit. Sediakan fallback dan retry yang tidak menghapus data. [Error handling Expo Router](https://docs.expo.dev/router/error-handling/)

## 18. Navigasi dan startup aplikasi

### Navigasi

- Pertimbangkan typed routes untuk memeriksa path/parameter saat compile. Pastikan proses generate tipe tersedia juga di CI; jangan mengandalkan file generated dari mesin developer. Periksa status dan setup fitur untuk SDK yang dipakai. [Typed routes](https://docs.expo.dev/router/reference/typed-routes/)
- Kirim ID dan filter serializable lewat route, bukan object transaksi besar, function, atau token.
- Validasi route params saat runtime; typed routes tidak memvalidasi deep link dari luar.
- Buat perilaku loading, ID tidak valid, data dihapus, dan route tidak ditemukan.
- Screen dalam navigator dapat tetap mounted. Tentukan refresh saat focus/foreground sesuai kebutuhan; jangan memuat ulang semua query pada setiap render.
- Jika ada auth, route guard adalah pembatas UI. Backend tetap memverifikasi sesi dan otorisasi setiap resource.

### Bootstrap

Koordinasikan font, i18n, database, dan migrasi di provider/root layout. Tunggu dependensi yang wajib; pekerjaan opsional tidak boleh menahan aplikasi tanpa batas. Pisahkan status loading, ready, dan failed serta sediakan recovery yang bisa dibaca pengguna.

Jika memakai `preventAutoHideAsync`, ikuti penempatan awal yang disarankan Expo, lalu lepaskan splash ketika UI siap termasuk UI error. Jangan membiarkan kegagalan font atau migrasi menghasilkan splash tanpa akhir. Uji splash pada release build. [Expo SplashScreen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)

Untuk font Google yang tersedia di package, muat hanya keluarga/weight yang dipakai. Pastikan fallback tidak merusak layout dan teks besar tetap terbaca.

## 19. Data lokal, backup, dan sinkronisasi

### Konsistensi dan query

- Periksa `Number.isSafeInteger` pada input dan hasil penjumlahan uang; SQLite integer dapat melampaui rentang aman JavaScript number.
- Untuk transfer, simpan kedua sisi dan biaya dalam satu operasi atomik. Tentukan apakah saldo dihitung dari ledger atau disimpan sebagai nilai turunan yang diperbarui atomik.
- Gunakan urutan stabil untuk pagination, termasuk pembanding ID jika timestamp sama.
- Representasikan interval laporan sebagai awal inklusif dan akhir eksklusif; uji batas bulan serta zona waktu.
- Jangan menjalankan network request di dalam transaksi write.

### Restore dan file

Backup database yang sedang dipakai membutuhkan snapshot konsisten. Jangan mengasumsikan menyalin file utama `.db` saat WAL aktif sudah mencakup seluruh write. Gunakan mekanisme backup yang sesuai atau ekspor logis dengan konsistensi snapshot. [SQLite Backup API](https://sqlite.org/backup.html)

Batasi ukuran file/record impor, validasi format dan versi, serta sediakan kebijakan untuk file lebih baru daripada versi aplikasi. Jangan menghapus database lama sebelum backup/restore pengganti tervalidasi.

Saat DocumentPicker perlu dibaca segera oleh FileSystem, perhatikan `copyToCacheDirectory`. Perlakukan pembatalan pengguna sebagai hasil normal dan bersihkan file sementara ketika tidak diperlukan. [DocumentPicker](https://docs.expo.dev/versions/latest/sdk/document-picker/)

### Jika sinkronisasi server ditambahkan

Simpan mutation lokal dan outbox dalam transaksi yang sama. Gunakan ID stabil/idempotency key, status retry persisten, serta strategi konflik yang terdokumentasi. Tentukan aturan delete/tombstone dan kepemilikan data. Status jaringan hanyalah sinyal; keberhasilan operasi ditentukan respons request. Jangan menambahkan sistem sync untuk aplikasi yang belum memerlukannya.

## 20. Keamanan, permissions, dan pekerjaan background

### Keamanan sesuai data yang disimpan

Gunakan SecureStore untuk credential kecil bila auth ditambahkan; jangan menyimpan seluruh database di sana. Perilaku uninstall/restore dan data dengan autentikasi biometrik berbeda antarplatform, sehingga credential harus bisa dipulihkan melalui alur login yang benar. [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

SQLite biasa bukan enkripsi database. Jika produk memerlukan enkripsi at rest, tentukan manajemen kunci, pemulihan, dan backup sebelum memilih implementasi. Semua secret backend harus tetap di backend; environment variable client tidak membuatnya rahasia.

### Permissions

Minta izin saat pengguna memakai fitur terkait. Bedakan belum diminta, ditolak, dan tidak bisa diminta lagi. Jelaskan cara membuka pengaturan bila perlu. Periksa manifest/config plugin dan permission yang ikut ditambahkan dependency; uji pada build aplikasi sendiri. [Permissions Expo](https://docs.expo.dev/guides/permissions/)

### Background task dan notifikasi — kondisional

OS menentukan kapan background task dijalankan; jangan menjanjikan waktu tepat atau mengandalkan task untuk commit data penting. Definisi task harus tersedia di module scope sesuai API, dan handler harus bisa bekerja tanpa screen mounted. Uji perangkat nyata dan pemulihan setelah task terhenti. [BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/)

Jika fitur notifikasi ditambahkan, tetapkan ID deduplikasi, validasi payload, urus permission/channel sesuai platform, dan uji penekanan notifikasi dari cold start. Registrasi listener perlu cleanup; pemrosesan bisnis sebaiknya memanggil operasi yang sama dengan UI.

## 21. Pengalaman native dan optimasi terukur

- Periksa safe area, edge-to-edge, status/navigation bar, keyboard, dan modal; hindari menerapkan padding inset dua kali.
- Uji TalkBack/VoiceOver, urutan fokus, label tombol, pesan error, dan pembesaran font. Perubahan UI penting perlu dapat diketahui pengguna pembaca layar. [Aksesibilitas React Native](https://reactnative.dev/docs/accessibility)
- Hormati pengaturan reduce motion, dark mode, kontras, dan RTL jika bahasa RTL menjadi target.
- Beri dimensi/aspect ratio gambar agar layout tidak melompat; gunakan ukuran asset sesuai tampilan dan strategi cache yang tidak menyajikan data privat lintas sesi.
- Jangan memuat daftar panjang lewat `.map` di `ScrollView`. Hindari nested list dengan arah scroll sama; `getItemLayout` hanya jika ukuran item memang diketahui.
- Untuk animasi, utamakan transform/opacity saat sesuai. Hindari membaca shared value Reanimated secara sinkron selama render; ukur release build pada perangkat target. [Reanimated performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)
- React Compiler dapat mengurangi memoization manual. Periksa apakah aktif pada konfigurasi project dan gunakan lint yang sesuai; jangan berasumsi aktif hanya dari versi React. [Expo React Compiler](https://docs.expo.dev/guides/react-compiler/)

Tetapkan baseline sederhana: cold start, waktu membuka daftar/laporan, durasi query, dan kelancaran scroll pada dataset yang tetap. Tidak perlu menetapkan target angka universal tanpa perangkat acuan.

## 22. Build reproducibility dan pemeliharaan

- Pin versi Node/package manager yang digunakan tim dan CI. Gunakan instalasi lockfile yang konsisten.
- Pertahankan konfigurasi dasar Expo ketika menambah Metro/Babel plugin. Jangan menyalin konfigurasi lama yang mengganti resolver/transformer tanpa memahami efeknya.
- Audit peer dependency library grafik, gradient, animasi, dan testing dari versi yang benar-benar terpasang. `package.json` saja tidak membuktikan kompatibilitas; periksa lockfile, diagnostik Expo, dan build.
- Gunakan flat config yang sesuai ESLint 9 dan `eslint-config-expo`; pisahkan lint correctness dari Prettier. Warning panjang file adalah sinyal review, bukan bukti kualitas. [ESLint dan Prettier Expo](https://docs.expo.dev/guides/using-eslint/)
- Tambahkan smoke test release yang relevan setelah perubahan native; unit test JavaScript tidak memeriksa linking native atau konfigurasi permission.
- Uji migrasi dari instalasi lama, bukan hanya fresh install. Jangan mengejar coverage 100% dengan test yang meniru implementation detail.
- Jika menambahkan crash reporting, siapkan source map sesuai build/update dan redaksi data sensitif. Sertakan versi build dan update untuk diagnosis.
- Untuk OTA, pisahkan channel/environment, periksa runtime compatibility, uji preview terlebih dahulu, dan siapkan recovery. Upgrade native memerlukan binary baru yang sesuai. [Runtime versions Expo](https://docs.expo.dev/eas-update/runtime-versions/)
- Dalam CNG, simpan kustomisasi melalui config plugin. Bila native project sengaja dipelihara manual, version-control perubahan itu dan jangan menjalankan clean prebuild tanpa menjaga kustomisasi. [CNG Expo](https://docs.expo.dev/workflow/continuous-native-generation/)

## 23. Prioritas penerapan dan pemeliharaan panduan

| Prioritas | Praktik |
| --- | --- |
| Baseline harian | Strict TypeScript, Rules of React, batas module, validasi input, error handling, lint/format/typecheck |
| Data persisten | Migrasi, transaksi atomik, tipe/satuan uang, backup yang dapat dipulihkan |
| Sebelum rilis | Device/release testing, permissions, aksesibilitas, variant terpisah, diagnosis error, upgrade dari data lama |
| Sesuai kebutuhan | Auth, server-state library, outbox/sync, background task, OTA, enkripsi database |
| Berdasarkan pengukuran | Memoization, query index tambahan, list tuning, pemisahan module lebih lanjut |

Tinjau kembali panduan saat upgrade Expo SDK atau perubahan arsitektur. Catat alasan penyimpangan pada keputusan teknis yang relevan. Tidak ada dokumen yang mencakup semua kasus React Native; panduan ini menetapkan baseline luas dan cara memilih praktik sesuai risiko produk.

## 24. Amandemen khusus Spen (8 September 2026)

Bagian panduan ini dirancang sebagai konsultasi umum dan ditulis sebelum adopsi bertahap di repo. Beberapa pasal tidak berlaku persis karena keputusan repo (ADR) menang; berikut pemetaan resminya:

- **Layar & route (§2/§6/§17)**: Spen memakai *pure screen* + route adapter (ADR-0008): layar menerima view-model + callback, tidak memegang data-hook sendiri; route yang memuat loading/adapter boleh melebihi 100 baris, diekstrak bertahap.
- **File tipe (§2/§4)**: tidak ada konvensi `*.types.ts` per fitur; tipe view-model/input dekat pemiliknya (`data/`, `read.ts`), tipe lintas fitur di `src/types/`.
- **Output migrasi (§2/§9)**: berada di `drizzle/` (bukan `db/migrations`) dan bersifat incremental (ADR-0010).
- **Lokasi keputusan (§14)**: `docs/adr/`, bukan `docs/decisions/`.
- **Ambang ukuran file (§7)**: target ekstraksi bertahap; eslint saat ini error di 600 baris efektif.
- **Guard & error form**: submit dilindungi re-entry dan rejection diterjemahkan di batas UI (lihat tiket T02/T03).
- Keputusan lain (typed routes off, provider sebagai lapisan aplikasi, fitur data-only) tercatat di ADR-0011, amandemen ADR-0009, dan `docs/agents/guide-adoption-backlog.md`.
- Dokumen ini hidup di `docs/expo-react-native-development-guide.md` dan ditinjau ulang saat upgrade Expo SDK (lihat §23).
