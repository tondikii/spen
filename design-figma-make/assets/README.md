# Spen — Expo assets

`logo.svg` adalah sumber logo utama; `splash.svg` adalah artwork splash layar penuh. PNG untuk Expo sudah tersedia dan nama file-nya sudah dipasang di `expo-app.json.example`:

- `logo.png` — 1024 × 1024, ikon aplikasi iOS dan umum.
- `adaptive-icon.png` — 1024 × 1024, foreground Android dengan latar transparan.
- `splash-icon.png` — 512 × 512, mark terpusat untuk plugin Expo Splash Screen.
- `splash.png` — 1284 × 2778, artwork splash portrait untuk referensi/implementasi legacy.

Salin konfigurasi dari `expo-app.json.example` ke `app.json` Expo Anda. Background splash memakai `#F6F5F0` agar transisi ke mode terang tenang dan tidak terlihat garis batas; versi gelap memakai `#12231F`.
