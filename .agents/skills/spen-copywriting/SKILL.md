---
name: spen-copywriting
description: "Pola copywriting Spen: Bahasa Indonesia santai-tenang, ringkas, tanpa kesan AI — istilah domain dari CONTEXT.md, angka tepat, no TMI, no redundancy. Gunakan saat menulis/mengubah teks UI (label tombol, empty state, error, toast, form note, konfirmasi, insight & saran AI) atau saat menilai copy yang terasa AI/kurang nyambung."
---

# Spen Copywriting

Copy Spen: pendek, tenang, dan jelas — seperti catatan dari teman yang paham keuangan, bukan surat resmi dan bukan artikel AI.

Konteks: istilah domain `CONTEXT.md`; nada & contoh suara `docs/design/DESIGN.md` §7.

## Suara

- **Santai namun tenang** (calm finance): "Mengerti", "Perlahan ya — ini akan melebihi alokasi, tetapi tetap bisa dicatat." Bukan ceria berlebihan, bukan kaku.
- **Sapaan "kamu"**, bukan "Anda". Kalimat pendek, kata sehari-hari.
- **Tidak menghakimi**: status ("Defisit", "Melebihi Budget") adalah informasi, bukan teguran.

## Empat prinsip

1. **Ringkas** — satu ide per string. Hapus kata yang tidak mengubah arti. Kalau butuh dua kalimat, cek dulu apakah kalimat kedua benar-benar menambah.
2. **Tepat** — pakai istilah domain dari `CONTEXT.md` (Wallet, Budget plan, Spare budget, …), bukan sinonim. Angka persis, format `id-ID` tanpa desimal (`Rp 2.500.000`); jangan dibulatkan jadi "sekitar".
3. **Relevan** — copy mengikuti konteks persis: state (empty/error/loading/sukses), aksi (tombol = kata kerja), dan apa yang sudah tampil di layar. Tidak ada kalimat generik yang bisa dipindah ke layar mana pun.
4. **Natural** — ditulis seperti manusia bicara, bukan template. Kalau dua string bisa saling menggantikan tanpa terasa aneh, keduanya generik.

## Kesan AI → ganti

| Kesan AI | Ganti dengan |
|---|---|
| "Selamat datang di Spen! Kami senang Anda bergabung…" | Langsung ke isi: "Buat rencana untuk uangmu." |
| Nasihat sebagai tombol: "Mulai perlahan" | Aksi langsung: "Mulai", "Lanjut", "Masuk ke Spen" |
| "Mohon / Silakan / diharapkan …" | Kata kerja langsung: "Pilih wallet", "Simpan" |
| "Untuk memudahkan Anda dalam mengelola keuangan…" | Manfaat konkret: "Coba saran AI untuk alokasi yang pas" |
| "Transaksi Anda telah berhasil dicatat…" (hasilnya sudah terlihat) | Hasil saja: "Tercatat" |
| "Berdasarkan analisis pola pengeluaran Anda, terlihat bahwa…" | Fakta + arah: "Pengeluaran Makan naik 12% bulan ini" |
| "dengan demikian / oleh karena itu / sebagai informasi / guna / agar lebih" | Hapus sambungannya — potong saja |
| Kata abstrak kosong: "pengalaman", "perjalanan", "lebih bijak", "lebih baik" | Kata konkret yang bisa dicek: angka, kategori, aksi |

## Aturan konten

- **No TMI**: ceritakan hanya yang dibutuhkan untuk bertindak. Jangan jelaskan cara kerja sistem ("dihitung dari tabel transaksi", "diperbarui secara otomatis") kecuali itu yang ditanyakan.
- **No redundancy**: jangan ulangi fakta yang sudah tampil di layar. Empty state "Belum ada catatan" + deskripsi yang menambah info baru ("Tidak ada transaksi pada 31 Agustus.") boleh; deskripsi yang mengulang judul = redundancy.
- **Tombol = kata kerja hasil** ("Simpan", "Catat", "Hapus"), bukan proses ("Mengonfirmasi…"). Judul modal = kata benda ("Edit Transaksi").
- **Error/toast**: sebut apa yang terjadi + satu jalan keluar, bukan permintaan maaf panjang.

## Checklist sebelum selesai

- [ ] Istilah domain dari `CONTEXT.md`, bukan sinonim dari `_Avoid_`.
- [ ] Coba potong satu kata — masih sama artinya? Kalau ya, potong.
- [ ] Ada fakta yang sudah terlihat di layar diulang? Hapus.
- [ ] Ada info yang tidak dipakai untuk bertindak? Hapus (TMI).
- [ ] Terasa AI? Cek formula pembuka, kata sambung robotik, "Anda"/"Mohon", kata abstrak kosong.
- [ ] Angka tepat, format `id-ID` tanpa desimal.
- [ ] Nada santai-tenang, tidak menghakimi.

## Referensi

- Domain & istilah: `CONTEXT.md`
- Nada & contoh suara: `docs/design/DESIGN.md` §7
- Copy AI (insight/saran budget): pola service di skill `spen-ai-service`