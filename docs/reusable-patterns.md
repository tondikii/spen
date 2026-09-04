# Reusable screen patterns

Pattern hanya dipusatkan bila sudah memiliki minimal dua adapter nyata.

| Pattern | Adapter saat ini | Boundary |
| --- | --- | --- |
| `DataState` | Beranda, Rencana, Laporan, Transaksi, Riwayat | loading/error/retry state |
| `ThemedInput` | Wallet form, transaction form, category form | input visual dan aksesibilitas |
| `ConfirmationModal` | archive Wallet, delete transaction, archive Goal/category | destructive confirmation |
| `ThemedText` / `ThemedView` | seluruh screen native | typography dan surface theme |

Domain-specific card, row, dan form tetap berada di feature/component pemakainya sampai ada adapter kedua dengan behavior yang sama. Label accessibility dan behavior existing adalah bagian dari interface pattern.
