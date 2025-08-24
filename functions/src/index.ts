/**
 * Budget Buddy - Gemini AI Integration
 * Firebase Functions for intelligent expense management with CORS support
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {GoogleGenerativeAI} from "@google/generative-ai";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
initializeApp();

// Set global options for functions
setGlobalOptions({maxInstances: 10});

// Define secret for Gemini API key
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Format currency in Indian Rupees with proper comma formatting
 */
function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Main chat function for Gemini AI integration with CORS support
 * Handles natural language queries about expenses and budgets
 */
export const chatWithGemini = onCall({
  secrets: [geminiApiKey],
  cors: true, // Enable CORS for all origins
}, async (request) => {
  try {
    const {userId, message, context} = request.data;
    
    // Validate authentication
    if (!request.auth) {
      throw new Error("Authentication required");
    }
    
    if (request.auth.uid !== userId) {
      throw new Error("Unauthorized access");
    }

    logger.info("Processing chat request", {userId, message});

    // Initialize Gemini AI with secret
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());

    // Get user's financial data
    const userData = await getUserFinancialData(userId);
    
    // Create context-aware prompt
    const prompt = createFinancialPrompt(message, userData, context);
    
    // Generate response with Gemini
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});
    const result = await model.generateContent(prompt);
    
    const response = result.response.text();
    
    logger.info("Generated response", {userId, responseLength: response.length});
    
    // Extract actionable items
    const actionItems = extractActionableItems(response);
    
    return {
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      actionItems: actionItems
    };
    
  } catch (error) {
    logger.error("Error in chatWithGemini", {error});
    throw new Error(`AI chat error: ${error}`);
  }
});

/**
 * Get user's financial data from Firestore
 */
async function getUserFinancialData(userId: string): Promise<any> {
  try {
    const db = getFirestore();
    
    // Get recent expenses, budgets, and categories
    const [expensesSnapshot, budgetsSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection(`users/${userId}/expenses`)
        .orderBy('date', 'desc')
        .limit(100)
        .get(),
      db.collection(`users/${userId}/budgets`).get(),
      db.collection(`users/${userId}/customCategories`).get()
    ]);
    
    const expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const budgets = budgetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      expenses,
      budgets,
      categories,
      totalExpenses: expenses.length,
      dateRange: expenses.length > 0 ? {
        oldest: (expenses[expenses.length - 1] as any)?.date,
        newest: (expenses[0] as any)?.date
      } : null
    };
    
  } catch (error) {
    logger.error("Error fetching user data", {userId, error});
    return {
      expenses: [],
      budgets: [],
      categories: [],
      totalExpenses: 0,
      dateRange: null
    };
  }
}

/**
 * Create a context-aware prompt for Gemini AI with proper Indian currency formatting
 */
function createFinancialPrompt(
  userMessage: string, 
  userData: any, 
  context?: any
): string {
  const {expenses, budgets, totalExpenses, dateRange} = userData;
  
  // Calculate spending summary
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthExpenses = expenses.filter((exp: any) => 
    exp.date?.startsWith?.(currentMonth)
  );
  
  const totalCurrentMonth = currentMonthExpenses.reduce(
    (sum: number, exp: any) => sum + (exp.amount || 0), 
    0
  );
  
  // Group expenses by category
  const categoryTotals: {[key: string]: number} = {};
  currentMonthExpenses.forEach((exp: any) => {
    const category = exp.category || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
  });
  
  const prompt = `You are an AI financial assistant for Budget Buddy, a personal expense tracking app. 
You help users understand their spending patterns, manage budgets, and make better financial decisions.

IMPORTANT: Always use Indian Rupees (₹) for all currency amounts. The user is based in India.

CURRENT USER CONTEXT:
- Total expenses tracked: ${totalExpenses}
- Current month (${currentMonth}) expenses: ${formatIndianCurrency(totalCurrentMonth)}
- Current month transactions: ${currentMonthExpenses.length}
- Date range: ${dateRange?.newest || "N/A"} to ${dateRange?.oldest || "N/A"}

RECENT EXPENSES (last 10):
${expenses.slice(0, 10).map((exp: any, idx: number) => 
  `${idx + 1}. ${formatIndianCurrency(exp.amount || 0)} - ${exp.category || "Other"} - ${exp.description || "No description"} (${exp.date || "No date"})`
).join("\n")}

CURRENT MONTH SPENDING BY CATEGORY:
${Object.entries(categoryTotals).map(([cat, amount]) => 
  `- ${cat}: ${formatIndianCurrency(amount as number)}`
).join("\n")}

ACTIVE BUDGETS:
${budgets.length > 0 ? budgets.map((budget: any) => 
  `- ${budget.category || "Unknown"}: ${formatIndianCurrency(budget.amount || 0)} (${budget.period || "monthly"})`
).join("\n") : "No active budgets"}

USER QUESTION: "${userMessage}"

Please provide a helpful, conversational response that:
1. Directly answers their question using their actual financial data
2. Provides specific insights based on their spending patterns
3. Offers actionable advice when appropriate
4. Uses a friendly, encouraging tone
5. Always formats currency in Indian Rupees using proper formatting (e.g., ₹1,23,456.78)
6. Format your response using markdown for better readability:
   - Use **bold** for important numbers or categories
   - Use bullet points for lists
   - Use headers (##) for sections when appropriate
   - Keep it conversational and easy to read
7. Keep responses concise but informative (max 300 words)

If the user is asking to add an expense, respond with guidance on how to do that in the app.
If they're asking about spending patterns, provide specific analysis.
If they want budget advice, give personalized recommendations.

Remember: Be helpful, accurate, and encouraging about their financial journey!`;

  return prompt;
}

/**
 * Extract actionable items from AI response
 */
function extractActionableItems(response: string): any {
  // Simple extraction of potential actions
  const actions = [];
  
  if (response.toLowerCase().includes("add") && response.toLowerCase().includes("expense")) {
    actions.push({type: "add_expense", suggestion: "Add a new expense"});
  }
  
  if (response.toLowerCase().includes("budget")) {
    actions.push({type: "manage_budget", suggestion: "Review budgets"});
  }
  
  if (response.toLowerCase().includes("save") || response.toLowerCase().includes("reduce")) {
    actions.push({type: "save_money", suggestion: "Explore savings tips"});
  }
  
  return actions;
}
