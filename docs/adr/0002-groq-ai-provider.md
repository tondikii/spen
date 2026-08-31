# ADR-0002: Groq as AI provider with GPT-OSS models

Kita memakai Groq sebagai penyedia AI, dengan dua model open-weight `openai/gpt-oss`:

- **Saran budget (JSON terstruktur):** `openai/gpt-oss-20b` dengan Structured Outputs (`response_format.type: "json_schema"`, `strict: true`) — murah, ~1000 tps, dan satu dari sedikit model yang menjamin output sesuai schema.
- **Insight report (teks Bahasa Indonesia):** `openai/gpt-oss-120b` — skor MMMLU multilingual tertinggi di platform, cocok untuk teks Bahasa Indonesia yang alami.

Model lama (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) di-shutdown untuk free tier pada 16 Agustus 2026; kita memakai penerus yang direkomendasikan Groq.

Semua panggilan lewat satu service AI (`AIService`) yang mengekspos dua fungsi (suggestion + insight), read-only, dipicu manual. Free tier cukup untuk volume rendah: ~30 req/menit, 1000 req/hari, 8K token/menit. API Groq kompatibel OpenAI (`POST /openai/v1/chat/completions`).

Konsekuensi: API key adalah secret server-side — untuk rilis produksi, panggilan Groq harus lewat backend tipis, bukan dari binary mobile. Untuk MVP native, panggil langsung dari app dengan key pengguna (BYOK-style) atau backend dev.
