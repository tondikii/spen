# Spen — Ticket Map

27 tiket ter-publish di GitHub Issues (repo `tondikii/spen`), parent = issue #1 (spec).
Milestone per fase = **checkpoint review manusia**. Kerjakan blockers-first; frontier = tiket tanpa blocker.

## Fase 0 — Foundation (checkpoint: app boot + test jalan, tanpa logika custom)
- **#4** Scaffold runtime & konfigurasi — *frontier, mulai di sini*
- **#5** Scaffold test infrastructure — *frontier*

## Fase 1 — UI mock + design system (checkpoint: seluruh layar hidup dgn mock, light/dark, edit transaksi)
- **#6** Design system RN + theme
- **#7** Domain types + mock data
- **#8** Tab bar 5 slot + skeleton navigasi
- **#9** Beranda + wallet sheet + form wallet (mock)
- **#10** Form transaksi: create + edit state (mock) ← menutup gap audit edit transaksi
- **#11** View transaksi harian (mock)
- **#12** Riwayat transaksi (mock)
- **#13** Rencana + AI suggestion (mock)
- **#14** Report + AI insight (mock)
- **#15** Settings (mock)
- **#16** Setup wizard (mock) ← menutup gap audit step currency

## Fase 2 — Data + service + wiring (checkpoint: app fungsional end-to-end, invariant plan=dompet teruji, TDD)
- **#17** Data foundation: schema, migrasi, seed
- **#18** Wallet end-to-end
- **#19** Transaksi end-to-end (incl. dobel warning, undo+redo)
- **#20** Rencana end-to-end (plan/period, bayar, spare)
- **#21** Goal end-to-end
- **#22** Report end-to-end (aggregation)
- **#23** Harian & riwayat end-to-end
- **#24** Setup wizard end-to-end

## Fase 3 — AI service (checkpoint: suggestion & insight jalan + fallback)
- **#25** AIService Groq + fallback deterministik
- **#26** Integrasi AI ke UI

## Fase 4 — Settings (checkpoint: settings fungsional penuh)
- **#27** Currency persist + format
- **#28** Backup/restore JSON

## Fase 5 — Polish & acceptance (checkpoint: release-ready)
- **#29** States lengkap di semua layar
- **#30** Acceptance akhir vs spec + code-review

## Catatan
- Skill: `spen-db`, `spen-rn-testing`, `spen-ai-service` (custom), plus `/tdd`, `/implement`, `/code-review`.
- Blocking edges native di GitHub (dependencies). Frontier query: `gh issue list --state open` lalu drop yang punya blocker/assignee.
- Issue #2 = duplikat #4 (ditutup).
- Review per fase: saat semua tiket milestone suatu fase selesai, itu checkpoint manusia.
