# ADR-0005: Koreksi saldo wallet lewat transaksi penyesuaian, bukan edit langsung

Kita mengizinkan pengguna membuat Wallet dengan saldo awal dan mengubah saldo wallet langsung di UI (kasus: saldo riil berbeda dengan catatan, misal pengeluaran lama yang lupa dicatat). Dua mutasi itu sama-sama **selalu direpresentasikan sebagai transaksi**, tetapi memakai kategori berbeda: saldo awal memakai kategori khusus "Saldo Awal", sedangkan koreksi saldo manual memakai kategori khusus "Penyesuaian Saldo". Tipe transaksinya `income` ketika saldo bertambah dan `expense` ketika saldo berkurang — tidak ada jalur yang mengubah saldo tanpa jejak. Dengan begitu saldo Wallet diturunkan dari ledger.

Alternatif yang dipertimbangkan: kolom `saldo` yang bisa diedit langsung. Kita tolak karena melanggar invariant yang sudah direkam dan membuat saldo bisa divergen dari riwayat.

Konsekuensi: transaksi saldo awal dan penyesuaian muncul di riwayat, tidak mengisi progress item plan mana pun (kategori internal dikecualikan dari agregasi plan/report), tetapi mengubah saldo wallet dan **saldo tersedia** (lihat CONTEXT.md). Angka target di plan tidak terpengaruh — realita (saldo) yang menyesuaikan, rencana tetap. Saldo awal juga tidak dihitung sebagai realisasi pendapatan periode.
