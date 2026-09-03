# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Agent skills

### Spen skills

Custom skills for this repo (in `.agents/skills/`):

- `spen-db` — expo-sqlite + Drizzle ORM: schema, migrasi, transaksi eksklusif, test DB temp. Gunakan saat menyentuh db/schema, query, atau migrasi.
- `spen-rn-testing` — React Native + Expo SDK 57: routing, design system (DESIGN.md), testing (jest-expo + RNTL) di seam service layer. Gunakan saat membangun layar/komponen/test.
- `spen-ai-service` — AIService Groq (suggestBudget + generateInsight), read-only, fallback deterministik. Gunakan saat membangun/mengubah service AI.
- `spen-copywriting` — suara Spen: Bahasa Indonesia santai-tenang, ringkas, tanpa kesan AI, no TMI, no redundancy. Gunakan saat menulis/mengubah teks UI atau copy AI.

### Issue tracker

Issues and specs live as GitHub issues; use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped to the default labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
