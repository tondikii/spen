# ADR-0004: Plan dan dompet selalu konsisten karena diturunkan dari transaksi yang sama

Kita menetapkan invariant: **setiap angka uang di Budget plan hanyalah salah satu dari dua hal — target (rencana, ditulis manual) atau turunan transaksi (realita). Tidak ada angka ketiga.** Saldo wallet, realisasi pendapatan, progress fixed expense/alokasi, saldo tersedia, dan spare budget semuanya dihitung dari tabel transaksi yang sama, sehingga plan dan dompet tidak mungkin berbeda (sinkron by construction, bukan dijaga manual).

Alternatif yang dipertimbangkan: menyimpan angka "saldo tersedia" atau "realisasi pendapatan" sebagai kolom tersendiri yang disinkronkan manual. Kita tolak karena menciptakan dua sumber kebenaran yang bisa divergen (misal user mengubah saldo wallet langsung, atau mencatat transaksi di luar periode). Menurunkan semua angka realita dari satu tabel transaksi menghilangkan seluruh kelas bug sinkronisasi.

Konsekuensi: koreksi saldo wallet tidak bisa "langsung" tanpa jejak — harus berupa transaksi penyesuaian (ADR-0005). Angka target (nominal pendapatan, nominal fixed expense, kontribusi goal) tetap ditulis manual dan tidak pernah otomatis menulis transaksi; hanya tombol "Catat"/"Bayar"/"Nabung" yang membuat transaksi.
