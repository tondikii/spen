---
name: spen-rn-testing
description: "Pola React Native + Expo SDK 57 untuk Spen: file-based routing (expo-router), tab bar 5 slot dengan + tengah, komponen themed, design system dari docs/design/DESIGN.md (calm finance, angka besar, semantic colors), dan setup testing (jest-expo + react-native-testing-library) di seam service layer. Gunakan saat membangun layar/komponen UI, navigasi, atau menulis test."
---

# Spen RN + Testing

Pola UI dan testing Spen. Konteks domain: `CONTEXT.md`; desain: `docs/design/DESIGN.md` + `docs/design/design-tokens.md` (sumber visual); keputusan teknis: `docs/adr/`; spec & user stories: `docs/spec.md`.

## Aturan UI

- **Bahasa Indonesia** di seluruh UI. Pakai istilah domain dari `CONTEXT.md` (Wallet, Budget plan, Fixed expense, Goal, Spare budget, Net saving, Saldo tersedia, Transaksi penyesuaian); jangan pakai sinonim di `_Avoid_`.
- **Expo SDK 57 — versi docs berubah.** Selalu cek https://docs.expo.dev/versions/v57.0.0/ sebelum menulis kode (mis. API `expo-sqlite`, `expo-router`, komponen). Jangan mengandalkan memori versi lama.
- **File-based routing** (`expo-router`): layar = file di `src/app/`. Struktur tab ada di `src/app/(tabs)/` dengan `_layout.tsx` mendefinisikan tab bar (5 slot: Beranda, Rencana, +, Report, Settings). **+** tengah = full-screen modal create transaksi (bukan tab).
- **Komponen themed**: pakai hook `useTheme`/`useColorScheme` yang sudah ada (`src/hooks/`), jangan hardcode warna. Dark mode wajib didukung di semua layar.
- **Design system**: ikuti `docs/design/DESIGN.md` — calm finance, angka besar (Fraunces), semantic colors (income=success, expense=error, transfer=warning), radius/spacing dari `design-tokens.md`. Jangan invent style baru yang melenceng dari brand contract.
- **Semua angka uang**: integer rupiah, format `id-ID` tanpa desimal (`Rp 2.500.000`).
- **UI memakai satu seam service layer** (`db/` + `services/` via React hooks/context): layar tidak query DB langsung. Baca ADR-0004 (invariant plan = dompet).

## Testing

- **Runner**: `jest-expo` (preset Expo) + `react-native-testing-library` untuk render komponen; install via `npx expo install jest-expo jest @types/jest --dev` lalu preset `jest-expo` di `package.json`/`jest.config.js`. Tambahkan `"test": "jest"` ke scripts.
- **Seam yang diuji (keputusan spec)**: satu lapisan service domain (`db/` + `services/`) — semua logika bisnis diuji di sini (unit murni + integration ke DB lokal temp/in-memory). UI di-test secukupnya (render dasar, interaksi kunci), bukan snapshot menyeluruh.
- **Prioritas test** (dari `docs/spec.md` Testing Decisions): spare budget & progress plan (termasuk over-budget), Fixed expense progress & bayar sebagian, netralitas Transfer, Goal progress & tercapai, agregasi report (pie per kategori, line net saving, drill-down), fallback deterministik AI.
- **TDD**: pakai `/tdd` — red → green per slice vertikal (satu test → satu implementasi), test di seam yang sudah disepakati. Hindari horizontal slicing (semua test dulu baru implementasi).
- **Integration test DB**: buka DB temp/in-memory via `SQLite.openDatabaseAsync` dengan `directory` temp (lihat `spen-db`), bukan DB production.
- **Jalankan**: typecheck (`npx tsc --noEmit`), satu file test (`npx jest <file>`), dan full suite (`npm test`) di akhir.

## Referensi

- Design: `docs/design/DESIGN.md`, `docs/design/design-tokens.md`
- Domain: `CONTEXT.md`; spec: `docs/spec.md`; ADR: `docs/adr/`
- Expo SDK 57 docs: https://docs.expo.dev/versions/v57.0.0/
- DB: skill `spen-db`
