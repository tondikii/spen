# Spen architecture

Feature/domain boundaries live under `src/features/`. Each feature exposes a small barrel interface while database adapters remain in `src/services/` and shared UI remains in `src/components/`.

- `features/wallet`: Wallet overview and Wallet lifecycle.
- `features/transactions`: transaction entry and ledger operations.
- `features/budget`: Budget plan and Goal operations.
- `features/report`: Report and Riwayat reads.

Routes under `src/app/` are adapters: they read route parameters, call a feature interface, and choose navigation. A feature barrel must re-export an existing implementation rather than define a second copy of a service.
