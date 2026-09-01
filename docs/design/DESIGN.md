# Spen — DESIGN.md (Brand Contract Visual)

Dokumen ini adalah **kontrak visual** Spen: prinsip, bahasa visual, dan aturan komponen yang harus diikuti semua layar (React Native build). Nilai teknis (token) ada di `docs/design/design-tokens.md`; dokumen ini menjelaskan **bagaimana** memakainya. Domain glossary: `CONTEXT.md`.

---

## 1. Prinsip Visual

1. **Calm finance** — aplikasi harus terasa tenang, teratur, tidak menegangkan. Pengguna datang untuk mengelola uang, bukan ditekan. Hindari merah pekat menyala di luar konteks semantik, hindari kontras tinggi yang agresif.
2. **Angka adalah raja** — nominal uang adalah elemen terpenting di hampir semua layar. Tampilkan besar, jelas, mudah dibaca, dengan format angka Indonesia (`Rp 2.500.000`), `id-ID`, tanpa desimal.
3. **Semantic colors** — income = positif/sukses, expense = negatif/error, transfer = netral/warning. Warna dipakai konsisten di seluruh app: nominal, ikon kategori, progress, status.
4. **Satu brand color** — `pine` (`#235B50` light / `#83B5A5` dark) adalah warna utama: aksi, elemen aktif, progress, teks penting. Warna lain hanya sebagai aksen semantik/status.
5. **Light & dark** — seluruh layar mendukung dua tema dengan token yang sama; kontras dan peran warna tidak berubah antar tema, hanya nilai hex-nya.
6. **Mobile-first** — desain untuk layar sempit (max-width 430px); komponen pakai spacing/radius/shadow standar React Native; perhatikan safe area (notch, home indicator).

---

## 2. Warna

### Peran

| Peran | Token | Penggunaan |
|---|---|---|
| Brand/aksi | `pine` | Tombol primary, tab aktif, FAB +, progress, teks penting, border fokus |
| Positif | `income` | Nominal masuk, ikon kategori income |
| Negatif | `expense` | Nominal keluar, ikon kategori expense, over-budget, defisit, tombol arsip |
| Netral | `gold` | Transfer, ikon kategori transfer, aksen goal |
| Teks | `ink` / `muted` | Utama / sekunder (label, caption, placeholder) |
| Surface | `paper` / `card` / `mint` | Background app / kartu / aksen lembut (ikon, chip terpilih) |
| Garis | `line` | Border, divider |

### Aturan pakai

- **Jangan** pakai `expense` (merah) untuk elemen non-negatif; jangan pakai `income` (hijau) untuk elemen non-positif.
- **Transfer selalu `gold`** — konsisten di list transaksi, ikon, nominal.
- **Over-budget** (progress > 100%): progress bar merah (`expense`), label teks "Melebihi Budget" merah.
- **Defisit** (net saving negatif): teks merah + kata "Defisit".
- **Goal tercapai**: tanda "Tercapai" hijau (`income`), progress penuh.

### Hero surface

Balance card (Beranda) dan available hero (Rencana) memakai surface gelap `pine-2` dengan teks terang — ini elemen paling menonjol di layar, jadi angka di dalamnya tampil terbesar.

---

## 3. Tipografi

Tiga font dengan peran jelas (lihat token untuk ukuran/berat):

| Font | Peran |
|---|---|
| **Nunito Sans** | Seluruh UI: label, tombol, body, input |
| **Fraunces** | Judul (h1/h2) dan **angka besar** (saldo, spare budget, nominal hero) — serif hangat yang menenangkan |
| **DM Mono** | **Angka kecil & label teknis**: nominal item, stat, eyebrow label, tanggal periode — monospace menegaskan "ini data" |

Aturan:

- **Angka besar selalu Fraunces** (`-0.04em`), angka kecil selalu DM Mono (`-0.06em` s.d. `-0.08em`).
- **Eyebrow label** (kecil, uppercase, spasi lebar, muted): `SPEN, RUANG UNTUK UANGMU`, `SPARE BUDGET`, `SALDO TERSEDIA` — dipakai sebagai label seksi yang elegan.
- Judul dengan aksen em (`<em>`): kata kunci diberi warna `pine` dan italic, mis. "Rencana yang lebih *lega*."
- Angka uang: format `id-ID`, tanpa desimal (`Rp 6.500.000`), tanda `+`/`−` untuk masuk/keluar, `↔` untuk transfer.

---

## 4. Komponen

### Kartu

- **Balance card / available hero**: surface gelap `pine-2`, radius `26px`, shadow lembut `0 12px 28px #1E4A4222`, padding `21px`. Angka utama `32px` (Beranda) / `30px` (Rencana).
- **Plan snapshot** (Beranda): kartu terang, radius `21px`, progress + mini stats (Pendapatan vs Terpakai).
- **Chart card** (Report): kartu terang, radius `22px`, padding `17px`.
- **Wallet card**: `119×107px` horizontal scroll, radius `18px`, border tint per wallet (pine/coral/gold/goal), nama di atas + nominal DM Mono di bawah. Kartu "+ Tambah Wallet" dashed border.
- **Setting group**: kartu berisi row-row, radius `19px`, divider antar row.

### Progress bar

- Tinggi `5px`, radius `9px`, background `--line`.
- Warna: `pine` (normal), `expense` (over-budget >100%), `income` (pendapatan/goal tercapai), `gold` (goal).
- Di bawah progress: mini stats / label status.

### Tombol

- **Primary**: `pine`, teks putih, radius `15px`, padding `15px 17px`, full-width di form; panah `→` di kanan.
- **Quiet action / link**: transparan, teks `pine`, bold, ukuran `11–12px` ("Lihat Rencana", "Catat →", "Bayar →", "Tambah").
- **AI button**: pill `radius 99px`, border `#B8D3C8`, background `mint`, teks `pine` bold, ikon `✦` — muncul di header Rencana ("✦ AI Suggestion") dan CTA Report ("✦ Tanya insight").
- **FAB +**: tengah tab bar, `48–58px`, `pine`, radius `17–20px`, `margin-top: -22px`, shadow `0 5px 15px #235B5066`.

### Tab bar

- 5 slot: `Beranda | Rencana | [+] | Report | Settings`.
- Ikon glyph `19px`, label `9px`; tab aktif `pine` bold, non-aktif `muted`.
- Background: blur 15px, surface 94% opacity; border-top `line`; safe area bottom.
- **+** tengah menonjol (diangkat) — aksi utama app.

### Sheet & modal

- **Bottom sheet**: overlay `#10251D66`, sheet radius `27px` atas, grab handle `35×4px`, animasi naik `.25s ease-out`, max-height `86vh`.
- **Full-screen modal**: untuk form keyboard-heavy (transaksi, wallet) — background `--bg`, header `65px` dengan tombol tutup `×`, judul, dan aksi "Simpan".
- **Detail wallet sheet**: wallet besar (ikon inisial 48px), nominal besar, lalu daftar aksi (Koreksi saldo, Edit Wallet, Arsipkan Wallet — yang terakhir merah).

### Form

- Label: DM Mono `10px` uppercase, muted; input: border-bottom saja (underline), teks `16px` Nunito Sans, fokus tanpa outline.
- **Type tabs** (income/expense/transfer): tab bar dengan underline 2px warna sesuai tipe (income hijau, expense merah, transfer `pine`/netral). Label: "Masuk", "Keluar", "Transfer".
- **Amount input**: Fraunces `29px` — angka adalah raja di form juga.
- **Category picker**: grid 3 kolom, ikon di atas + nama; terpilih = border & background `mint`/`pine`. Tombol "Kelola kategori" membuka editor inline (nama + icon library 5 kolom + Simpan/Arsipkan).
- **Soft warning** (over-budget saat input): kotak kecil `#FAEDE7` teks `#9F463D`, pesan tenang: "Perlahan ya — ini akan melebihi alokasi …, tetapi tetap bisa dicatat."
- **Form note**: teks muted kecil di bawah header form, mis. "Wallet adalah tempat uangmu disimpan."

### Chips (filter riwayat)

- Pill `radius 99px`, border `line`, background `surface`, teks `10px`; terpilih = `pine` background, teks putih.
- Scroll horizontal; jika > 4 chip → ciutkan jadi satu tombol "Filter".

### List transaksi (TxRow)

- Layout: ikon kategori (`35px`, radius `12px`, bg tint sesuai tipe) → nama kategori + detail (wallet · catatan, atau "Tunai → BCA" untuk transfer) → nominal (warna tipe) + jam.
- Nominal: `+ Rp 6.500.000` (income, hijau), `− Rp 45.000` (expense, merah), `↔ Rp 500.000` (transfer, gold).

### Chart

- **Pie chart**: donut (conic-gradient), center label total + "total keluar"; legend list per kategori (dot warna, nama, persen) — tap baris → drill-down.
- **Line chart**: SVG, warna `pine`, area fill opacity `.1`, label bulan di bawah; header "3 bulan ⌄" untuk ubah rentang.

### Empty state

- Ikon besar lembut (glyph), judul singkat ("Belum ada catatan"), deskripsi ("Tidak ada transaksi pada 31 Agustus."), tombol primary CTA ("Tambah transaksi").

---

## 5. States

| State | Visual |
|---|---|
| **Loading AI** | Sheet dengan glyph `✦` berdenyut (pulse 1s), judul "Membaca pola keuanganmu…" / "Menghubungkan titik-titik…" + subtext muted |
| **Empty** | Ikon besar lembut + judul + deskripsi + CTA primary (lihat komponen) |
| **Over-budget** | Progress merah + label "Melebihi Budget" (danger); soft warning saat input transaksi |
| **Defisit** | Net saving negatif: angka merah + kata "Defisit" |
| **Goal tercapai** | Tanda "Tercapai" hijau; progress penuh; goal berhenti dihitung di spare |
| **Error / toast** | Toast kecil bottom (di atas tab bar): background `--text`, teks `--bg`, radius `12px`, ikon `✓`, tombol `×` |
| **Status bayar (fixed expense)** | "Lunas ✓" (hijau), "x/y dibayar", "Belum dibayar" (muted) |

---

## 6. Dark Mode

- Seluruh warna bertukar via token; **peran tidak berubah** (income tetap hijau, expense tetap merah, dst.) — hanya nilai hex yang menyesuaikan (lihat `design-tokens.md`).
- Dark palette: background `#12231F`, surface `#19312C`, teks `#EEF5EE`, muted `#A6B5AE`, line `#29443D`, pine terang `#83B5A5`, mint `#20453B`.
- Hero surface di dark: `#20453B` (sama dengan mint), teks `#E7F3ED`.
- Spare budget card dark: background `#20453B`, teks `#E7F3ED`.
- Transisi tema: `.3s` background.

---

## 7. Bahasa & Nada

- Seluruh UI dan output AI dalam **Bahasa Indonesia**, santai namun tenang ("Membaca pola keuanganmu…", "Perlahan ya…", "Mengerti" sebagai tombol tutup insight).
- Gunakan istilah domain dari `CONTEXT.md` secara konsisten: **Wallet, Budget plan, Budget period, Fixed expense, Goal, Spare budget, Net saving, Saldo tersedia, Transaksi penyesuaian, Alokasi, Transfer** — jangan pakai sinonim yang di-avoid (account, budget item, dll.).
- Nada AI suggestion/insight: ringkas, jelas, actionable, tanpa menghakimi.

---

## 8. Referensi

- Token nilai: `docs/design/design-tokens.md`
- Produk & UX: `docs/design-brief.md`
- Domain: `CONTEXT.md`
- Prototype acuan: `design-figma-make/` (sumber kebenaran visual saat ini)
