import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let db: Firestore;

/**
 * Initialize Firebase Admin SDK.
 * Uses GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
 * or FIREBASE_SERVICE_ACCOUNT env var (JSON string).
 */
export function initFirebase(): Firestore {
  if (db) return db;

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saJson) {
    const sa: ServiceAccount = JSON.parse(saJson);
    initializeApp({ credential: cert(sa) });
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path
    initializeApp();
  }

  db = getFirestore();
  return db;
}

export function getDb(): Firestore {
  if (!db) throw new Error("Firebase not initialized. Call initFirebase() first.");
  return db;
}

// ── Collection helpers ──────────────────────────────────────────────

export function userExpensesRef(userId: string) {
  return getDb().collection("users").doc(userId).collection("expenses");
}

export function userBudgetsRef(userId: string) {
  return getDb().collection("users").doc(userId).collection("budgets");
}

export function userTemplatesRef(userId: string) {
  return getDb().collection("users").doc(userId).collection("templates");
}

export function customCategoriesRef() {
  return getDb().collection("customCategories");
}

export function publicCategoriesRef() {
  return getDb().collection("publicCategories");
}

// ── Shared types (mirrors src/lib/types.ts) ─────────────────────────

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;        // YYYY-MM-DD
  createdAt: string;   // ISO 8601
  receiptUrl?: string;
  receiptFileName?: string;
  peopleIds?: string[];
  app?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  frequency: "weekly" | "bi-weekly" | "monthly" | "quarterly" | "yearly";
  isDefault: boolean;
  createdAt: string;
}
