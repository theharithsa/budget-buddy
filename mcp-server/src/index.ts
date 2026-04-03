#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initFirebase } from "./firebase.js";

// ── Expense tools ───────────────────────────────────────────────────
import {
  ListExpensesSchema,
  GetExpenseSchema,
  AddExpenseSchema,
  UpdateExpenseSchema,
  DeleteExpenseSchema,
  listExpenses,
  getExpense,
  addExpense,
  updateExpense,
  deleteExpense,
} from "./tools/expenses.js";

// ── Budget tools ────────────────────────────────────────────────────
import {
  ListBudgetsSchema,
  SetBudgetSchema,
  DeleteBudgetSchema,
  GetBudgetStatusSchema,
  listBudgets,
  setBudget,
  deleteBudget,
  getBudgetStatus,
} from "./tools/budgets.js";

// ── Analytics tools ─────────────────────────────────────────────────
import {
  SpendingSummarySchema,
  CategoryBreakdownSchema,
  SpendingTrendsSchema,
  AppSpendingSchema,
  DailySpendingSchema,
  FinancialHealthSchema,
  spendingSummary,
  categoryBreakdown,
  spendingTrends,
  appSpending,
  dailySpending,
  financialHealth,
} from "./tools/analytics.js";

// ── Lookup tools ─────────────────────────────────────────────────────
import {
  SearchAppsSchema,
  searchApps,
} from "./tools/lookup.js";

// ── Initialize ──────────────────────────────────────────────────────

initFirebase();

const server = new McpServer({
  name: "finbuddy-mcp-server",
  version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════
// EXPENSE TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "finbuddy_list_expenses",
  "List expenses for a user with optional filtering by month, category, or app. Supports pagination and sorting.",
  ListExpensesSchema.shape,
  async (params) => {
    try {
      const result = await listExpenses(ListExpensesSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_get_expense",
  "Get a single expense by ID.",
  GetExpenseSchema.shape,
  async (params) => {
    try {
      const result = await getExpense(GetExpenseSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_add_expense",
  "Add a new expense. Requires amount, category, description, and date. Optionally tag with people IDs and app/platform name.",
  AddExpenseSchema.shape,
  async (params) => {
    try {
      const result = await addExpense(AddExpenseSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_update_expense",
  "Update an existing expense. Provide the expense ID and any fields to change.",
  UpdateExpenseSchema.shape,
  async (params) => {
    try {
      const result = await updateExpense(UpdateExpenseSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_delete_expense",
  "Delete an expense by ID. This action is irreversible.",
  DeleteExpenseSchema.shape,
  async (params) => {
    try {
      const result = await deleteExpense(DeleteExpenseSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// BUDGET TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "finbuddy_list_budgets",
  "List all budget limits for a user.",
  ListBudgetsSchema.shape,
  async (params) => {
    try {
      const result = await listBudgets(ListBudgetsSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_set_budget",
  "Create or update a monthly budget limit for a category. If a budget already exists for the category, it updates the limit.",
  SetBudgetSchema.shape,
  async (params) => {
    try {
      const result = await setBudget(SetBudgetSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_delete_budget",
  "Delete a budget by ID.",
  DeleteBudgetSchema.shape,
  async (params) => {
    try {
      const result = await deleteBudget(DeleteBudgetSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_budget_status",
  "Get budget vs. actual spending status for a month. Shows per-category compliance, over-budget warnings, and uncategorized spending.",
  GetBudgetStatusSchema.shape,
  async (params) => {
    try {
      const result = await getBudgetStatus(GetBudgetStatusSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "finbuddy_spending_summary",
  "Get a spending summary for a month or custom date range. Returns total spent, average transaction, top expenses, and most frequent category.",
  SpendingSummarySchema.shape,
  async (params) => {
    try {
      const result = await spendingSummary(SpendingSummarySchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_category_breakdown",
  "Get spending breakdown by category for a month. Shows amount, count, and percentage per category.",
  CategoryBreakdownSchema.shape,
  async (params) => {
    try {
      const result = await categoryBreakdown(CategoryBreakdownSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_spending_trends",
  "Analyze spending trends over the past N months. Shows monthly totals and month-over-month percentage changes.",
  SpendingTrendsSchema.shape,
  async (params) => {
    try {
      const result = await spendingTrends(SpendingTrendsSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_app_spending",
  "Get spending breakdown by app/platform (Swiggy, Amazon, Uber, etc.) for a month.",
  AppSpendingSchema.shape,
  async (params) => {
    try {
      const result = await appSpending(AppSpendingSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_daily_spending",
  "Get day-by-day spending for a month. Returns daily totals, average daily spend, and peak spending day.",
  DailySpendingSchema.shape,
  async (params) => {
    try {
      const result = await dailySpending(DailySpendingSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

server.tool(
  "finbuddy_financial_health",
  "Calculate a financial health score for a month. Combines budget compliance, spending consistency, and over-budget analysis into an overall score (0-100).",
  FinancialHealthSchema.shape,
  async (params) => {
    try {
      const result = await financialHealth(FinancialHealthSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// LOOKUP TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
  "finbuddy_search_apps",
  "Search the FinBuddy app library to find the exact app name before adding an expense. Use this to look up the correct app name (e.g. search 'blinkit' returns 'Grofers/Blinkit'). Supports filtering by category.",
  SearchAppsSchema.shape,
  async (params) => {
    try {
      const result = searchApps(SearchAppsSchema.parse(params));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: "text", text: `Error: ${msg}` }] };
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("FinBuddy MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
