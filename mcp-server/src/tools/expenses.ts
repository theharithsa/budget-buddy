import { z } from "zod";
import { userExpensesRef, type Expense } from "../firebase.js";

// ── Schemas ─────────────────────────────────────────────────────────

export const ListExpensesSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Filter by month (YYYY-MM). Defaults to all."),
  category: z.string().optional().describe("Filter by category name"),
  app: z.string().optional().describe("Filter by app/platform name (e.g. Swiggy, Amazon)"),
  limit: z.number().int().min(1).max(100).default(50).describe("Max results to return"),
  offset: z.number().int().min(0).default(0).describe("Pagination offset"),
  sortBy: z.enum(["date", "amount"]).default("date").describe("Sort field"),
  sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
});

export const GetExpenseSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  expenseId: z.string().describe("Expense document ID"),
});

export const AddExpenseSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  amount: z.number().positive().describe("Expense amount in INR"),
  category: z.string().describe("Category name (e.g. Food & Dining, Transportation)"),
  description: z.string().describe("Short description of the expense"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Expense date (YYYY-MM-DD)"),
  peopleIds: z.array(z.string()).optional().describe("IDs of people the expense was for"),
  app: z.string().optional().describe("App/platform name (e.g. Swiggy, Amazon, Cash)"),
});

export const UpdateExpenseSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  expenseId: z.string().describe("Expense document ID"),
  amount: z.number().positive().optional().describe("Updated amount"),
  category: z.string().optional().describe("Updated category"),
  description: z.string().optional().describe("Updated description"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Updated date"),
  peopleIds: z.array(z.string()).optional().describe("Updated people IDs"),
  app: z.string().optional().describe("Updated app/platform"),
});

export const DeleteExpenseSchema = z.object({
  userId: z.string().describe("Firebase user ID"),
  expenseId: z.string().describe("Expense document ID"),
});

// ── Tool implementations ────────────────────────────────────────────

export async function listExpenses(params: z.infer<typeof ListExpensesSchema>) {
  const ref = userExpensesRef(params.userId);
  let query = ref.orderBy(params.sortBy, params.sortOrder);

  const snapshot = await query.get();
  let expenses: Expense[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Expense[];

  // Client-side filtering (Firestore doesn't support multi-field inequality)
  if (params.month) {
    expenses = expenses.filter((e) => e.date.startsWith(params.month!));
  }
  if (params.category) {
    expenses = expenses.filter(
      (e) => e.category.toLowerCase() === params.category!.toLowerCase()
    );
  }
  if (params.app) {
    expenses = expenses.filter(
      (e) => e.app?.toLowerCase() === params.app!.toLowerCase()
    );
  }

  const total = expenses.length;
  const paged = expenses.slice(params.offset, params.offset + params.limit);

  return {
    total,
    count: paged.length,
    offset: params.offset,
    has_more: params.offset + params.limit < total,
    next_offset: params.offset + params.limit < total ? params.offset + params.limit : null,
    expenses: paged,
  };
}

export async function getExpense(params: z.infer<typeof GetExpenseSchema>) {
  const doc = await userExpensesRef(params.userId).doc(params.expenseId).get();
  if (!doc.exists) {
    throw new Error(`Expense ${params.expenseId} not found for user ${params.userId}`);
  }
  return { id: doc.id, ...doc.data() } as Expense;
}

export async function addExpense(params: z.infer<typeof AddExpenseSchema>) {
  const { userId, ...data } = params;
  const expenseData = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  const docRef = await userExpensesRef(userId).add(expenseData);
  return { id: docRef.id, ...expenseData } as Expense;
}

export async function updateExpense(params: z.infer<typeof UpdateExpenseSchema>) {
  const { userId, expenseId, ...updates } = params;
  // Remove undefined fields
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(cleanUpdates).length === 0) {
    throw new Error("No fields to update. Provide at least one field to change.");
  }

  const ref = userExpensesRef(userId).doc(expenseId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error(`Expense ${expenseId} not found. Use finbuddy_list_expenses to find valid IDs.`);
  }

  await ref.update(cleanUpdates);
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() } as Expense;
}

export async function deleteExpense(params: z.infer<typeof DeleteExpenseSchema>) {
  const ref = userExpensesRef(params.userId).doc(params.expenseId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error(`Expense ${params.expenseId} not found. Use finbuddy_list_expenses to find valid IDs.`);
  }
  const data = { id: doc.id, ...doc.data() } as Expense;
  await ref.delete();
  return { deleted: true, expense: data };
}
