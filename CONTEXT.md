# Spen

Spen adalah aplikasi budget planner mobile dengan English sebagai bahasa default dan Bahasa Indonesia sebagai bahasa alternatif, dengan fitur AI (Expo + local DB). Single context; bukan monorepo.

## Language

**Bahasa aplikasi (Locale)**:
Spen mendukung Bahasa Indonesia dan English. Pengguna memilih bahasa secara manual dari Pengaturan; default awal adalah English. Pilihan locale berlaku langsung ke seluruh user-facing content: UI, accessibility label, pesan status dan error, FAQ, dokumen publik, metadata web, serta output AI. Locale tersimpan sebagai pengaturan lokal dan ikut backup/restore, serta mengubah format tanggal dan angka tampilan; currency tetap pilihan global tanpa konversi nilai. Nama Dompet, Kategori, Tabungan, dan catatan transaksi yang ditulis pengguna tidak diterjemahkan. Istilah domain `Dompet`, `Rencana Anggaran`, `Tabungan`, `Kategori`, dan `Transfer` tetap dipertahankan.

Kategori sistem seperti Saldo Awal, Penyesuaian Saldo, Transfer, dan kategori bawaan lain memiliki identitas stabil dan dapat memakai label tampilan yang dilokalkan; kategori buatan pengguna selalu mempertahankan nama yang ditulis pengguna. Identitas kategori bawaan disimpan sebagai `systemKey`; jika pengguna mengganti nama kategori bawaan, `systemKey` dihapus dan nama baru menjadi user-generated content yang tidak diterjemahkan. Di native, locale berasal dari Pengaturan; di web, prioritas locale adalah URL, lalu preferensi browser, lalu English sebagai default. Pesan error domain tidak menjadi copy UI tetap: UI menerjemahkannya dari error terstruktur berdasarkan locale; error tanpa code yang dikenal memakai pesan generik terlokalisasi dan detail teknis hanya untuk debugging.

Saat locale berubah, UI yang sedang tampil ikut berubah secara langsung. Hasil AI yang sudah dibuat tidak diterjemahkan atau dibuat ulang otomatis; pengguna menjalankan ulang fitur AI untuk menghasilkan output dalam locale baru. Restore backup langsung menerapkan locale dari backup setelah berhasil.

Terms & Conditions dan Privacy Policy memiliki isi lengkap dalam kedua bahasa. Versi English tetap perlu ditinjau pemilik sebelum dipakai sebagai dokumen legal final.

**Dompet**:
Tempat uang pengguna disimpan, diberi nama bebas (misal "Tunai", "BCA", "GoPay"); tidak memiliki tipe. Aplikasi ini multi-dompet — pengguna dapat memiliki banyak Dompet, dan uang dapat dipindahkan antar Dompet. Dompet adalah tempat penyimpanan; tidak memiliki Rencana Anggaran sendiri. Setiap mutasi saldo Dompet, termasuk saldo awal saat creation, selalu menjadi transaksi ledger: saldo bertambah memakai tipe income dan saldo berkurang memakai tipe expense. Dompet dapat diberi flag tabungan untuk dipasangkan ke Tabungan (dompet tabungan). Dompet yang sudah dipakai (punya transaksi) tidak bisa dihapus, hanya di-archive.
_Avoid_: account, akun, rekening

**Saldo awal**:
Transaksi ledger otomatis saat Dompet dibuat dengan saldo awal non-zero. Memakai kategori khusus "Saldo Awal" dan tipe income saat saldo bertambah, expense saat saldo berkurang. Berbeda dari koreksi saldo manual.
_Avoid_: opening balance manual

**Transfer**:
Pemindahan uang antar Dompet. Netral terhadap total kekayaan pengguna; tidak muncul di pie chart report dan tidak mempengaruhi net saving, tapi tetap muncul di riwayat transaksi. Memakai satu kategori tunggal global.
_Avoid_: transaction (umum), pindah dana

**Transaksi penyesuaian**:
Transaksi kategori khusus "Penyesuaian Saldo" yang dibuat otomatis saat saldo Dompet dikoreksi langsung di UI (balance correction), menjaga invariant saldo diturunkan dari ledger. Tipe transaksinya income saat saldo bertambah dan expense saat saldo berkurang. Muncul di riwayat dan otomatis masuk ke Pendapatan/Pengeluaran Plan sesuai tipenya.
_Avoid_: edit saldo tanpa jejak, balance correction manual

**Periode Anggaran**:
Rentang waktu berdurasi satu bulan tempat pendapatan, pengeluaran, dan tabungan dinilai. Pengguna dapat memilih hari mulai bulanan apa pun dari tanggal 1 sampai 31; jika tanggal itu tidak ada pada bulan tertentu, awal periode memakai hari terakhir bulan tersebut, lalu kembali ke tanggal pilihan ketika tersedia. Tanggal akhir selalu sehari sebelum awal periode berikutnya. Berlaku global untuk satu Rencana Anggaran. Periode yang sudah selesai tetap menjadi histori ketika hari mulai diubah; periode aktif yang belum selesai boleh direbase, periode lamanya tetap tersimpan, dan periode baru memakai Rencana Anggaran kosong. Tumpang tindih hanya dapat terjadi saat anchor diubah di tengah periode.
_Avoid_: month, bulan kalender

**Tanggal Transaksi**:
Tanggal saat transaksi terjadi dan bagian wajib dari setiap Transaksi. Transaksi yang dibuat pengguna memakai tanggal lokal hari ini sebagai nilai awal dan dapat diubah ke tanggal sebelumnya; tanggal masa depan tidak digunakan. Transaksi yang dibuat dari Plan dibatasi pada rentang periode aktif sampai hari ini. Saat Transaksi diedit, tanggal lamanya tetap dipertahankan sampai pengguna mengubahnya; perubahan tanggal dapat memindahkan Transaksi keluar dari periode dan agregasi sebelumnya.
_Avoid_: transaction date yang tidak jelas konteksnya

**Rencana Anggaran**:
Rencana bulanan global (satu per aplikasi) yang menyatukan item Pendapatan, Pengeluaran, dan Tabungan. Tidak terikat per dompet; Dompet dipilih saat item Pendapatan dibuat agar nominalnya langsung dicatat sebagai transaksi income pada Dompet tersebut. Satu Rencana Anggaran aktif per Periode Anggaran. Setiap angka uang di plan hanyalah target (rencana, ditulis manual) atau turunan transaksi (realita) — tidak ada angka ketiga; angka realita selalu konsisten dengan saldo Dompet karena keduanya dihitung dari tabel transaksi yang sama.
_Avoid_: budget (sebagai istilah rencana), per-dompet plan

**Pendapatan**:
Item Rencana Anggaran yang terikat satu kategori income dan memiliki nominal rencana periode. Saat dibuat, pengguna memilih Dompet dan nominalnya langsung menjadi transaksi income pada Dompet tersebut; item dianggap terpenuhi 100% tanpa progress bar. Realisasi tetap diturunkan dari total transaksi income kategori tersebut dalam periode aktif. Seluruh transaksi income, termasuk Saldo Awal dan Penyesuaian Saldo, muncul otomatis berdasarkan kategori.
_Avoid_: pendapatan, target pendapatan tunggal

**Sisa anggaran**:
Sisa Pendapatan aktual setelah target Pengeluaran dalam satu Rencana Anggaran. Pendapatan aktual diturunkan dari transaksi income pada Periode Anggaran aktif. Tabungan tidak mengurangi Sisa anggaran: Tabungan hanya menandai Dompet yang sudah ada sebagai Dompet tabungan dan tidak membuat transaksi saat dibuat atau diisi. Menjadi dasar saran AI dan fallback deterministik.
_Avoid_: sisa uang, disposable income

**Pengeluaran (item Plan)**:
Target pengeluaran yang terikat pada satu kategori expense; progress = total transaksi expense kategori tersebut ÷ target dalam Periode Anggaran. Tombol "Bayar" membuka form transaksi expense dengan sisa target sebagai nominal awal, yang bisa diganti untuk pembayaran sebagian atau penuh. Expense kategori baru otomatis menjadi item Pengeluaran dengan target awal sama dengan realisasi (100%); Edit dapat menaikkan target dan menghitung ulang progress.
_Avoid_: recurring expense, biaya bulanan, auto-payment

Fixed expense dan Alokasi adalah istilah legacy. Keduanya dimigrasikan dan ditampilkan sebagai Pengeluaran tanpa membedakan tipe.
_Avoid_: budget item, spending plan

**Tabungan**:
Target menabung pengguna (misal dana nikah, umroh, beli motor) dengan target biaya, jangka waktu opsional, dan satu Dompet tabungan yang sudah ada. Menjadikan Dompet sebagai Dompet Tabungan hanya memberi penanda; saldo Dompet dan transaksi tidak berubah. Progress Tabungan = saldo Dompet Tabungan (bisa berasal dari saldo awal atau transaksi yang memang terjadi di Dompet tersebut). Penarikan untuk keadaan darurat = transaksi keluar dari Dompet Tabungan (progress turun; app menampilkan konfirmasi, tidak memblokir). Saat saldo Dompet Tabungan ≥ target, ditandai "Tercapai". Tabungan dan kontribusi bulanannya tidak mengurangi Sisa anggaran. Dapat di-archive.
_Avoid_: saving target, target

**Kategori**:
Klasifikasi transaksi dengan tipe (income/expense/transfer) dan ikon. Kategori income dan expense di-seed lalu dapat disesuaikan (create/update/delete); transfer memakai satu kategori tunggal global. Income berwarna success, expense berwarna error, transfer berwarna warning. Kategori yang sudah dipakai transaksi di-archive, bukan dihapus.
Kategori bawaan memiliki identitas sistem yang stabil agar label tampilannya dapat dilokalkan. Setelah nama kategori bawaan diedit pengguna, nama tersebut diperlakukan sebagai nama custom dan tidak diterjemahkan.
_Avoid_: tag, label

**AI service**:
Satu layanan AI (Groq) dengan dua fungsi: saran budget (model `gpt-oss-20b`, output JSON terstruktur) dan insight report (model `gpt-oss-120b`, mengikuti locale aktif). Dipicu manual oleh pengguna, read-only, satu-shot untuk MVP. Saran budget berupa daftar saran terstruktur, tiap item punya tombol "Terapkan" yang mengubah Rencana Anggaran (eksekusi oleh pengguna, bukan AI). Saat AI tidak tersedia, memakai fallback deterministik lokal dalam locale aktif.
_Avoid_: AI automation, bot

**Tabungan bersih**:
Pendapatan dikurangi expense dan transfer keluar, ditambah transfer masuk, dalam satu Periode Anggaran. Menjadi dasar line chart report. Jika negatif, disebut **Defisit** (ditampilkan merah).
_Avoid_: saving, tabungan bersih

**Laporan Periode**:
Ringkasan Pendapatan, Pengeluaran, Tabungan bersih, dan rincian kategori untuk satu Periode Anggaran yang sudah tercatat. Pengguna dapat berpindah ke periode sebelumnya atau kembali ke periode yang lebih baru; rentang chart dan insight mengikuti periode yang sedang dilihat. Periode yang sudah selesai bersifat read-only terhadap aturan tanggal mulai, sedangkan periode aktif dapat direbase.
_Avoid_: report bulanan, laporan bulan kalender

**Saldo tersedia**:
Total saldo seluruh dompet saat ini (turunan tabel transaksi, lintas periode). Tidak diulang di kartu Sisa anggaran Rencana. Berbeda dari Sisa anggaran: Spare memakai Pendapatan aktual dan target Pengeluaran pada Periode Anggaran, Saldo tersedia adalah realita lintas periode.
_Avoid_: available balance, saldo periode

**Currency**:
Pengaturan tampilan global (default IDR) yang mengganti simbol/satuan mata uang; mendukung pilihan mata uang lain. Tidak ada konversi nilai. Satu mata uang untuk semua dompet.
_Avoid_: mata uang per dompet, conversion

**Backup**:
Ekspor seluruh data pengguna (dompet, transaksi, kategori, tabungan, pengaturan) ke file JSON secara manual, lalu dapat di-share/export via share sheet; restore dari file yang sama.
_Avoid_: sync, cloud

**Archive**:
Menonaktifkan entitas (kategori, dompet, tabungan) yang sudah dipakai dari pilihan aktif tanpa menghapus datanya; transaksi lama tetap valid.
_Avoid_: delete, hapus permanen

**Melebihi anggaran**:
Status item Rencana Anggaran saat pengeluaran melebihi alokasinya; progress > 100% dan ditandai (merah, label "Melebihi Anggaran").
_Avoid_: overspend

**Defisit**:
Nama untuk Tabungan bersih negatif dalam satu Periode Anggaran; ditampilkan merah di report dan ringkasan. Bukan error — status informatif.
_Avoid_: minus, rugi

**Progress Pengeluaran**:
Realisasi item Pengeluaran dalam periode aktif dibagi targetnya; dapat melebihi target dan ditandai "Melebihi Anggaran". Pendapatan tidak menggunakan progress.

**Pembayaran Pengeluaran**:
Item Pengeluaran memiliki toggle "Sudah dibayar". Saat diaktifkan, aplikasi langsung membuat satu transaksi expense sebesar target item menggunakan Dompet aktif dengan saldo terbesar; saat belum diaktifkan, tidak ada transaksi pembayaran otomatis. Tanggal transaksi memakai tanggal saat toggle dilakukan.
_Avoid_: paid/unpaid, status transaksi

**Realisasi (item plan)**:
Nilai turunan transaksi pada item Rencana Anggaran (Pendapatan: total transaksi income kategori; Pengeluaran: total transaksi expense kategori) dalam periode aktif. Untuk Pendapatan, nominal rencana diwujudkan menjadi transaksi income saat item dibuat; untuk Pengeluaran, realisasi dibandingkan dengan target. Realisasi tidak pernah disimpan sebagai angka ketiga (lihat ADR-0004).
_Avoid_: actual, realisasi manual

**Kategori transfer (global)**:
Satu kategori tunggal bertipe transfer yang dipakai semua transaksi Transfer; tidak dapat dipilih user, otomatis. Berwarna warning.
_Avoid_: kategori per transfer, kategori bebas

**Koreksi saldo**:
Aksi pengguna di detail dompet untuk menyamakan saldo catatan dengan saldo riil; selalu menghasilkan transaksi penyesuaian (kategori "Penyesuaian Saldo"). Lihat **Transaksi penyesuaian**.
_Avoid_: edit saldo, set saldo manual

**Pengingat**:
Pesan terjadwal yang dipilih pengguna untuk membantu mencatat Transaksi, meninjau Periode Anggaran, atau memantau tanggal target Tabungan; Pengingat tidak menjalankan aksi keuangan.
_Avoid_: notifikasi otomatis, auto-payment

**Peringatan**:
Feedback langsung di dalam aplikasi tentang kondisi Transaksi atau Rencana Anggaran, seperti transaksi yang membuat Pengeluaran melebihi anggaran; Peringatan tidak menghalangi pencatatan.
_Avoid_: alert agresif, blokir transaksi
