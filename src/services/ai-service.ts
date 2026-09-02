import type { CurrencyCode } from '@/types/domain';

export type BudgetAIInput = {
  spareBudget: number;
  totalIncome: number;
  fixedExpense: number;
  goalContributions: number;
  netSaving: number;
  topExpenses?: Array<{ name: string; amount: number }>;
  goals?: Array<{ name: string; targetAmount: number; savedAmount: number }>;
  currency?: CurrencyCode;
};

export type BudgetSuggestion = {
  action: 'allocate_spare' | 'increase_allocation' | 'add_goal' | 'review_expense';
  title: string;
  description: string;
  amount?: number;
  categoryName?: string;
};

export type SuggestionResult = { source: 'ai' | 'fallback'; suggestions: BudgetSuggestion[] };
export type InsightResult = { source: 'ai' | 'fallback'; text: string };

type AIServiceOptions = { apiKey?: string; baseUrl?: string; fetchImpl?: typeof fetch };
type ChatResponse = { choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }> };

const suggestionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['allocate_spare', 'increase_allocation', 'add_goal', 'review_expense'] },
          title: { type: 'string' },
          description: { type: 'string' },
          amount: { type: ['number', 'null'] },
          categoryName: { type: ['string', 'null'] },
        },
        required: ['action', 'title', 'description', 'amount', 'categoryName'],
      },
    },
  },
  required: ['suggestions'],
} as const;

function extractContent(response: ChatResponse) {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  return content?.map((part) => part.text ?? '').join('') ?? '';
}

function isSuggestion(value: unknown): value is BudgetSuggestion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BudgetSuggestion>;
  return ['allocate_spare', 'increase_allocation', 'add_goal', 'review_expense'].includes(item.action ?? '')
    && typeof item.title === 'string' && typeof item.description === 'string'
    && (item.amount === undefined || typeof item.amount === 'number')
    && (item.categoryName === undefined || typeof item.categoryName === 'string');
}

function fallbackSuggestions(input: BudgetAIInput): BudgetSuggestion[] {
  if (input.spareBudget > 0) {
    return [{ action: 'allocate_spare', title: 'Sisihkan sebagian spare budget', description: 'Sisihkan setengah spare budget sebagai ruang aman untuk kebutuhan tak terduga.', amount: Math.floor(input.spareBudget / 2) }];
  }
  const largest = input.topExpenses?.[0];
  if (largest) return [{ action: 'review_expense', title: `Tinjau pengeluaran ${largest.name}`, description: `Pengeluaran ${largest.name} menjadi bagian terbesar. Cek kembali transaksi dan alokasinya.`, categoryName: largest.name }];
  return [{ action: 'review_expense', title: 'Rapikan Budget plan', description: 'Catat pendapatan dan fixed expense agar saran berikutnya lebih tepat.' }];
}

function fallbackInsight(input: BudgetAIInput): string {
  const largest = input.topExpenses?.[0];
  const expenseText = largest ? `Pengeluaran terbesar ada di kategori ${largest.name} sebesar ${largest.amount.toLocaleString('id-ID')}.` : 'Belum ada kategori pengeluaran yang dominan.';
  const savingText = input.netSaving >= 0 ? 'Net saving masih positif, jadi kamu punya ruang untuk menjaga alokasi tetap nyaman.' : 'Net saving sedang negatif; coba tinjau fixed expense dan pengeluaran terbesar secara perlahan.';
  return `${expenseText} ${savingText}`;
}

export class AIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AIServiceOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
    this.baseUrl = options.baseUrl ?? 'https://api.groq.com/openai/v1/chat/completions';
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async suggestBudget(input: BudgetAIInput): Promise<SuggestionResult> {
    const fallback = { source: 'fallback' as const, suggestions: fallbackSuggestions(input) };
    if (!this.apiKey) return fallback;
    try {
      const response = await this.fetchImpl(this.baseUrl, { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai/gpt-oss-20b', temperature: 0.2, messages: [{ role: 'system', content: 'Kamu adalah asisten Budget plan Spen. Jawab ringkas dalam Bahasa Indonesia dan jangan mengubah data pengguna.' }, { role: 'user', content: JSON.stringify(input) }], response_format: { type: 'json_schema', json_schema: { name: 'budget_suggestions', strict: true, schema: suggestionSchema } } }) });
      if (!response.ok) return fallback;
      const parsed = JSON.parse(extractContent(await response.json() as ChatResponse)) as { suggestions?: unknown };
      if (!Array.isArray(parsed.suggestions) || !parsed.suggestions.every(isSuggestion)) return fallback;
      return { source: 'ai', suggestions: parsed.suggestions };
    } catch {
      return fallback;
    }
  }

  async generateInsight(input: BudgetAIInput): Promise<InsightResult> {
    const fallback = { source: 'fallback' as const, text: fallbackInsight(input) };
    if (!this.apiKey) return fallback;
    try {
      const response = await this.fetchImpl(this.baseUrl, { method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai/gpt-oss-120b', temperature: 0.4, messages: [{ role: 'system', content: 'Kamu adalah analis keuangan Spen. Tulis insight ringkas, actionable, tenang, dan selalu dalam Bahasa Indonesia.' }, { role: 'user', content: JSON.stringify(input) }] }) });
      if (!response.ok) return fallback;
      const text = extractContent(await response.json() as ChatResponse).trim();
      return text ? { source: 'ai', text } : fallback;
    } catch {
      return fallback;
    }
  }
}

export const aiService = new AIService();
