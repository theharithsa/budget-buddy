# FinBuddy MCP Server

Model Context Protocol (MCP) server for the FinBuddy personal finance app. Provides 15 tools for expense CRUD, budget management, and financial analytics — all backed by Firebase/Firestore.

## Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled (project: `finbuddy-2025`)
- A service account JSON key with Firestore access

## Setup

```bash
cd mcp-server
npm install
npm run build
```

### Firebase Service Account

The server needs a Firebase service account to authenticate with Firestore. Two options:

**Option A** — Place the JSON key in the project:
```
mcp-server/service-account.json
```
The `.vscode/mcp.json` config already points `GOOGLE_APPLICATION_CREDENTIALS` here.

**Option B** — Set the environment variable yourself:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json
```

> **Security**: `service-account.json` is in `.gitignore` — never commit it.

### Generate a Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Save the file as `mcp-server/service-account.json`

## Usage

### VS Code (Copilot Chat)

Already configured in `.vscode/mcp.json`. Just build the server and restart VS Code — the tools appear automatically in Copilot Chat.

### Manual / Inspector

```bash
# Run directly
npm start

# Interactive inspector (test tools in browser)
npm run inspect

# Development mode (no build step)
npm run dev
```

## Tools (15 total)

### Expenses (5 tools)

| Tool | Description |
|------|-------------|
| `finbuddy_list_expenses` | List expenses with optional filters (month, category, app), pagination, and sorting |
| `finbuddy_get_expense` | Get a single expense by ID |
| `finbuddy_add_expense` | Add a new expense (amount, category, description, date + optional peopleIds, app) |
| `finbuddy_update_expense` | Update fields on an existing expense |
| `finbuddy_delete_expense` | Delete an expense (irreversible) |

### Budgets (4 tools)

| Tool | Description |
|------|-------------|
| `finbuddy_list_budgets` | List all budget limits for a user |
| `finbuddy_set_budget` | Create or update a monthly budget limit for a category |
| `finbuddy_delete_budget` | Delete a budget by ID |
| `finbuddy_budget_status` | Budget vs. actual spending — per-category compliance, over-budget warnings |

### Analytics (6 tools)

| Tool | Description |
|------|-------------|
| `finbuddy_spending_summary` | Monthly spending summary — total, average, top expenses, most frequent category |
| `finbuddy_category_breakdown` | Spending breakdown by category with percentages |
| `finbuddy_spending_trends` | Multi-month trend analysis with month-over-month changes |
| `finbuddy_app_spending` | Spending by app/platform (Swiggy, Amazon, etc.) |
| `finbuddy_daily_spending` | Day-by-day spending with peak day detection |
| `finbuddy_financial_health` | Financial health score (0-100) combining budget compliance, consistency, and over-budget analysis |

## All tools require a `userId` parameter

Every tool takes `userId` as the first parameter — this maps to the Firebase Auth UID used in Firestore paths (`/users/{userId}/expenses`, etc.).

## Firestore Collections

```
/users/{userId}/expenses    → Expense documents
/users/{userId}/budgets     → Budget documents
/users/{userId}/templates   → Recurring template documents
/customCategories           → User-created categories
/publicCategories           → Shared/public categories
```

## Development

```bash
# Build
npm run build

# Watch mode (rebuild on changes)
npx tsc --watch

# Test with MCP Inspector
npm run inspect
```

## Tech Stack

- **Runtime**: Node.js (ES modules)
- **MCP SDK**: @modelcontextprotocol/sdk 1.12.1
- **Firebase**: firebase-admin 13.4.0
- **Validation**: Zod 3.25.x
- **Language**: TypeScript 5.8.x
