# Dependency audit

Audit #45 dijalankan pada 2026-09-04 dengan `npm ls --depth=0` dan pencarian import di `src/`, konfigurasi Expo, serta test.

Semua dependency runtime memiliki pemakaian langsung atau merupakan peer/runtime integration Expo: font packages, Expo modules, Drizzle/SQLite, navigation, chart/gradient, animation, dan React Native platform packages. Semua devDependency dipakai oleh script quality gate, testing, TypeScript, migration tooling, atau Babel.

Tidak ditemukan package yang aman dihapus tanpa mengubah build/runtime behavior. Tidak ada perubahan dependency yang dibuat. Audit diulang dengan `npm ls --depth=0` tanpa package missing atau invalid.
