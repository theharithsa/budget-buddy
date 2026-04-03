# FinBuddy MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.12.1-8b5cf6?style=flat-square)](https://modelcontextprotocol.io/)
[![Firebase](https://img.shields.io/badge/Firebase%20Admin-13.4.0-ffca28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

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

### Default User ID

To avoid passing `userId` on every tool call, set the `FINBUDDY_USER_ID` environment variable:

```json
// .vscode/mcp.json
{
  "servers": {
    "finbuddy": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${workspaceFolder}/mcp-server/service-account.json",
        "FINBUDDY_USER_ID": "<your-firebase-uid>"
      }
    }
  }
}
```

With this set, all 15 tools will use your UID automatically. You can still override it per-call by passing `userId` explicitly.

Find your UID in Firebase Console → Authentication → Users, or in the browser DevTools console while logged in:
```js
firebase.auth().currentUser.uid
```

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

## User Authentication

`userId` is **optional** on all tools when `FINBUDDY_USER_ID` is set as an environment variable. The resolution order is:

1. `userId` parameter passed to the tool (highest priority)
2. `FINBUDDY_USER_ID` environment variable (fallback)
3. Error if neither is available

This maps to the Firebase Auth UID used in Firestore paths (`/users/{userId}/expenses`, etc.).

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
