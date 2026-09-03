# Spen

Spen adalah aplikasi budget planner mobile berbahasa Indonesia dengan fitur AI (Expo + local DB). UI dan seluruh output AI dalam Bahasa Indonesia. Single context; bukan monorepo.

## Language

**Wallet**:
Tempat uang pengguna disimpan, diberi nama bebas (misal "Tunai", "BCA", "GoPay"); tidak memiliki tipe. Aplikasi ini multi-wallet — pengguna dapat memiliki banyak Wallet, dan uang dapat dipindahkan antar Wallet. Wallet adalah tempat penyimpanan; tidak memiliki Budget plan sendiri. Setiap mutasi saldo Wallet, termasuk saldo awal saat creation, selalu menjadi transaksi ledger: saldo bertambah memakai tipe income dan saldo berkurang memakai tipe expense. Wallet dapat diberi flag tabungan untuk dipasangkan ke Goal (wallet goal). Wallet yang sudah dipakai (punya transaksi) tidak bisa dihapus, hanya di-archive.
_Avoid_: account, akun, rekening

**Saldo awal**:
Transaksi ledger otomatis saat Wallet dibuat dengan saldo awal non-zero. Memakai kategori khusus "Saldo Awal" dan tipe income saat saldo bertambah, expense saat saldo berkurang. Berbeda dari koreksi saldo manual.
_Avoid_: opening balance manual

**Transfer**:
Pemindahan uang antar Wallet. Netral terhadap total kekayaan pengguna; tidak muncul di pie chart report dan tidak mempengaruhi net saving, tapi tetap muncul di riwayat transaksi. Memakai satu kategori tunggal global.
_Avoid_: transaction (umum), pindah dana

**Transaksi penyesuaian**:
Transaksi kategori khusus "Penyesuaian Saldo" yang dibuat otomatis saat saldo Wallet dikoreksi langsung di UI (balance correction), menjaga invariant saldo diturunkan dari ledger. Tipe transaksinya income saat saldo bertambah dan expense saat saldo berkurang. Muncul di riwayat dan otomatis masuk ke Pendapatan/Pengeluaran Plan sesuai tipenya.
_Avoid_: edit saldo tanpa jejak, balance correction manual

**Budget period**:
Rentang waktu berdurasi satu bulan tempat pendapatan, pengeluaran, dan goal dinilai. Default dimulai tanggal 1; tanggal mulai dapat disesuaikan mengikuti tanggal gajian. Berlaku global untuk satu Budget plan.
_Avoid_: month, bulan kalender

**Budget plan**:
Rencana bulanan global (satu per aplikasi) yang menyatukan item Pendapatan, Pengeluaran, dan kontribusi goal. Tidak terikat per wallet; wallet hanya tempat uang disimpan. Satu Budget plan aktif per Budget period. Setiap angka uang di plan hanyalah target (rencana, ditulis manual) atau turunan transaksi (realita) — tidak ada angka ketiga; angka realita selalu konsisten dengan saldo wallet karena keduanya dihitung dari tabel transaksi yang sama.
_Avoid_: budget (sebagai istilah rencana), per-wallet plan

**Pendapatan**:
Item Budget plan yang terikat satu kategori income. Nominal yang ditampilkan selalu total transaksi income kategori tersebut dalam periode aktif; Pendapatan tidak memiliki progress target. Seluruh transaksi income, termasuk Saldo Awal dan Penyesuaian Saldo, muncul otomatis berdasarkan kategori.
_Avoid_: pemasukan, target pendapatan tunggal

**Spare budget**:
Sisa pendapatan setelah target Pengeluaran dan kontribusi goal dalam satu Budget plan. Menjadi dasar saran AI dan fallback deterministik.
_Avoid_: sisa uang, disposable income

**Pengeluaran (item Plan)**:
Target pengeluaran yang terikat pada satu kategori expense; progress = total transaksi expense kategori tersebut ÷ target dalam Budget period. Tombol "Bayar" membuka form transaksi expense dengan sisa target sebagai nominal awal, yang bisa diganti untuk pembayaran sebagian atau penuh. Expense kategori baru otomatis menjadi item Pengeluaran dengan target awal sama dengan realisasi (100%); Edit dapat menaikkan target dan menghitung ulang progress.
_Avoid_: recurring expense, biaya bulanan, auto-payment

Fixed expense dan Alokasi adalah istilah legacy. Keduanya dimigrasikan dan ditampilkan sebagai Pengeluaran tanpa membedakan tipe.
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
Status item Budget plan saat pengeluaran melebihi alokasinya; progress > 100% dan ditandai (merah, label "Melebihi Budget").
_Avoid_: overspend

**Defisit**:
Nama untuk Net saving negatif dalam satu Budget period; ditampilkan merah di report dan ringkasan. Bukan error — status informatif.
_Avoid_: minus, rugi

**Progress Pengeluaran**:
Realisasi item Pengeluaran dalam periode aktif dibagi targetnya; dapat melebihi target dan ditandai "Melebihi Budget". Pendapatan tidak menggunakan progress.

**Pembayaran Pengeluaran**:
Item Pengeluaran memiliki toggle "Sudah dibayar". Saat diaktifkan, aplikasi langsung membuat satu transaksi expense sebesar target item menggunakan Wallet aktif dengan saldo terbesar; saat belum diaktifkan, tidak ada transaksi pembayaran otomatis. Tanggal transaksi memakai tanggal saat toggle dilakukan.
_Avoid_: paid/unpaid, status transaksi

**Realisasi (item plan)**:
Nilai turunan transaksi pada item Budget plan (Pendapatan: total transaksi income kategori; Pengeluaran: total transaksi expense kategori) dalam periode aktif. Kebalikan dari target (angka manual); tidak pernah disimpan sebagai angka ketiga (lihat ADR-0004).
_Avoid_: actual, realisasi manual

**Kategori transfer (global)**:
Satu kategori tunggal bertipe transfer yang dipakai semua transaksi Transfer; tidak dapat dipilih user, otomatis. Berwarna warning.
_Avoid_: kategori per transfer, kategori bebas

**Koreksi saldo**:
Aksi pengguna di detail wallet untuk menyamakan saldo catatan dengan saldo riil; selalu menghasilkan transaksi penyesuaian (kategori "Penyesuaian Saldo"). Lihat **Transaksi penyesuaian**.
_Avoid_: edit saldo, set saldo manual
