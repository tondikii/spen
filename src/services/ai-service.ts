import type { CurrencyCode, Locale } from '@/types/domain';

export type BudgetAIInput = {
  spareBudget: number;
  totalIncome: number;
  fixedExpense: number;
  goalContributions: number;
  netSaving: number;
  topExpenses?: { name: string; amount: number }[];
  goals?: { name: string; targetAmount: number; savedAmount: number }[];
  wallets?: { name: string; balance: number }[];
  currency?: CurrencyCode;
  locale?: Locale;
};

export type BudgetSuggestion = {
  action: 'allocate_spare' | 'increase_allocation' | 'add_goal' | 'review_expense';
  title: string;
  description: string;
  amount?: number | null;
  categoryName?: string | null;
  targetAmount?: number | null;
  walletName?: string | null;
  monthlyContribution?: number | null;
};

export type SuggestionResult = { source: 'ai' | 'fallback'; suggestions: BudgetSuggestion[] };
export type InsightResult = { source: 'ai' | 'fallback'; text: string };

type AIServiceOptions = { apiKey?: string; baseUrl?: string; fetchImpl?: typeof fetch };
type ChatResponse = {
  choices?: { message?: { content?: string | { type?: string; text?: string }[] } }[];
};

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
          action: {
            type: 'string',
            enum: ['allocate_spare', 'increase_allocation', 'add_goal', 'review_expense'],
          },
          title: { type: 'string' },
          description: { type: 'string' },
          amount: { type: ['number', 'null'] },
          categoryName: { type: ['string', 'null'] },
          targetAmount: { type: ['number', 'null'] },
          walletName: { type: ['string', 'null'] },
          monthlyContribution: { type: ['number', 'null'] },
        },
        required: [
          'action',
          'title',
          'description',
          'amount',
          'categoryName',
          'targetAmount',
          'walletName',
          'monthlyContribution',
        ],
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
  return (
    ['allocate_spare', 'increase_allocation', 'add_goal', 'review_expense'].includes(
      item.action ?? '',
    ) &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    (item.amount === undefined || item.amount === null || typeof item.amount === 'number') &&
    (item.categoryName === undefined ||
      item.categoryName === null ||
      typeof item.categoryName === 'string') &&
    (item.targetAmount === undefined ||
      item.targetAmount === null ||
      typeof item.targetAmount === 'number') &&
    (item.walletName === undefined ||
      item.walletName === null ||
      typeof item.walletName === 'string') &&
    (item.monthlyContribution === undefined ||
      item.monthlyContribution === null ||
      typeof item.monthlyContribution === 'number')
  );
}

function fallbackSuggestions(input: BudgetAIInput): BudgetSuggestion[] {
  const en = input.locale === 'en';
  if (input.spareBudget > 0) {
    return [
      {
        action: 'allocate_spare',
        title: en ? 'Set aside half of your spare budget' : 'Sisihkan setengah spare budget',
        description: en ? 'Build an emergency fund for unexpected needs.' : 'Jadikan dana darurat untuk kebutuhan tak terduga.',
        amount: Math.floor(input.spareBudget / 2),
      },
    ];
  }
  const largest = input.topExpenses?.[0];
  if (largest)
    return [
      {
        action: 'review_expense',
        title: en ? `Review ${largest.name} spending` : `Tinjau pengeluaran ${largest.name}`,
        description: en ? `${largest.name} is your largest expense. Review its transactions and allocation.` : `Pengeluaran ${largest.name} paling besar. Cek transaksi dan alokasinya.`,
        categoryName: largest.name,
      },
    ];
  return [
    {
      action: 'review_expense',
      title: en ? 'Organize your Budget plan' : 'Rapikan Budget plan',
      description: en ? 'Record income and expenses so future suggestions are more useful.' : 'Catat pendapatan dan pengeluaran agar saran berikutnya lebih tepat.',
    },
  ];
}

function fallbackInsight(input: BudgetAIInput): string {
  const en = input.locale === 'en';
  const largest = input.topExpenses?.[0];
  const expenseText = largest
    ? (en ? `Largest expense: ${largest.name} at ${largest.amount.toLocaleString('en-US')}.` : `Pengeluaran terbesar: kategori ${largest.name} sebesar ${largest.amount.toLocaleString('id-ID')}.`)
    : (en ? 'No spending category stands out yet.' : 'Belum ada kategori pengeluaran yang dominan.');
  const savingText =
    input.netSaving >= 0
      ? (en ? 'Net saving is positive — there is room to increase allocations.' : 'Net saving masih positif — masih ada ruang untuk menambah alokasi.')
      : (en ? 'Net saving is negative — review your largest expenses and allocations.' : 'Net saving sedang negatif — cek pengeluaran terbesar dan alokasinya.');
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
    const en = input.locale === 'en';
    if (!this.apiKey) return fallback;
    try {
      const response = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                en ? 'You are Spen’s Budget plan assistant. Reply briefly and calmly in English with actionable suggestions. Do not change user data.' : 'Kamu asisten Budget plan Spen. Jawab ringkas dan tenang dalam Bahasa Indonesia, langsung ke saran. Jangan mengubah data pengguna.',
            },
            { role: 'user', content: JSON.stringify(input) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'budget_suggestions', strict: true, schema: suggestionSchema },
          },
        }),
      });
      if (!response.ok) return fallback;
      const parsed = JSON.parse(extractContent((await response.json()) as ChatResponse)) as {
        suggestions?: unknown;
      };
      if (!Array.isArray(parsed.suggestions) || !parsed.suggestions.every(isSuggestion))
        return fallback;
      return { source: 'ai', suggestions: parsed.suggestions };
    } catch {
      return fallback;
    }
  }

  async generateInsight(input: BudgetAIInput): Promise<InsightResult> {
    const fallback = { source: 'fallback' as const, text: fallbackInsight(input) };
    const en = input.locale === 'en';
    if (!this.apiKey) return fallback;
    try {
      const response = await this.fetchImpl(this.baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content:
                en ? 'You are Spen’s financial analyst. Write a brief, clear, calm insight in English, focused on facts and direction without judgment.' : 'Kamu analis keuangan Spen. Tulis insight ringkas, jelas, dan tenang dalam Bahasa Indonesia, langsung ke fakta dan arahnya, tanpa menghakimi.',
            },
            { role: 'user', content: JSON.stringify(input) },
          ],
        }),
      });
      if (!response.ok) return fallback;
      const text = extractContent((await response.json()) as ChatResponse).trim();
      return text ? { source: 'ai', text } : fallback;
    } catch {
      return fallback;
    }
  }
}

export const aiService = new AIService();
