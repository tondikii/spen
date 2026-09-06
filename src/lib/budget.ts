export function getSpareBudgetPercent(spareBudget: number, income: number) {
  if (income <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((spareBudget / income) * 100)));
}
