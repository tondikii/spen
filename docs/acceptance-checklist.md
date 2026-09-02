# Spen — Acceptance checklist

Checklist ini memetakan 48 user story pada `docs/spec.md` ke implementasi yang ada. Status `✅` berarti perilaku sudah diimplementasikan dan memiliki coverage service/UI yang relevan; validasi visual native tetap perlu dilakukan pada perangkat oleh pemilik aplikasi.

| US | Status | Implementasi / bukti |
| --- | --- | --- |
| 1 | ✅ | `setup-service`, `setup-wizard`, dan test setup end-to-end. |
| 2–3 | ✅ | `wallet-service`, Home wallet sheet, create/edit/archive wallet, dan test database. |
| 4–6 | ✅ | Transfer memakai kategori global; saldo dan warna semantic diuji di transaction/goal service. |
| 7–8 | ✅ | `plan-service` membuat satu plan per Budget period dan mendukung tanggal mulai custom. |
| 9–9b | ✅ | Item Pendapatan, realisasi dari ledger, aksi Catat, dan peringatan income yang mungkin dobel. |
| 10–13 | ✅ | Fixed expense/alokasi, progress dari transaksi, Bayar sebagian, dan tidak ada recurring transaction. |
| 14–16 | ✅ | Goal dengan target, tanggal opsional, Wallet Goal, edit/archive, dan status progress. |
| 17 | ✅ | Spare budget dihitung dari target Pendapatan − fixed expense − kontribusi Goal aktif. |
| 18–21 | ✅ | AI dipicu manual, fallback lokal, structured suggestions, tombol Terapkan; `add_goal` kini membawa target/wallet dan dapat membuat Wallet Goal. |
| 22–25 | ✅ | Form transaksi income/expense/transfer, edit state, hapus dengan konfirmasi, dan wallet eksplisit. |
| 26–26a | ✅ | Saldo diturunkan dari ledger; koreksi saldo menghasilkan transaksi adjustment; hero Rencana memakai komponen finance hero bersama. |
| 27 | ✅ | Wallet bertransaksi hanya dapat di-archive. |
| 28, 35 | ✅ | Warning over-budget tetap mengizinkan simpan dan progress menampilkan status merah. |
| 29–30 | ✅ | Goal tercapai berhenti dihitung; net saving negatif berlabel Defisit dan berwarna expense. |
| 31–34 | ✅ | Seed kategori, CRUD/arsip kategori, filter picker berdasarkan tipe, dan semantic colors. |
| 36–40 | ✅ | Report summary, pie expense terurut, drill-down, line chart rentang, dan Budget period custom. |
| 41–42 | ✅ | AI insight on-demand, Bahasa Indonesia, fallback deterministik. |
| 43 | ✅ | Theme light/dark tersimpan melalui settings dan token tema dipakai lintas layar. |
| 44–45 | ✅ | Backup JSON berversi via share sheet dan restore replace dengan konfirmasi/validasi. |
| 46–47 | ✅ | Currency default IDR, pilihan currency curated, tersimpan global tanpa konversi. |
| 48 | ✅ | UI copy dan prompt/output AI ditetapkan Bahasa Indonesia. |

## Automated acceptance

- `npm.cmd test -- --runInBand` — seluruh suite harus hijau.
- `npx.cmd tsc --noEmit` — typecheck harus hijau.
- `npm.cmd run lint` — tidak boleh ada error lint; warning legacy dicatat di output lint.
- `git diff --check` — tidak boleh ada whitespace error.

## Manual native QA yang tersisa

Ini bukan implementasi kode yang tertunda, tetapi pemeriksaan yang memerlukan simulator/device dan interaksi native:

1. Jalankan `npm.cmd start`, buka Android/iOS, lalu cek semua tab pada light dan dark mode; khususnya safe-area, footer tab bar, hero card, modal, keyboard, dan scroll pada layar sempit.
2. Di Rencana, uji tambah/edit/hapus item, Terapkan saran `add_goal`, Bayar sebagian, Goal tercapai, dan over-budget.
3. Di Beranda/Riwayat/Harian/Report, tap transaksi untuk edit/hapus, tap pie untuk drill-down, stepper + kalender, dan filter.
4. Di Settings, lakukan export sampai share sheet native muncul; restore file JSON yang valid dan file dengan `version` salah untuk memastikan konfirmasi/error tampil.
5. Untuk build produksi, letakkan `EXPO_PUBLIC_GROQ_API_KEY` melalui secret/environment build. Jangan commit API key; produksi idealnya memakai proxy server-side sesuai catatan spec.
