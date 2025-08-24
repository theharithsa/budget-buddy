/**
 * Budget Buddy - Wisdom-Enhanced AI (CRUD Operations Disabled)
 * Firebase Functions for KautilyaAI wisdom testing
 */

import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import {GoogleGenerativeAI} from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import { createWisdomEnhancedPrompt, generateActionWisdom, getDailyWisdom } from "./lib/wisdom/simpleWisdom.js";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Define Gemini API key secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Get user's financial data for context (read-only)
 */
async function getUserFinancialData(userId: string) {
  try {
    const [expensesSnapshot, budgetsSnapshot] = await Promise.all([
      db.collection(`users/${userId}/expenses`).get(),
      db.collection(`users/${userId}/budgets`).get()
    ]);

    const expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const budgets = budgetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { expenses, budgets };
  } catch (error) {
    logger.error("Error fetching user data", { error, userId });
    return { expenses: [], budgets: [] };
  }
}

/**
 * Create financial prompt with user context
 */
function createFinancialPrompt(message: string, userData: any, context: any) {
  const { expenses = [], budgets = [] } = userData;
  
  let prompt = `You are KautilyaAI, a wise financial assistant. Here's the user's financial context:\n\n`;
  
  if (expenses.length > 0) {
    const recentExpenses = expenses.slice(-10);
    prompt += `Recent Expenses:\n`;
    recentExpenses.forEach((expense: any) => {
      prompt += `- ${expense.description || 'Expense'}: ₹${expense.amount} (${expense.category}) on ${expense.date}\n`;
    });
    prompt += `\n`;
  }
  
  if (budgets.length > 0) {
    prompt += `Current Budgets:\n`;
    budgets.forEach((budget: any) => {
      prompt += `- ${budget.category}: ₹${budget.limit} ${budget.period}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `User's Question: ${message}\n\n`;
  prompt += `Please provide financial guidance combining ancient wisdom with modern insights.`;
  
  return prompt;
}

/**
 * Extract actionable items from response
 */
function extractActionableItems(response: string): any[] {
  const items: any[] = [];
  const suggestions = response.match(/(?:consider|try|recommend|suggest)([^.]*)/gi);
  
  if (suggestions) {
    suggestions.forEach((suggestion, index) => {
      items.push({
        id: index,
        suggestion: suggestion.trim(),
        priority: 'medium'
      });
    });
  }
  
  return items;
}

/**
 * Enhanced chat function with wisdom integration (CRUD disabled)
 */
export const chatWithGemini = onCall({
  secrets: [geminiApiKey],
  cors: true,
}, async (request) => {
  try {
    const {userId, message, context, conversationHistory = []} = request.data;
    
    // Validate authentication
    if (!request.auth || request.auth.uid !== userId) {
      throw new Error("Authentication required");
    }

    logger.info("Processing wisdom-enhanced chat request", {
      userId, 
      message,
      contextLength: conversationHistory.length
    });

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());

    // Get user's financial data for context
    const userData = await getUserFinancialData(userId);
    
    // Create wisdom-enhanced prompt
    const basePrompt = createFinancialPrompt(message, userData, context);
    const wisdomEnhancedPrompt = createWisdomEnhancedPrompt(
      message, 
      userData.expenses || [], 
      userData.budgets || [], 
      basePrompt
    );
    
    // Generate response with Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        candidateCount: 1,
      },
      systemInstruction: "You are KautilyaAI, an intelligent financial assistant combining ancient wisdom with modern financial expertise. CRUD operations are disabled - focus on providing wisdom-based guidance and analysis only."
    });
    
    // Enhanced prompt with instructions
    const enhancedPrompt = `${wisdomEnhancedPrompt}\n\nIMPORTANT:
1. Respond ONLY in English
2. CRUD operations are disabled - provide guidance and analysis only
3. If users request data modifications, explain these features are being enhanced
4. Focus on wisdom-based financial advice and insights
5. Include relevant Arthashastra principles naturally in your response`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    logger.info("Generated wisdom-enhanced response", {userId, responseLength: response.length});
    
    // Generate wisdom suggestions (no CRUD actions)
    const wisdomSuggestions = [generateActionWisdom('chat_query')];
    
    // Extract actionable items (informational only)
    const actionItems = extractActionableItems(response);
    
    return {
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      actionItems: actionItems,
      executedActions: [], // Empty - no CRUD operations
      wisdomSuggestions: wisdomSuggestions,
      dailyWisdom: getDailyWisdom(),
      mode: 'wisdom-only' // Indicates CRUD is disabled
    };
    
  } catch (error) {
    logger.error("Error in wisdom-enhanced chat", {error});
    throw new Error(`KautilyaAI error: ${error}`);
  }
});

/**
 * Get financial insights with wisdom for dashboard
 */
export const getFinancialInsights = onCall({
  cors: true,
}, async (request) => {
  try {
    const { userId } = request.data;
    
    // Validate authentication
    if (!request.auth || request.auth.uid !== userId) {
      throw new Error("Authentication required");
    }

    // Get user's financial data
    const userData = await getUserFinancialData(userId);
    const expenses = userData.expenses || [];
    const budgets = userData.budgets || [];

    // Analyze current month expenses
    const currentDate = new Date();
    const currentMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentDate.getMonth() && 
             expenseDate.getFullYear() === currentDate.getFullYear();
    });

    const totalExpenses = currentMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    
    // Calculate budget performance
    const budgetPerformance = budgets.map((budget: any) => {
      const categoryExpenses = currentMonthExpenses
        .filter((exp: any) => exp.category === budget.category)
        .reduce((sum: number, exp: any) => sum + exp.amount, 0);
      
      return {
        category: budget.category,
        spent: categoryExpenses,
        limit: budget.limit,
        remaining: budget.limit - categoryExpenses,
        percentage: budget.limit > 0 ? (categoryExpenses / budget.limit) * 100 : 0
      };
    });

    // Generate insights
    const insights = [];
    const overBudgetCategories = budgetPerformance.filter(bp => bp.percentage > 100);
    
    if (overBudgetCategories.length > 0) {
      insights.push(`Following Kautilya's principle of balance, you're over budget in ${overBudgetCategories.length} categories`);
    }
    
    if (totalExpenses === 0) {
      insights.push("Begin tracking expenses to gain financial wisdom - 'Knowledge is the foundation of prosperity'");
    } else {
      insights.push(`Total monthly spending: ₹${totalExpenses.toLocaleString()} - practice 'Mitavyaya' (moderate spending)`);
    }

    // Generate recommendations
    const recommendations = [];
    if (overBudgetCategories.length > 0) {
      recommendations.push("Apply 'Arthagama Vyaya' - ensure income exceeds expenditure in all categories");
    }
    recommendations.push("Build your 'Kosha' (treasury) through systematic savings");

    return {
      success: true,
      insights: {
        totalExpenses,
        budgetPerformance,
        insights,
        recommendations,
        wisdomOfTheDay: getDailyWisdom(),
        monthlyTrend: calculateMonthlyTrend(expenses),
        mode: 'wisdom-only'
      }
    };

  } catch (error) {
    logger.error("Error in getFinancialInsights", { error });
    throw new Error(`Financial insights error: ${error}`);
  }
});

/**
 * Calculate monthly spending trend
 */
function calculateMonthlyTrend(expenses: any[]): string {
  if (expenses.length < 2) return "Start tracking to see trends";
  
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  
  const currentMonthTotal = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentDate.getMonth() && 
             expDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const lastMonthTotal = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === lastMonth.getMonth() && 
             expDate.getFullYear() === lastMonth.getFullYear();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  if (lastMonthTotal === 0) return "First month of financial tracking";
  
  const change = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  
  if (change > 10) return "Increasing - consider Mitavyaya (moderation)";
  if (change < -10) return "Decreasing - good financial discipline";
  return "Stable - maintaining balance";
}
