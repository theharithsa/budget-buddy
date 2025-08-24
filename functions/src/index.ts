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
    
    // Get recent expenses, budgets, categories, and people data
    const [expensesSnapshot, budgetsSnapshot, categoriesSnapshot, customPeopleSnapshot, publicPeopleSnapshot] = await Promise.all([
      db.collection(`users/${userId}/expenses`)
        .orderBy('date', 'desc')
        .limit(100)
        .get(),
      db.collection(`users/${userId}/budgets`).get(),
      db.collection(`users/${userId}/customCategories`).get(),
      db.collection(`users/${userId}/customPeople`).get(),
      db.collection('publicPeople').limit(50).get() // Limit public people for performance
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

    const customPeople = customPeopleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const publicPeople = publicPeopleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Combine people data (custom people take priority over public people with same ID)
    const customIds = new Set(customPeople.map((p: any) => p.id));
    const uniquePublicPeople = publicPeople.filter((p: any) => !customIds.has(p.id));
    const allPeople = [...customPeople, ...uniquePublicPeople];

    return {
      expenses,
      budgets,
      categories,
      customPeople,
      publicPeople,
      allPeople,
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
      customPeople: [],
      publicPeople: [],
      allPeople: [],
      totalExpenses: 0,
      dateRange: null
    };
  }
}/**
 * Create a context-aware prompt for Gemini AI with proper Indian currency formatting
 */
function createFinancialPrompt(
  userMessage: string, 
  userData: any, 
  context?: any
): string {
  const {expenses, budgets, allPeople, customPeople, totalExpenses, dateRange} = userData;
  
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

  // Analyze expenses by people (shared expenses)
  const expensesWithPeople = expenses.filter((exp: any) => exp.people && exp.people.length > 0);
  const peopleSpending: {[key: string]: {amount: number, count: number}} = {};
  
  expensesWithPeople.forEach((exp: any) => {
    exp.people.forEach((personId: string) => {
      const person = allPeople.find((p: any) => p.id === personId);
      const personName = person ? person.name : `Person ${personId}`;
      if (!peopleSpending[personName]) {
        peopleSpending[personName] = {amount: 0, count: 0};
      }
      peopleSpending[personName].amount += (exp.amount || 0);
      peopleSpending[personName].count += 1;
    });
  });

  const prompt = `You are an AI financial assistant for Budget Buddy, a personal expense tracking app. 
You help users understand their spending patterns, manage budgets, make better financial decisions, and track shared expenses with people.

IMPORTANT: Always use Indian Rupees (₹) for all currency amounts. The user is based in India.

CURRENT USER CONTEXT:
- Total expenses tracked: ${totalExpenses}
- Current month (${currentMonth}) expenses: ${formatIndianCurrency(totalCurrentMonth)}
- Current month transactions: ${currentMonthExpenses.length}
- Date range: ${dateRange?.newest || "N/A"} to ${dateRange?.oldest || "N/A"}

PEOPLE MANAGEMENT:
- Custom people created: ${customPeople.length}
- Total people available: ${allPeople.length}
- Shared expenses: ${expensesWithPeople.length} out of ${totalExpenses} total expenses

YOUR PEOPLE:
${allPeople.length > 0 ? allPeople.slice(0, 10).map((person: any) => 
  `- ${person.name} (${person.relationship || "Unknown relationship"}) ${person.icon || "👤"}`
).join("\n") : "No people added yet"}

SPENDING WITH PEOPLE (Current Month):
${Object.keys(peopleSpending).length > 0 ? Object.entries(peopleSpending).map(([name, data]) => 
  `- ${name}: ${formatIndianCurrency(data.amount)} across ${data.count} expenses`
).join("\n") : "No shared expenses this month"}

RECENT EXPENSES (last 10):
${expenses.slice(0, 10).map((exp: any, idx: number) => {
  const sharedWith = exp.people && exp.people.length > 0 
    ? ` (shared with ${exp.people.map((id: string) => {
        const person = allPeople.find((p: any) => p.id === id);
        return person ? person.name : `Person ${id}`;
      }).join(", ")})`
    : "";
  return `${idx + 1}. ${formatIndianCurrency(exp.amount || 0)} - ${exp.category || "Other"} - ${exp.description || "No description"}${sharedWith} (${exp.date || "No date"})`;
}).join("\n")}

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
2. Provides specific insights based on their spending patterns and people relationships
3. Offers actionable advice when appropriate about both spending and people management
4. Uses a friendly, encouraging tone
5. Always formats currency in Indian Rupees using proper formatting (e.g., ₹1,23,456.78)
6. Format your response using markdown for better readability:
   - Use **bold** for important numbers or categories
   - Use bullet points for lists
   - Use headers (##) for sections when appropriate
   - Keep it conversational and easy to read
7. Keep responses concise but informative (max 300 words)

PEOPLE MODULE CAPABILITIES:
- Users can add, edit, and delete custom people with names, icons, colors, and relationships
- People can be marked as public to share with other users
- Expenses can be associated with multiple people to track shared costs
- Default people are available (Self, Family, Friends, etc.)
- Public people library allows adopting people shared by other users

If the user asks about:
- **People management**: Explain how to add/edit people, set relationships, and make them public
- **Shared expenses**: Help them track who they spent money with and analyze patterns
- **Adding people to expenses**: Guide them on associating expenses with specific people
- **Expense splitting**: Suggest ways to track shared costs and settlements
- **People insights**: Analyze spending patterns with different people/relationships

If the user is asking to add an expense, remind them they can associate it with people.
If they're asking about spending patterns, include analysis of shared expenses and people relationships.
If they want budget advice, consider shared expenses in recommendations.

Remember: Be helpful, accurate, and encouraging about their financial journey and relationship-based expense tracking!`;

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
