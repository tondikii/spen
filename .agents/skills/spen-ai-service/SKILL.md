---
name: spen-ai-service
description: "Pola AI service Spen: satu AIService (Groq, model gpt-oss) dengan dua fungsi — suggestBudget (gpt-oss-20b, output JSON terstruktur via Structured Outputs json_schema strict) dan generateInsight (gpt-oss-120b, teks Bahasa Indonesia). Dipicu manual, read-only, satu-shot, fallback deterministik lokal saat AI tidak tersedia. Gunakan saat membangun/mengubah service AI, saran budget, insight report, atau fallback."
---

# Spen AI Service

Pola layanan AI Spen. Keputusan arsitektur: `docs/adr/0002-groq-ai-provider.md`; perilaku produk: `docs/spec.md` (US-18 s.d. US-21, US-41, US-42) dan `CONTEXT.md` (istilah "AI service").

## Aturan

- **Satu `AIService`**, dua fungsi:
  - `suggestBudget()` — model `openai/gpt-oss-20b`, output **JSON terstruktur** via Structured Outputs (`response_format.type: "json_schema"`, `strict: true`). Daftar saran terstruktur, tiap saran punya tipe aksi + tombol "Terapkan".
  - `generateInsight()` — model `openai/gpt-oss-120b`, teks **Bahasa Indonesia** natural (skor MMMLU multilingual tertinggi).
- **Read-only**: AI tidak pernah menulis data; hanya tombol "Terapkan" (eksekusi user) yang mengubah Budget plan.
- **Dipicu manual, satu-shot** — tidak ada auto-run, tidak ada conversation follow-up.
- **Fallback deterministik**: saat AI tidak tersedia (offline, rate limit, error), gunakan hitungan lokal (spare budget, breakdown) — jangan pernah membiarkan layar kosong. Output fallback mengikuti format yang sama (list saran / insight teks).
- **Bahasa output**: selalu Bahasa Indonesia, nada ringkas/actionable/tenang (lihat `docs/design/DESIGN.md` §7).
- **Keamanan**: API key adalah secret server-side. Untuk rilis produksi, panggilan Groq lewat backend tipis (key tidak di binary mobile). Untuk MVP native, pakai key dev / BYOK — jangan commit key ke repo. Simpan di `.env` (dev) atau mekanisme yang disetujui.

## Pola implementasi

- Satu service class/modul di `src/services/` yang memakai Groq OpenAI-compatible API (`POST /openai/v1/chat/completions`). Base URL Groq, bukan OpenAI.
- Input service = data teragregasi dari service layer (`db/` + `services/`): spare budget, pendapatan, fixed expense, goal, net saving — bukan query DB langsung.
- Validate output JSON terhadap schema (Structured Outputs `strict` + parse-time check); jika parse gagal → fallback deterministik.

## Testing

- **Fallback deterministik diuji** (dari `docs/spec.md` Testing Decisions): AI offline → hitungan lokal benar, format output sama.
- **Jangan test panggilan API nyata**: mock HTTP layer / inject client; test perilaku service (parse, fallback, mapping) bukan jaringan.
- Gunakan `/tdd` di seam service layer; lihat `spen-rn-testing` untuk setup runner.

## Referensi

- ADR-0002: `docs/adr/0002-groq-ai-provider.md`
- Spec: `docs/spec.md` (AI Suggestion & Insight, Fallback)
- Domain: `CONTEXT.md` ("AI service")
- Groq API (OpenAI-compatible): dokumentasi resmi Groq
