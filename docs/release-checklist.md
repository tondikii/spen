# Spen — Release & pre-merge checklist

Ringkasan dari panduan development seksi 15 + praktik repo. Item bertanda **device** diverifikasi pemilik pada perangkat/build nyata.

## Sebelum merge PR

- [ ] `npm run verify` hijau lokal (format, lint, typecheck, test).
- [ ] Perubahan schema punya migrasi incremental baru (ADR-0010) dan test upgrade ikut hijau.
- [ ] Teks UI baru masuk `common-id` + `common-en` (paritas key); bukan hardcoded di service layer.
- [ ] Tidak ada rahasia baru di `EXPO_PUBLIC_*` / bundle; `.env*` tetap gitignored.
- [ ] ADR baru ditulis untuk keputusan arsitektur; istilah domain tidak melenceng dari `CONTEXT.md`.
- [ ] Refactor besar diekstrak bertahap (target panduan: file < 400 baris efektif); belum menurunkan ambang lint.

## Sebelum rilis

- [ ] **device** Smoke test: cold start, migrasi dari data lama (bukan hanya fresh install), backup → restore.
- [ ] **device** A11y: TalkBack/VoiceOver untuk alur utama (form transaksi, plan, report), urutan fokus, font besar, kontras.
- [ ] **device** Data: buat transaksi/transfer/koreksi saldo lalu verifikasi saldo & laporan konsisten.
- [ ] Variants: profile EAS sesuai environment; application ID tidak bentrok saat development build.
- [ ] `npx expo-doctor` dan `npx expo install --check` bersih.
- [ ] Diagnosis error: pesan error domain terlokalisasi (ADR-0006); logger/crash reporting bila ditambahkan sesuai keputusan produk.
- [ ] Keputusan produk tertunda yang relevan tercatat di `docs/agents/guide-adoption-backlog.md` (T19/T20).
