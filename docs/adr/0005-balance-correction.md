# ADR-0005: Koreksi saldo wallet lewat transaksi penyesuaian, bukan edit langsung

Kita mengizinkan pengguna membuat Wallet dengan saldo awal dan mengubah saldo wallet langsung di UI (kasus: saldo riil berbeda dengan catatan, misal pengeluaran lama yang lupa dicatat). Dua mutasi itu sama-sama **selalu direpresentasikan sebagai transaksi**, tetapi memakai kategori berbeda: saldo awal memakai kategori khusus "Saldo Awal", sedangkan koreksi saldo manual memakai kategori khusus "Penyesuaian Saldo". Tipe transaksinya `income` ketika saldo bertambah dan `expense` ketika saldo berkurang — tidak ada jalur yang mengubah saldo tanpa jejak. Dengan begitu saldo Wallet diturunkan dari ledger.

Alternatif yang dipertimbangkan: kolom `saldo` yang bisa diedit langsung. Kita tolak karena melanggar invariant yang sudah direkam dan membuat saldo bisa divergen dari riwayat.

Konsekuensi: transaksi saldo awal dan penyesuaian muncul di riwayat serta masuk ke Pendapatan atau Pengeluaran Plan sesuai tipe transaksi dan periode aktif. Saldo awal/penyesuaian tetap memakai kategori internal agar identitasnya jelas. Penyesuaian mengubah saldo wallet dan **saldo tersedia** (lihat CONTEXT.md); realisasi Plan mengikuti ledger yang sama.
