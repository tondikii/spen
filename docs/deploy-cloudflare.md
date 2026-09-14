# Deploy Web Spen ke Cloudflare

> Stack: **Expo SDK 57** + `expo-router` + `web.bundler: metro` + `web.output: static` → output `dist/` → **Cloudflare Pages** (static).

Web Spen hanya melayani dokumen publik (`/terms`, `/privacy`) — lihat `README.md:3` dan `app.config.js:38-42`. Panduan ini menyamakan langkah build lokal dan CI agar hasil `dist/` konsisten.

---

## 1. Prasyarat

| Kebutuhan | Versi / Catatan |
|-----------|-----------------|
| Node.js | 20 LTS (sesuai Expo SDK 57) |
| npm | 10+ |
| Akun Cloudflare | Free tier cukup |
| Wrangler | `npx wrangler@latest` (v4.130.0 saat doc ini ditulis) |

```bash
node -v
npm -v
npx wrangler --version
```

Login sekali (untuk deploy via CLI):

```bash
npx wrangler login
# atau via token
# set CLOUDFLARE_API_TOKEN di env, lalu wrangler otomatis pakai token
```

---

## 2. Build Web Lokal

Spen mengabaikan `dist/` di `.gitignore:11` — jadi **wajib build ulang** sebelum deploy.

```bash
# 1. install
npm ci

# 2. siapkan env (hanya prefix EXPO_PUBLIC_ yang kebawa ke web)
cp .env.example .env.local
# isi EXPO_PUBLIC_GROQ_API_KEY kalau butuh cek AI di web, kosong pun tidak error (fallback lokal)

# 3. export static web (platform web saja, bukan all)
npx expo export --platform web

# atau eksplisit output dir
npx expo export --platform web --output-dir dist
```

Hasil sukses terlihat seperti:

```
Web Bundled 5xxx ms expo-router/entry.js (1504 modules)
Static routes (18):
/plan, /terms, /privacy, /_sitemap, /+not-found, ...
Exported: dist
```

Cek output:

```bash
ls dist
# _expo/  _sitemap.html  +not-found.html  create.html  plan.html
# privacy.html  report.html  terms.html  favicon.ico  assets/  home/  settings/  (tabs)/
```

Test lokal sebelum upload:

```bash
npx serve dist
# atau
npx wrangler pages dev dist
```

Buka `http://localhost:3000/terms` dan `/privacy` — dua rute ini yang dipakai publik.

> Jangan pakai `npx expo export` tanpa `-p web`. Tanpa flag itu Expo juga membundle `android` dan mengotori `dist` dengan `.hbc`.

---

## 3. Konfigurasi Wajib untuk Cloudflare Pages

### 3.1 SPA / 404 fallback

Expo `output: static` sudah menghasilkan file `.html` per route, jadi `/terms` → `terms.html` langsung work. Namun untuk route tidak dikenal perlu fallback ke `+not-found.html`.

Tambahkan file di **`public/_redirects`** (akan tercopy otomatis ke `dist/_redirects` saat export):

```
# public/_redirects
/*  /+not-found.html  404
```

Kalau belum ada folder `public/`, buat dulu:

```bash
mkdir -p public
echo "/*  /+not-found.html  404" > public/_redirects
npx expo export --platform web  # build ulang
```

Alternatif Cloudflare Pages (versi lama) pakai `_redirects`, untuk Pages/Workers terbaru bisa juga pakai `_routes.json` — tidak wajib untuk Spen karena sudah pre-render.

### 3.2 Header & Cache (opsional)

`public/_headers` untuk cache asset:

```
# public/_headers
/_expo/static/*
  cache-control: public, max-age=31536000, immutable

/assets/*
  cache-control: public, max-age=31536000, immutable

/*.html
  cache-control: public, max-age=0, must-revalidate
```

Build ulang setelah menambah file `public/`.

### 3.3 Environment Variable

Cloudflare Pages → **Settings → Variables and Secrets** atau via `wrangler`:

| Variabel | Contoh | Keterangan |
|----------|--------|------------|
| `EXPO_PUBLIC_GROQ_API_KEY` | `gsk_xxx` | Dipakai `AIService` web. Kosong = fallback deterministik (aman). |
| `EXPO_PUBLIC_WEB_URL` | `https://spen.pages.dev` | URL publik untuk link di `/terms` & `/privacy` jika ada. |

> Expo hanya menginline variabel `EXPO_PUBLIC_*` **saat build**. Jadi ubah env → build ulang → deploy ulang. Mengubah env di dashboard Cloudflare tanpa rebuild tidak berpengaruh.

---

## 4. Opsi A — Deploy via Dashboard

Cloudflare Pages mendukung dua jalur dari Dashboard yang sama — pilih sesuai kebutuhan:

| Jalur | Kapan pakai |
|-------|-------------|
| **A1. Connect to Git** (auto-deploy tiap push) | Mau deploy otomatis tanpa setup GitHub Actions sendiri. **Rekomendasi** kalau repo sudah di GitHub/GitLab. |
| **A2. Upload assets** (manual) | Coba cepat tanpa hubungkan repo, atau repo masih private/lokal. |

### Opsi A1 — Connect to Git (deploy otomatis tiap push)

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize & pilih repositori `spen` (GitHub/GitLab) → **Begin setup**.
3. Project name: `spen` (bebas) → pilih **Production branch**: `main`.
4. Atur **Build settings** (penting — karena `dist/` di-ignore di `.gitignore:11`, Cloudflare yang akan build):
   - **Framework preset**: `None` (atau `Create React App` / `Vite` — sama saja, yang penting command di bawah benar)
   - **Build command**: `npm ci && npx expo export --platform web`
   - **Build output directory**: `dist`
   - **Root directory**: kosongkan (kecuali monorepo)
5. Tambah **Environment variables** → **Variables and Secrets** (sama seperti §3.3):
   - `EXPO_PUBLIC_GROQ_API_KEY` = `gsk_xxx` (opsional, kosong = fallback lokal)
   - `EXPO_PUBLIC_WEB_URL` = `https://spen.pages.dev` (ganti setelah custom domain jadi)
   - Atur untuk **Production** dan **Preview** kalau mau preview branch ikut kebuild.
6. Di **Advanced / Node version** pastikan Node `20` (sesuai prasyarat):
   - Set variabel `NODE_VERSION = 20` atau Cloudflare otomatis deteksi dari `.nvmrc`/`package.json` → cek log build kalau versi meleset.
7. Klik **Save and Deploy** → Cloudflare clone → install → `expo export --platform web` → publish `dist/` → dapat URL `https://spen-xxx.pages.dev`.
8. Update selanjutnya **otomatis**: tiap `git push` ke `main` → rebuild & deploy. Push ke branch lain → Preview deployment (`https://<branch>.spen.pages.dev`).

> Catatan:
> - Expo hanya inline `EXPO_PUBLIC_*` **saat build**, jadi ubah env di Dashboard → **Retry deployment** (atau push commit kosong) agar rebuild.
> - Kalau build gagal dengan `dist is empty`, cek build command masih `npx expo export --platform web` (pakai flag `-p web`, bukan `npx expo export` saja) dan output dir `dist`.
> - Untuk repo GitHub, Cloudflare akan buat webhook otomatis — tidak perlu setup manual. Bandingkan dengan **Opsi C** (GitHub Actions + Wrangler) kalau kamu mau kontrol build sepenuhnya di sisi GitHub.

### Opsi A2 — Upload assets (tanpa connect Git)

1. Buka [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Project name: `spen` (bebas).
3. Build lokal dulu: `npx expo export --platform web` (lihat §2) lalu drag & drop isi folder `dist/` **atau** upload `.zip` dari `dist/`.
4. Klik **Deploy** → dapat URL `https://spen-xxx.pages.dev`.
5. Untuk update: build ulang lokal → **Create new deployment** → upload ulang `dist/`.

Cocok untuk percobaan pertama, tidak butuh `wrangler` maupun koneksi Git. Untuk auto-deploy, pakai **Opsi A1** (connect Git) atau **Opsi C** (GitHub Actions).

---

## 5. Opsi B — Deploy via Wrangler CLI (rekomendasi)

### 5.1 Deploy pertama

```bash
# build dulu
npx expo export --platform web

# deploy
npx wrangler pages deploy dist --project-name=spen
```

Wrangler akan:
- membuat project `spen` jika belum ada,
- upload `dist/`,
- memberi URL `https://spen.pages.dev`.

Jika project sudah ada, cukup:

```bash
npx wrangler pages deploy dist --project-name=spen --branch=main
```

> Wrangler v4+ menampilkan warning `pages deploy` → `workers deploy` di masa depan. Untuk Pages statik, perintah di atas tetap didukung. Jika diminta migrasi, gunakan:
> ```bash
> npx wrangler deploy --assets dist --name spen
> # dengan wrangler.jsonc: { "assets": { "directory": "dist" } }
> ```

### 5.2 Preview per-branch

```bash
npx wrangler pages deploy dist --project-name=spen --branch=preview
# → https://preview.spen.pages.dev
```

### 5.3 Custom Domain

1. Dashboard → Pages `spen` → **Custom domains** → **Set up a custom domain**.
2. Masukkan `spen.yourdomain.com` (domain harus sudah di Cloudflare).
3. Cloudflare otomatis buat DNS CNAME + sertifikat.

Tidak perlu ubah `app.config.js` — cukup set `EXPO_PUBLIC_WEB_URL` ke domain baru lalu build+deploy ulang jika URL dipakai di dalam halaman.

---

## 6. Opsi C — CI/CD via GitHub Actions (otomatis tiap push)

Buat file `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy Web ke Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx expo export --platform web
        env:
          EXPO_PUBLIC_GROQ_API_KEY: ${{ secrets.EXPO_PUBLIC_GROQ_API_KEY }}
          EXPO_PUBLIC_WEB_URL: ${{ vars.EXPO_PUBLIC_WEB_URL }}
      - name: Deploy ke Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=spen --branch=main
```

Tambahkan di **GitHub → Settings → Secrets and variables → Actions**:
- `CLOUDFLARE_API_TOKEN` (buat di dash.cloudflare.com → My Profile → API Tokens → Create Token → Edit Cloudflare Workers + Pages)
- `CLOUDFLARE_ACCOUNT_ID` (Dashboard → kopikan Account ID di sidebar)
- `EXPO_PUBLIC_GROQ_API_KEY` (optional)

> Jangan commit `.env.local` — `dist/` juga tetap di-ignore, CI yang akan build.

---

## 7. Cheat Sheet

```bash
# build bersih
rm -rf dist .expo
npx expo export --platform web --clear

# cek rute yang ke-generate
ls dist/*.html

# serve lokal
npx serve dist

# deploy cepat (sudah login)
npx wrangler pages deploy dist --project-name=spen

# cek versi wrangler
npx wrangler --version
```

---

## 8. Troubleshooting

| Gejala | Penyebab & Solusi |
|--------|-------------------|
| `dist` kosong / hanya `assets/` | Lupa `-p web`. Jalankan `npx expo export --platform web`, bukan `npx expo export` saja. |
| Halaman putih / 404 di `/terms` | Build tanpa `public/_redirects`. Tambah `public/_redirects` lalu build ulang. |
| Env tidak kebaca | Expo inline env saat build. Ubah env → **build ulang** → deploy ulang. Cek `EXPO_PUBLIC_` prefix. |
| Font / icon 404 | Normal jika cache lama. Clear cache Cloudflare (Caching → Purge) atau tunggu `max-age`. |
| `expo-sqlite` error di web | `expo-sqlite` tidak jalan di browser — tidak masalah karena `/terms` & `/privacy` tidak pakai DB. Jangan buka rute `(tabs)/home` di web sebagai acuan. |
| `wrangler login` gagal di CI | Pakai `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, jangan pakai flow login interaktif. |
| `Pages` tidak muncul di dashboard baru | Cloudflare menggabung Pages ke **Workers & Pages**. Cari menu yang sama, atau pakai `npx wrangler deploy --assets dist`. |

---

## 9. Referensi

- Expo static export: `app.config.js:38-42` (`web.output: static`, `bundler: metro`)
- Expo docs v57: https://docs.expo.dev/versions/v57.0.0/
- Expo export web: `npx expo export --help`
- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Wrangler Pages deploy: https://developers.cloudflare.com/workers/wrangler/commands/#pages-deploy

---

*Terakhir diperbarui: 10 Sep 2026 — Expo SDK 57.0.20, Wrangler 4.130.0*
