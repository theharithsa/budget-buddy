import { z } from "zod";
import { userExpensesRef, userBudgetsRef, resolveUserId, type Expense, type Budget } from "../firebase.js";

// ── Schemas ─────────────────────────────────────────────────────────

export const SpendingSummarySchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month (YYYY-MM). Defaults to current month."),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date (YYYY-MM-DD) for custom range"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date (YYYY-MM-DD) for custom range"),
});

export const CategoryBreakdownSchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month (YYYY-MM). Defaults to current month."),
});

export const SpendingTrendsSchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  months: z.number().int().min(1).max(12).default(6).describe("Number of past months to analyze"),
});

export const AppSpendingSchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month (YYYY-MM). Defaults to current month."),
});

export const DailySpendingSchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month (YYYY-MM). Defaults to current month."),
});

export const FinancialHealthSchema = z.object({
  userId: z.string().optional().describe("Firebase user ID (falls back to FINBUDDY_USER_ID env var)"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month (YYYY-MM). Defaults to current month."),
});

// ── Helpers ─────────────────────────────────────────────────────────

function resolveUid(userId?: string): string {
  return resolveUserId(userId);
}

async function fetchExpenses(userId?: string): Promise<Expense[]> {
  const uid = resolveUid(userId);
  const snap = await userExpensesRef(uid).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Expense[];
}

async function fetchBudgets(userId?: string): Promise<Budget[]> {
  const uid = resolveUid(userId);
  const snap = await userBudgetsRef(uid).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Budget[];
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Tool implementations ────────────────────────────────────────────

export async function spendingSummary(params: z.infer<typeof SpendingSummarySchema>) {
  const allExpenses = await fetchExpenses(params.userId);
  let expenses: Expense[];

  if (params.fromDate && params.toDate) {
    expenses = allExpenses.filter((e) => e.date >= params.fromDate! && e.date <= params.toDate!);
  } else {
    const month = params.month ?? currentMonth();
    expenses = allExpenses.filter((e) => e.date.startsWith(month));
  }

  const total = round(expenses.reduce((sum, e) => sum + e.amount, 0));
  const count = expenses.length;
  const avg = count > 0 ? round(total / count) : 0;

  // Top 5 largest expenses
  const topExpenses = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((e) => ({
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      app: e.app,
    }));

  // Most frequent category
  const categoryCounts = new Map<string, number>();
  for (const e of expenses) {
    categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1);
  }
  const mostFrequentCategory = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  return {
    period: params.fromDate && params.toDate
      ? `${params.fromDate} to ${params.toDate}`
      : params.month ?? currentMonth(),
    totalSpent: total,
    transactionCount: count,
    averageTransaction: avg,
    mostFrequentCategory,
    topExpenses,
  };
}

export async function categoryBreakdown(params: z.infer<typeof CategoryBreakdownSchema>) {
  const month = params.month ?? currentMonth();
  const allExpenses = await fetchExpenses(params.userId);
  const expenses = allExpenses.filter((e) => e.date.startsWith(month));

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = new Map<string, { spent: number; count: number }>();

  for (const e of expenses) {
    const curr = byCategory.get(e.category) ?? { spent: 0, count: 0 };
    curr.spent += e.amount;
    curr.count += 1;
    byCategory.set(e.category, curr);
  }

  const categories = [...byCategory.entries()]
    .map(([category, { spent, count }]) => ({
      category,
      spent: round(spent),
      count,
      percentage: total > 0 ? Math.round((spent / total) * 100) : 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  return { month, totalSpent: round(total), categories };
}

export async function spendingTrends(params: z.infer<typeof SpendingTrendsSchema>) {
  const allExpenses = await fetchExpenses(params.userId);

  // Generate past N months
  const months: string[] = [];
  const now = new Date();
  for (let i = params.months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const trends = months.map((month) => {
    const monthExpenses = allExpenses.filter((e) => e.date.startsWith(month));
    const total = round(monthExpenses.reduce((sum, e) => sum + e.amount, 0));
    const count = monthExpenses.length;
    return { month, totalSpent: total, transactionCount: count };
  });

  // Calculate month-over-month change
  const withChange = trends.map((t, i) => ({
    ...t,
    changeFromPrevious:
      i > 0 && trends[i - 1].totalSpent > 0
        ? Math.round(((t.totalSpent - trends[i - 1].totalSpent) / trends[i - 1].totalSpent) * 100)
        : null,
  }));

  const avgMonthly = round(
    trends.reduce((sum, t) => sum + t.totalSpent, 0) / trends.length
  );

  return { months: withChange, averageMonthlySpend: avgMonthly };
}

export async function appSpending(params: z.infer<typeof AppSpendingSchema>) {
  const month = params.month ?? currentMonth();
  const allExpenses = await fetchExpenses(params.userId);
  const expenses = allExpenses.filter((e) => e.date.startsWith(month));

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byApp = new Map<string, { spent: number; count: number }>();

  for (const e of expenses) {
    const app = e.app ?? "Unknown";
    const curr = byApp.get(app) ?? { spent: 0, count: 0 };
    curr.spent += e.amount;
    curr.count += 1;
    byApp.set(app, curr);
  }

  const apps = [...byApp.entries()]
    .map(([app, { spent, count }]) => ({
      app,
      spent: round(spent),
      count,
      percentage: total > 0 ? Math.round((spent / total) * 100) : 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  return { month, totalSpent: round(total), apps };
}

export async function dailySpending(params: z.infer<typeof DailySpendingSchema>) {
  const month = params.month ?? currentMonth();
  const allExpenses = await fetchExpenses(params.userId);
  const expenses = allExpenses.filter((e) => e.date.startsWith(month));

  const byDay = new Map<string, number>();
  for (const e of expenses) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
  }

  const days = [...byDay.entries()]
    .map(([date, spent]) => ({ date, spent: round(spent) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const total = round(expenses.reduce((sum, e) => sum + e.amount, 0));
  const avgDaily = days.length > 0 ? round(total / days.length) : 0;
  const peak = days.length > 0 ? days.reduce((max, d) => (d.spent > max.spent ? d : max)) : null;

  return { month, totalSpent: total, averageDaily: avgDaily, peakDay: peak, days };
}

export async function financialHealth(params: z.infer<typeof FinancialHealthSchema>) {
  const month = params.month ?? currentMonth();

  const [allExpenses, budgets] = await Promise.all([
    fetchExpenses(params.userId),
    fetchBudgets(params.userId),
  ]);

  const expenses = allExpenses.filter((e) => e.date.startsWith(month));
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

  // Budget compliance (0-100)
  const budgetCompliance =
    totalBudget > 0
      ? Math.max(0, Math.min(100, Math.round((1 - totalSpent / totalBudget) * 100)))
      : 0;

  // Category-level compliance
  const spendingByCategory = new Map<string, number>();
  for (const e of expenses) {
    spendingByCategory.set(e.category, (spendingByCategory.get(e.category) ?? 0) + e.amount);
  }

  const overBudgetCategories = budgets
    .filter((b) => (spendingByCategory.get(b.category) ?? 0) > b.limit)
    .map((b) => ({
      category: b.category,
      limit: b.limit,
      spent: round(spendingByCategory.get(b.category) ?? 0),
      overBy: round((spendingByCategory.get(b.category) ?? 0) - b.limit),
    }));

  // Consistency - days with spending / total days in month
  const daysWithSpending = new Set(expenses.map((e) => e.date)).size;
  const daysInMonth = new Date(
    parseInt(month.slice(0, 4)),
    parseInt(month.slice(5, 7)),
    0
  ).getDate();
  const consistencyScore = Math.round((daysWithSpending / daysInMonth) * 100);

  // Overall score (weighted)
  const overallScore = Math.round(
    budgetCompliance * 0.5 + (100 - Math.min(consistencyScore, 100)) * 0.2 + Math.min(budgetCompliance, 100) * 0.3
  );

  return {
    month,
    overallScore,
    budgetCompliance,
    totalBudget,
    totalSpent: round(totalSpent),
    consistencyScore,
    daysWithSpending,
    daysInMonth,
    overBudgetCategories,
    summary:
      overallScore >= 80
        ? "Excellent financial discipline this month!"
        : overallScore >= 60
          ? "Good spending habits with some room for improvement."
          : overallScore >= 40
            ? "Spending is above budget in several areas — review your habits."
            : "Significant overspending detected. Consider reviewing your budgets.",
  };
}
