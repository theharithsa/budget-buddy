import { z } from "zod";
import { userBudgetsRef, userExpensesRef, type Budget, type Expense } from "../firebase.js";

// ── Schemas ─────────────────────────────────────────────────────────

export const ListBudgetsSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
});

export const SetBudgetSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  category: z.string().describe("Budget category (e.g. Food & Dining)"),
  limit: z.number().positive().describe("Monthly budget limit in INR"),
});

export const DeleteBudgetSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  budgetId: z.string().describe("Budget document ID"),
});

export const GetBudgetStatusSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Month to check (YYYY-MM). Defaults to current month."),
});

// ── Tool implementations ────────────────────────────────────────────

export async function listBudgets(params: z.infer<typeof ListBudgetsSchema>) {
  const snapshot = await userBudgetsRef(params.userId).get();
  const budgets: Budget[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Budget[];
  return { total: budgets.length, budgets };
}

export async function setBudget(params: z.infer<typeof SetBudgetSchema>) {
  const { userId, category, limit } = params;
  const ref = userBudgetsRef(userId);

  // Check if budget for this category already exists
  const existing = await ref.where("category", "==", category).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    await doc.ref.update({ limit });
    const updated = await doc.ref.get();
    return { id: updated.id, ...updated.data(), updated: true } as Budget & { updated: boolean };
  }

  const docRef = await ref.add({ category, limit, spent: 0 });
  return { id: docRef.id, category, limit, spent: 0, updated: false } as Budget & { updated: boolean };
}

export async function deleteBudget(params: z.infer<typeof DeleteBudgetSchema>) {
  const ref = userBudgetsRef(params.userId).doc(params.budgetId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error(`Budget ${params.budgetId} not found. Use finbuddy_list_budgets to find valid IDs.`);
  }
  const data = { id: doc.id, ...doc.data() } as Budget;
  await ref.delete();
  return { deleted: true, budget: data };
}

export async function getBudgetStatus(params: z.infer<typeof GetBudgetStatusSchema>) {
  const month = params.month ?? new Date().toISOString().slice(0, 7);

  // Fetch budgets
  const budgetSnap = await userBudgetsRef(params.userId).get();
  const budgets: Budget[] = budgetSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Budget[];

  // Fetch expenses for the month
  const expenseSnap = await userExpensesRef(params.userId).get();
  const expenses: Expense[] = (expenseSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Expense[]).filter((e) => e.date.startsWith(month));

  // Calculate spending per category
  const spendingByCategory = new Map<string, number>();
  for (const exp of expenses) {
    const current = spendingByCategory.get(exp.category) ?? 0;
    spendingByCategory.set(exp.category, current + exp.amount);
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryStatus = budgets.map((b) => {
    const spent = spendingByCategory.get(b.category) ?? 0;
    const remaining = b.limit - spent;
    const percentage = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    return {
      category: b.category,
      limit: b.limit,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentage,
      status: percentage >= 100 ? "over_budget" : percentage >= 80 ? "warning" : "on_track",
    };
  });

  // Uncategorized spending (expenses in categories without budgets)
  const budgetedCategories = new Set(budgets.map((b) => b.category));
  const uncategorizedSpending: Array<{ category: string; spent: number }> = [];
  for (const [cat, amount] of spendingByCategory) {
    if (!budgetedCategories.has(cat)) {
      uncategorizedSpending.push({ category: cat, spent: Math.round(amount * 100) / 100 });
    }
  }

  return {
    month,
    totalBudget,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRemaining: Math.round((totalBudget - totalSpent) * 100) / 100,
    overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    overallStatus: totalSpent >= totalBudget ? "over_budget" : totalSpent >= totalBudget * 0.8 ? "warning" : "on_track",
    categories: categoryStatus,
    uncategorizedSpending,
  };
}
