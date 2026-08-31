# Spen

Spen adalah aplikasi budget planner mobile berbahasa Indonesia dengan fitur AI (Expo + local DB). UI dan seluruh output AI dalam Bahasa Indonesia. Single context; bukan monorepo.

## Language

**Wallet**:
Tempat uang pengguna disimpan, diberi nama bebas (misal "Tunai", "BCA", "GoPay"); tidak memiliki tipe. Aplikasi ini multi-wallet — pengguna dapat memiliki banyak Wallet, dan uang dapat dipindahkan antar Wallet. Wallet adalah tempat penyimpanan; tidak memiliki Budget plan sendiri. Saldo wallet = saldo awal + transaksi (tidak bisa diedit manual; koreksi lewat transaksi penyesuaian, dibuat otomatis saat saldo diubah langsung di UI). Wallet dapat diberi flag tabungan untuk dipasangkan ke Goal (wallet goal). Wallet yang sudah dipakai (punya transaksi) tidak bisa dihapus, hanya di-archive.
_Avoid_: account, akun, rekening

**Transfer**:
Pemindahan uang antar Wallet. Netral terhadap total kekayaan pengguna; tidak muncul di pie chart report dan tidak mempengaruhi net saving, tapi tetap muncul di riwayat transaksi. Memakai satu kategori tunggal global.
_Avoid_: transaction (umum), pindah dana

**Transaksi penyesuaian**:
Transaksi kategori khusus yang dibuat otomatis saat pengguna mengubah saldo wallet langsung di UI (balance correction), menjaga invariant saldo = saldo awal + transaksi. Muncul di riwayat transaksi; tidak mengisi progress item plan mana pun, tetapi mengurangi saldo wallet dan uang tersedia.
_Avoid_: edit saldo tanpa jejak, balance correction manual

**Budget period**:
Rentang waktu berdurasi satu bulan tempat pendapatan, fixed expense, dan goal dinilai. Default dimulai tanggal 1; tanggal mulai dapat disesuaikan mengikuti tanggal gajian. Berlaku global untuk satu Budget plan.
_Avoid_: month, bulan kalender

**Budget plan**:
Rencana bulanan global (satu per aplikasi) yang menyatukan item Pendapatan, fixed expense, kontribusi goal, dan alokasi menjadi alokasi tabungan. Tidak terikat per wallet; wallet hanya tempat uang disimpan. Satu Budget plan aktif per Budget period. Setiap angka uang di plan hanyalah target (rencana, ditulis manual) atau turunan transaksi (realita) — tidak ada angka ketiga; angka realita selalu konsisten dengan saldo wallet karena keduanya dihitung dari tabel transaksi yang sama.
_Avoid_: budget (sebagai istilah rencana), per-wallet plan

**Pendapatan**:
Item Budget plan yang terikat satu kategori income; nominal = target pendapatan periode ini. Realisasi = total transaksi income kategori tersebut dalam periode aktif. Tombol "Catat" di item membuat transaksi income (pilih wallet), sehingga rencana dan saldo lahir dari catatan yang sama. Item pendapatan bisa lebih dari satu (gaji, freelance, dll).
_Avoid_: pemasukan, target pendapatan tunggal

**Spare budget**:
Sisa pendapatan setelah fixed expense dan kontribusi goal dalam satu Budget plan. Menjadi dasar saran AI dan fallback deterministik.
_Avoid_: sisa uang, disposable income

**Fixed expense**:
Pengeluaran berulang yang direncanakan, terikat pada satu kategori expense, berperilaku seperti alokasi: progress terisi dari transaksi expense kategori tersebut. Tidak ada transaksi otomatis; pembayaran lewat transaksi biasa atau tombol "Bayar" di layar Rencana yang membuat transaksi (bisa sebagian).
_Avoid_: recurring expense, biaya bulanan, auto-payment

**Alokasi**:
Budget spending fleksibel (Makan, Transport, Hiburan) yang terikat pada satu kategori expense; perilaku sama dengan Fixed expense — progress terisi dari transaksi kategori. Bisa dihapus/arsip.
_Avoid_: budget item, spending plan

**Goal**:
Target menabung pengguna (misal dana nikah, umroh, beli motor) dengan target biaya, jangka waktu opsional, dan wallet tabungan sendiri (wallet goal). Menabung = transaksi transfer ke wallet goal; progress goal = saldo wallet goal (bisa diisi lewat saldo awal wallet goal). Penarikan untuk keadaan darurat = transaksi keluar dari wallet goal (progress turun; app menampilkan konfirmasi, tidak memblokir). Saat saldo wallet goal ≥ target, ditandai "Tercapai" dan berhenti dihitung dalam spare budget. Dapat di-archive.
_Avoid_: saving target, target

**Category**:
Klasifikasi transaksi dengan tipe (income/expense/transfer) dan ikon. Kategori income dan expense di-seed lalu dapat disesuaikan (create/update/delete); transfer memakai satu kategori tunggal global. Income berwarna success, expense berwarna error, transfer berwarna warning. Kategori yang sudah dipakai transaksi di-archive, bukan dihapus.
_Avoid_: tag, label

**AI service**:
Satu layanan AI (Groq) dengan dua fungsi: saran budget (model `gpt-oss-20b`, output JSON terstruktur) dan insight report (model `gpt-oss-120b`, teks Bahasa Indonesia). Dipicu manual oleh pengguna, read-only, satu-shot untuk MVP. Saran budget berupa daftar saran terstruktur, tiap item punya tombol "Terapkan" yang mengubah Budget plan (eksekusi oleh pengguna, bukan AI). Saat AI tidak tersedia, memakai fallback deterministik lokal.
_Avoid_: AI automation, bot

**Net saving**:
Pendapatan dikurangi expense dan transfer keluar, ditambah transfer masuk, dalam satu Budget period. Menjadi dasar line chart report. Jika negatif, disebut **Defisit** (ditampilkan merah).
_Avoid_: saving, tabungan bersih

**Saldo tersedia**:
Total saldo seluruh wallet saat ini (turunan tabel transaksi, lintas periode). Di layar Rencana dipecah menjadi **Tersedia bebas** (total saldo − saldo wallet goal) dan **Terikat goal**. Berbeda dari spare budget: spare adalah angka rencana, saldo tersedia adalah realita.
_Avoid_: available balance, saldo periode

**Currency**:
Pengaturan tampilan global (default IDR) yang mengganti simbol/satuan mata uang; mendukung pilihan mata uang lain. Tidak ada konversi nilai. Satu mata uang untuk semua wallet.
_Avoid_: mata uang per wallet, conversion

**Backup**:
Ekspor seluruh data pengguna (wallet, transaksi, kategori, goal, pengaturan) ke file JSON secara manual, lalu dapat di-share/export via share sheet; restore dari file yang sama.
_Avoid_: sync, cloud

**Archive**:
Menonaktifkan entitas (kategori, wallet, goal) yang sudah dipakai dari pilihan aktif tanpa menghapus datanya; transaksi lama tetap valid.
_Avoid_: delete, hapus permanen

**Over budget**:
Status item Budget plan saat pengeluaran melebihi alokasinya; progress > 100% dan ditandai.
_Avoid_: overspend
