# ADR-0005: Koreksi saldo wallet lewat transaksi penyesuaian, bukan edit langsung

Kita mengizinkan pengguna mengubah saldo wallet langsung di UI (kasus: saldo riil berbeda dengan catatan, misal pengeluaran lama yang lupa dicatat), tetapi perubahan itu **selalu direpresentasikan sebagai transaksi penyesuaian** (kategori khusus "Penyesuaian Saldo") — tidak ada jalur yang mengubah saldo tanpa jejak. Dengan begitu invariant **saldo = saldo awal + transaksi** (US-26) tetap berlaku.

Alternatif yang dipertimbangkan: kolom `saldo` yang bisa diedit langsung. Kita tolak karena melanggar invariant yang sudah direkam dan membuat saldo bisa divergen dari riwayat.

Konsekuensi: transaksi penyesuaian muncul di riwayat, tidak mengisi progress item plan mana pun (tidak terikat kategori pendapatan/expense/goal), tetapi mengurangi saldo wallet dan **saldo tersedia** (lihat CONTEXT.md). Angka target di plan tidak terpengaruh — realita (saldo) yang menyesuaikan, rencana tetap. Ini yang membuat kasus "uang sudah terlanjur kepakai tapi tidak tercatat" tetap sinkron: koreksi saldo otomatis mengurangi uang tersedia di plan.
