import { AIService, type BudgetAIInput } from '@/services/ai-service';

const input: BudgetAIInput = {
  spareBudget: 1_000_000,
  totalIncome: 5_000_000,
  fixedExpense: 2_000_000,
  goalContributions: 500_000,
  netSaving: 2_500_000,
  topExpenses: [{ name: 'Makan', amount: 1_200_000 }],
  goals: [{ name: 'Dana Nikah', targetAmount: 10_000_000, savedAmount: 2_000_000 }],
};

describe('AIService', () => {
  it('returns a structured deterministic suggestion without an API key', async () => {
    const service = new AIService({ apiKey: '' });

    await expect(service.suggestBudget(input)).resolves.toEqual({
      source: 'fallback',
      suggestions: [expect.objectContaining({ action: 'allocate_spare', amount: 500_000 })],
    });
  });

  it('maps a valid Groq structured response and sends the required schema contract', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    action: 'increase_allocation',
                    title: 'Tambah alokasi Makan',
                    description: 'Gunakan sebagian spare budget.',
                    amount: 300_000,
                    categoryName: 'Makan',
                  },
                ],
              }),
            },
          },
        ],
      }),
    });
    const service = new AIService({ apiKey: 'test-key', fetchImpl: request });

    await expect(service.suggestBudget(input)).resolves.toEqual({
      source: 'ai',
      suggestions: [
        {
          action: 'increase_allocation',
          title: 'Tambah alokasi Makan',
          description: 'Gunakan sebagian spare budget.',
          amount: 300_000,
          categoryName: 'Makan',
        },
      ],
    });
    expect(request).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
        body: expect.stringContaining('json_schema'),
      }),
    );
  });

  it('accepts an add_goal suggestion with a target and wallet from the structured response', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                suggestions: [
                  {
                    action: 'add_goal',
                    title: 'Dana Darurat',
                    description: 'Bangun dana darurat bertahap.',
                    amount: null,
                    categoryName: null,
                    targetAmount: 12000000,
                    walletName: 'Tabungan',
                    monthlyContribution: 1000000,
                  },
                ],
              }),
            },
          },
        ],
      }),
    });
    const service = new AIService({ apiKey: 'test-key', fetchImpl: request });

    await expect(service.suggestBudget(input)).resolves.toEqual({
      source: 'ai',
      suggestions: [
        {
          action: 'add_goal',
          title: 'Dana Darurat',
          description: 'Bangun dana darurat bertahap.',
          amount: null,
          categoryName: null,
          targetAmount: 12000000,
          walletName: 'Tabungan',
          monthlyContribution: 1000000,
        },
      ],
    });
  });

  it('falls back when structured output is invalid and generates Indonesian insight text', async () => {
    const request = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{invalid' } }] }),
    });
    const service = new AIService({ apiKey: 'test-key', fetchImpl: request });

    await expect(service.suggestBudget(input)).resolves.toMatchObject({ source: 'fallback' });
    await expect(new AIService({ apiKey: '' }).generateInsight(input)).resolves.toMatchObject({
      source: 'fallback',
      text: expect.stringContaining('Makan'),
    });
  });
});
