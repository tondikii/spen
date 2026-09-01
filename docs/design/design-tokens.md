# Design Tokens Spen — slot & peran (nilai diserahkan ke design agent)

File ini **mendefinisikan nama slot token + perannya** untuk design system Spen. Nilai konkret (warna, font, ukuran) **TIDAK diisi di sini** — itu keputusan visual design agent saat rendering, dan hasilnya direkam balik (misal sebagai token CSS di DESIGN.md atau file terpisah) setelah disetujui.

> **Prinsip**: arahkan nuansa & peran, serahkan keputusan visual spesifik ke design agent.

## Token yang harus didefinisikan agent saat render (kerangka, bukan nilai)

### Warna — peran (WAJIB ada, konsisten)
| Slot | Peran |
|---|---|
| `--bg` | Background utama (light & dark) |
| `--surface` | Kartu, sheet, modal |
| `--fg` | Teks utama |
| `--muted` | Teks sekunder/meta |
| `--border` | Pemisah halus |
| `--accent` | Brand color (satu, menenangkan & tepercaya) |
| `--accent-on` | Teks di atas accent |
| `--success` | Income, angka positif |
| `--error` | Expense, defisit, over-budget |
| `--warning` | Transfer |

### Tipografi — peran
| Slot | Peran |
|---|---|
| `--font-display` | Judul/display (boleh serif/sans — agent pilih) |
| `--font-body` | Teks body |
| `--font-mono` | Numerik/nominal (tabular numerals penting) |

### Spacing & radius — peran
| Slot | Peran |
|---|---|
| `--space-*` | Skala spacing konsisten (base kecil → besar) |
| `--radius-*` | Skala radius konsisten (sm → xl) |

### Motion
| Slot | Peran |
|---|---|
| `--ease-standard` | Easing default UI (ease-out kuat, jangan ease-in) |
| `--motion-enter` / `--motion-exit` | Durasi masuk/keluar (~200ms / ~140ms) |

## Aturan

- **Semantic color tidak boleh diubah perannya**: income=success, expense=error, transfer=warning. (Nilai boleh beda per tema, peran tetap.)
- **Dark mode**: nilai dark bukan sekadar invert light; pilih yang pas.
- **Nilai harus konsisten** antara `DESIGN.md` dan token CSS setelah dipilih.
