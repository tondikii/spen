# Spen — Design Tokens

Slot token & peran. File ini untuk developer (React Native) dan design agent; `DESIGN.md` menjelaskan cara pakainya.

## Color

### Core palette (semantik)

| Token       | Light                                 | Dark                                                  | Peran                                                  |
| ----------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| `--pine`    | `#235B50`                             | `#83B5A5`                                             | Brand utama; aksi, tab aktif, progress, teks penting   |
| `--pine-2`  | `#17483F`                             | (dark memakai `#20453B` untuk surface gelap)          | Surface hero (balance card, available hero)            |
| `--mint`    | `#DCE5EC` → `#DCE5EC` (lihat catatan) | `#20453B`                                             | Surface pendukung/ikon aktif; background chip terpilih |
| `--paper`   | `#F6F5F0`                             | `#12231F`                                             | Background utama app                                   |
| `--card`    | `#FFFEFA`                             | `#19312C`                                             | Surface kartu                                          |
| `--ink`     | `#213431`                             | `#EEF5EE`                                             | Teks utama                                             |
| `--muted`   | `#7B8882`                             | `#A6B5AE`                                             | Teks sekunder/label                                    |
| `--line`    | `#E3E4DD`                             | `#29443D`                                             | Garis pemisah/border                                   |
| `--income`  | `#238B65`                             | (dark memakai `#83B5A5` untuk pine; income konsisten) | Positif/sukses                                         |
| `--expense` | `#C85C55`                             | (dark konsisten)                                      | Negatif/error                                          |
| `--gold`    | `#BD8A30`                             | (dark konsisten)                                      | Transfer/warning, aksen goal                           |
| `--coral`   | `#DC8C7C`                             | (dark konsisten)                                      | Aksen wallet card                                      |

Catatan: `--mint` di light theme adalah `#DCE5EC` (salah ejaan nama di CSS, nilai tetap konsisten). Di dark theme, `--mint` = `#20453B`.

### Semantic color per tipe transaksi

| Tipe     | Warna                   | Penggunaan                                                    |
| -------- | ----------------------- | ------------------------------------------------------------- |
| income   | `--income` (`#238B65`)  | Teks nominal masuk, ikon kategori income                      |
| expense  | `--expense` (`#C85C55`) | Teks nominal keluar, ikon kategori expense, label over-budget |
| transfer | `--gold` (`#BD8A30`)    | Teks nominal transfer, ikon kategori transfer                 |

### Wallet card tints (border accent)

| Tint    | Border color | Contoh wallet            |
| ------- | ------------ | ------------------------ |
| `pine`  | `#B6D7CC`    | BCA                      |
| `coral` | `#EFC5BB`    | Tunai                    |
| `gold`  | `#E9D49A`    | GoPay                    |
| `goal`  | `#C9B8DE`    | Dana Nikah (wallet goal) |

### Hero surface (balance card / available)

- Background: `--pine-2` (`#17483F` light, `#20453B` dark)
- Teks utama: `#F6FAF4` (light) / `#E7F3ED` (dark)
- Teks sekunder di atas hero: `#D4E4DD` (light) / `#A6C5B9` (dark)
- Divider di dalam hero: `#FFFFFF22` (light) / `rgba(255,255,255,.12)` (dark)

### Overlay & shadow

- Overlay sheet/modal: `#10251D66` (66% opacity)
- Shadow balance card: `0 12px 28px #1E4A4222`
- Shadow wallet card: `0 8px 18px rgba(33,52,49,.07)` (hover: `rgba(33,52,49,.11)`)
- Shadow FAB: `0 5px 15px #235B5066`

## Typography

| Peran                             | Font                  | Ukuran  | Berat   | Letter-spacing                    |
| --------------------------------- | --------------------- | ------- | ------- | --------------------------------- |
| Judul besar (h1, hero, setup)     | Fraunces              | 29–37px | 500–700 | `-.04em`                          |
| Judul section (h2)                | Fraunces              | 18–26px | 500–700 | `-.04em`                          |
| Angka besar (saldo, nominal hero) | Fraunces atau DM Mono | 28–32px | 500–700 | `-.04em` (Fraunces) / 0 (DM Mono) |
| Angka kecil (nominal item, stat)  | DM Mono               | 9–15px  | 400–500 | `-.06em` s.d. `-.08em`            |
| Label eyebrow                     | DM Mono               | 9–10px  | 500     | `.09em` (uppercase)               |
| Body/UI                           | Nunito Sans           | 10–16px | 400–800 | normal                            |
| Label form                        | DM Mono               | 10px    | 500     | `.03em`                           |

Font stack: `Nunito Sans` (UI), `Fraunces` (heading & angka besar), `DM Mono` (angka & label teknis). Fallback: serif/monospace/sans-serif standar.

## Radius

| Token         | Nilai   | Penggunaan                                                             |
| ------------- | ------- | ---------------------------------------------------------------------- |
| Radius kecil  | 9–13px  | Chip, tombol kecil, ikon kategori kecil, calendar cell                 |
| Radius sedang | 15–19px | Tombol primary, setting group, wallet card, input, FAB (17px)          |
| Radius besar  | 21–27px | Kartu hero, balance card, plan snapshot, chart card, sheet (27px atas) |
| Radius penuh  | 99px    | AI button, chips, toggle                                               |

## Spacing

- Padding page: `28px 21px` (atas-bawah 28px, kiri-kanan 21px)
- Gap antar kartu/section: `14–27px` (konsisten `27px` untuk jarak antar blok besar)
- Padding kartu: `17–21px`
- Gap chip: `7px`
- Grid kategori: `3 kolom`, gap `8px`
- Icon library: `5 kolom`, gap `7px`

## Shadow & Elevation

| Elemen                        | Shadow                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| Balance card / available hero | `0 12px 28px #1E4A4222`                                            |
| Wallet card                   | `0 8px 18px rgba(33,52,49,.07)`; hover `rgba(33,52,49,.11)`        |
| FAB (+)                       | `0 5px 15px #235B5066`                                             |
| Sheet                         | animasi naik `up .25s ease-out` (translateY 20px + opacity .5 → 1) |

## Motion

| Interaksi                | Durasi        | Kurva                          |
| ------------------------ | ------------- | ------------------------------ |
| Sheet naik               | `.25s`        | `ease-out`                     |
| Background theme         | `.3s`         | (default)                      |
| Wallet card hover/active | `.15–.18s`    | `ease`                         |
| Toggle                   | `.2s`         | (default)                      |
| AI loading pulse         | `1s infinite` | scale 1 → 1.25, opacity 1 → .5 |

## Ikon

- Ikon kategori & UI memakai **glyph/karakter Unicode** (bukan library ikon): `◒ ◉ ▧ ⌂ ♪ ✦ ☕ ✈ ♥ ✚ ♧ ⌁ ◎ ☀ ◈` dll. 15 pilihan di icon library kategori.
- Ukuran ikon kategori: `16px` dalam container `35px` radius `12px`.
- Ikon di tab bar & FAB: glyph `⌂ ▤ ＋ ◔ ☼`.
- Tab bar: ikon `19px`, label `9px`.

## Layout

- Lebar maksimum konten: **430px** (mobile frame), centered.
- Safe area: `env(safe-area-inset-top)` untuk padding atas, `92px + env(safe-area-inset-bottom)` untuk padding bawah (tab bar).
- Tab bar: fixed bottom, tinggi min `74px`, background `color-mix(surface 94% + transparent)`, blur `15px`, border-top `--line`.
- FAB **+**: tengah tab bar, `48×48px` (di CSS versi final `58px` dengan border 4px di beberapa varian), radius `17–20px`, `margin-top: -22px` agar menonjol.

## Dark Mode

| Token             | Light                      | Dark                       |
| ----------------- | -------------------------- | -------------------------- |
| `--bg`            | `#F6F5F0`                  | `#12231F`                  |
| `--surface`       | `#FFFEFA`                  | `#19312C`                  |
| `--text`          | `#213431`                  | `#EEF5EE`                  |
| `--muted`         | `#7B8882`                  | `#A6B5AE`                  |
| `--line`          | `#E3E4DD`                  | `#29443D`                  |
| `--pine`          | `#235B50`                  | `#83B5A5`                  |
| `--mint`          | `#DCE5EC`                  | `#20453B`                  |
| Spare budget card | `#DEEEE7` / teks `#1E4B42` | `#20453B` / teks `#E7F3ED` |

## Referensi

- Brand contract visual: `docs/design/DESIGN.md`
- Domain glossary: `CONTEXT.md`
