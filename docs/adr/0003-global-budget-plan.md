# ADR-0003: Global budget plan, wallets as storage

Kita memakai **satu Budget plan global** (satu rencana bulanan untuk seluruh aplikasi), bukan satu plan per wallet. Wallet hanya tempat uang disimpan (cash/bank/e-wallet); transaksi tercatat terhadap wallet dan kategori, tetapi pendapatan, fixed expense, dan goal hidup di satu plan terpusat.

Alternatif yang dipertimbangkan: plan per wallet (tiap wallet punya pendapatan/fixed expense/goal sendiri). Kita pilih global karena konsisten dengan model "transfer netral terhadap kekayaan" (transfer hanya memindahkan uang antar tempat simpan, tidak mengubah rencana), menyederhanakan agregasi report (satu sumber kebenaran per periode), dan mencerminkan cara orang berpikir: satu anggaran rumah tangga, uangnya tersebar di beberapa tempat.

Konsekuensi: saat fixed expense "dibayar langsung", pengguna memilih wallet asal pembayaran (transaksi expense tercatat di wallet itu), tetapi item plan-nya tetap global; progress plan terisi dari transaksi expense kategori tersebut di wallet mana pun.
