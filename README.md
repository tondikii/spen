# Spen

Spen adalah aplikasi budgeting berbasis Expo SDK 57 untuk Android, iOS, dan web.

## Mulai

1. Install dependency.

   ```bash
   npm install
   ```

2. Siapkan env lokal.

   ```bash
   cp .env.example .env.local
   ```

   Lalu isi `EXPO_PUBLIC_GROQ_API_KEY` jika ingin fitur AI suggestion memakai Groq.

3. Jalankan aplikasi.

   ```bash
   npm run start
   ```

## Environment

Expo membaca variabel dengan prefix `EXPO_PUBLIC_` dari file `.env*` di root project. Untuk repo ini, variabel yang dipakai aplikasi adalah:

- `EXPO_PUBLIC_GROQ_API_KEY`: API key Groq untuk AI suggestion.

Kalau variabel ini kosong, aplikasi tetap berjalan dan memakai fallback deterministik lokal untuk saran budget.

Jangan commit file env lokal atau API key ke repository.

## Script

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm test`
- `npm run lint`

## Catatan

- Project ini memakai file-based routing dengan `expo-router`.
- `npm run reset-project` tersedia untuk mengembalikan layout starter Expo, tetapi biasanya tidak diperlukan untuk kerja harian repo ini.
