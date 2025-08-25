/**
 * Budget Buddy - Enhanced AI with ML Intent Classification
 * Firebase Functions for KautilyaAI with intelligent data handling
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
 * Get user's financial data for context (comprehensive read-only)
 */
async function getUserFinancialData(userId: string) {
  try {
    const [
      expensesSnapshot, 
      budgetsSnapshot, 
      customCategoriesSnapshot,
      customPeopleSnapshot,
      templatesSnapshot
    ] = await Promise.all([
      db.collection(`users/${userId}/expenses`).orderBy('date', 'desc').limit(100).get(),
      db.collection(`users/${userId}/budgets`).get(),
      db.collection('customCategories').where('userId', '==', userId).get(),
      db.collection('customPeople').where('userId', '==', userId).get(),
      db.collection(`users/${userId}/templates`).get()
    ]);

    const expenses = expensesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const budgets = budgetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const customCategories = customCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const customPeople = customPeopleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Also get public categories and people for context
    const [publicCategoriesSnapshot, publicPeopleSnapshot] = await Promise.all([
      db.collection('publicCategories').get(),
      db.collection('publicPeople').get()
    ]);

    const publicCategories = publicCategoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const publicPeople = publicPeopleSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { 
      expenses, 
      budgets, 
      customCategories,
      customPeople,
      templates,
      publicCategories,
      publicPeople
    };
  } catch (error) {
    logger.error("Error fetching user data", { error, userId });
    return { 
      expenses: [], 
      budgets: [], 
      customCategories: [],
      customPeople: [],
      templates: [],
      publicCategories: [],
      publicPeople: []
    };
  }
}

/**
 * Create comprehensive financial prompt with user context
 */
function createFinancialPrompt(message: string, userData: any, context: any) {
  const { 
    expenses = [], 
    budgets = [], 
    customCategories = [],
    customPeople = [],
    templates = [],
    publicCategories = [],
    publicPeople = []
  } = userData;
  
  let prompt = `You are KautilyaAI, a wise financial assistant. Here's the user's comprehensive financial context:\n\n`;
  
  // Recent expenses with detailed context
  if (expenses.length > 0) {
    const recentExpenses = expenses.slice(0, 15); // Last 15 expenses
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    
    prompt += `RECENT FINANCIAL ACTIVITY:\n`;
    prompt += `Total tracked expenses: ${expenses.length} entries (₹${totalExpenses.toLocaleString()} total)\n\n`;
    
    prompt += `Latest Expenses:\n`;
    recentExpenses.forEach((expense: any, index: number) => {
      const peopleInfo = expense.peopleIds ? ` [shared with ${expense.peopleIds.length} people]` : '';
      prompt += `${index + 1}. ${expense.description || 'Expense'}: ₹${expense.amount} (${expense.category}) on ${expense.date}${peopleInfo}\n`;
    });
    prompt += `\n`;
    
    // Spending patterns
    const categoryTotals = expenses.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5);
    
    prompt += `TOP SPENDING CATEGORIES:\n`;
    topCategories.forEach(([category, amount], index) => {
      prompt += `${index + 1}. ${category}: ₹${(amount as number).toLocaleString()}\n`;
    });
    prompt += `\n`;
  }
  
  // Budget information
  if (budgets.length > 0) {
    prompt += `ACTIVE BUDGETS:\n`;
    budgets.forEach((budget: any) => {
      const spent = expenses
        .filter((exp: any) => exp.category === budget.category)
        .reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const remaining = budget.limit - spent;
      const percentage = budget.limit > 0 ? (spent / budget.limit * 100).toFixed(1) : 0;
      
      prompt += `- ${budget.category}: ₹${spent.toLocaleString()} / ₹${budget.limit.toLocaleString()} (${percentage}% used, ₹${remaining.toLocaleString()} remaining) [${budget.period}]\n`;
    });
    prompt += `\n`;
  } else {
    prompt += `BUDGETS: No budgets set up yet - opportunity for financial planning\n\n`;
  }
  
  // Custom categories and people for context
  const totalCategories = [...customCategories, ...publicCategories];
  const totalPeople = [...customPeople, ...publicPeople];
  
  if (totalCategories.length > 0) {
    prompt += `AVAILABLE CATEGORIES: ${totalCategories.length} total (${customCategories.length} custom, ${publicCategories.length} public)\n`;
  }
  
  if (totalPeople.length > 0) {
    prompt += `PEOPLE NETWORK: ${totalPeople.length} people available (${customPeople.length} custom, ${publicPeople.length} public)\n`;
  }
  
  if (templates.length > 0) {
    prompt += `RECURRING PATTERNS: ${templates.length} expense templates available\n`;
  }
  
  prompt += `\nUSER'S QUESTION: "${message}"\n\n`;
  prompt += `GUIDANCE INSTRUCTION: Provide financial wisdom combining Arthashastra principles with modern insights, using the above context to make personalized recommendations. Reference specific spending patterns, budget performance, and financial behaviors observed in the data.`;
  
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
 * Enhanced chat function with intelligent data handling
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

    logger.info("Processing intelligent chat request", {
      userId, 
      message,
      contextLength: conversationHistory.length
    });

    // Get user's financial data for context
    const userData = await getUserFinancialData(userId);
    
    // INTELLIGENT INTENT DETECTION - Check if user wants raw data listing
    const messageText = message.toLowerCase().trim();
    const isDataListingRequest = (
      messageText.includes('list all') || 
      messageText.includes('show all') ||
      messageText.includes('display all') ||
      messageText.includes('list my') ||
      messageText.includes('show my') ||
      (messageText.includes('expenses') && (messageText.includes('list') || messageText.includes('show'))) ||
      (messageText.includes('budgets') && (messageText.includes('list') || messageText.includes('show'))) ||
      messageText.match(/^(all|my)\s+(expenses|budgets|transactions)/)
    );

    // HANDLE DATA LISTING REQUESTS
    if (isDataListingRequest) {
      logger.info("Detected data listing request", { message: messageText });
      
      let dataResponse = '';
      let dataCount = 0;
      
      if (messageText.includes('expense') || messageText.includes('transaction')) {
        const expenses = userData.expenses || [];
        dataCount = expenses.length;
        
        if (expenses.length === 0) {
          dataResponse = "🔍 **Your Expenses**\n\nNo expenses found. Start tracking your spending to build your financial foundation!";
        } else {
          const totalAmount = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
          const averageAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;
          
          dataResponse = `💰 **Your Expenses** (${expenses.length} entries)\n`;
          dataResponse += `📊 **Total Amount:** ₹${totalAmount.toLocaleString()}\n`;
          dataResponse += `📈 **Average:** ₹${averageAmount.toLocaleString()}\n\n`;
          
          // Show recent 20 expenses in structured format
          const recentExpenses = expenses.slice(0, 20);
          recentExpenses.forEach((expense: any, index: number) => {
            const peopleInfo = expense.peopleIds && expense.peopleIds.length > 0 
              ? ` | 👥 ${expense.peopleIds.length} people` 
              : '';
            dataResponse += `**${index + 1}.** ${expense.description || 'Expense'}\n`;
            dataResponse += `   💰 **₹${expense.amount.toLocaleString()}** | 🏷️ ${expense.category} | 📅 ${expense.date}${peopleInfo}\n\n`;
          });
          
          if (expenses.length > 20) {
            dataResponse += `... and ${expenses.length - 20} more expenses\n\n`;
          }
        }
      } else if (messageText.includes('budget')) {
        const budgets = userData.budgets || [];
        const expenses = userData.expenses || [];
        dataCount = budgets.length;
        
        if (budgets.length === 0) {
          dataResponse = "📋 **Your Budgets**\n\nNo budgets set up yet. Create budgets to manage your spending effectively!";
        } else {
          dataResponse = `📋 **Your Budgets** (${budgets.length} active)\n\n`;
          
          budgets.forEach((budget: any, index: number) => {
            const spent = expenses
              .filter((exp: any) => exp.category === budget.category)
              .reduce((sum: number, exp: any) => sum + exp.amount, 0);
            const remaining = budget.limit - spent;
            const percentage = budget.limit > 0 ? (spent / budget.limit * 100).toFixed(1) : '0';
            
            dataResponse += `**${index + 1}.** ${budget.category} Budget\n`;
            dataResponse += `   💰 **₹${spent.toLocaleString()} / ₹${budget.limit.toLocaleString()}** (${percentage}% used)\n`;
            dataResponse += `   💳 **Remaining:** ₹${remaining.toLocaleString()} | 📅 Period: ${budget.period || 'Monthly'}\n\n`;
          });
        }
      }
      
      return {
        success: true,
        response: dataResponse,
        timestamp: new Date().toISOString(),
        actionItems: [],
        executedActions: [],
        metadata: {
          dataCount,
          intentType: 'DATA_RETRIEVAL',
          responseFormat: 'RAW_DATA'
        },
        mode: 'data-listing'
      };
    }

    // HANDLE ANALYSIS AND WISDOM REQUESTS (existing functionality)
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    
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
        temperature: 0.2,
        topP: 0.8,
        topK: 30,
        maxOutputTokens: 1024,
        candidateCount: 1,
      },
      systemInstruction: "You are KautilyaAI, an intelligent financial assistant combining ancient wisdom with modern financial expertise. Provide insightful analysis and wisdom-based guidance. Always be CONCISE and DIRECT in your responses."
    });
    
    // Enhanced prompt with instructions
    const enhancedPrompt = `${wisdomEnhancedPrompt}\n\nIMPORTANT:
1. Respond ONLY in English
2. Focus on financial analysis and wisdom-based insights
3. Include relevant Arthashastra principles naturally in your response
4. Keep responses CONCISE and SHARP - maximum 3-4 sentences per point
5. Use bullet points for lists and clear, direct language
6. Provide actionable insights and recommendations`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response.text();
    
    logger.info("Generated wisdom-enhanced response", {userId, responseLength: response.length});
    
    // Generate wisdom suggestions
    const wisdomSuggestions = [generateActionWisdom('chat_query')];
    
    // Extract actionable items
    const actionItems = extractActionableItems(response);
    
    return {
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
      actionItems: actionItems,
      executedActions: [], 
      wisdomSuggestions: wisdomSuggestions,
      dailyWisdom: getDailyWisdom(),
      metadata: {
        intentType: 'ANALYSIS',
        responseFormat: 'AI_INSIGHTS'
      },
      mode: 'wisdom-analysis'
    };
    
  } catch (error) {
    logger.error("Error in enhanced chat", {error});
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

    // Get comprehensive user financial data
    const userData = await getUserFinancialData(userId);
    const expenses = userData.expenses || [];
    const budgets = userData.budgets || [];
    const customCategories = userData.customCategories || [];
    const customPeople = userData.customPeople || [];
    const templates = userData.templates || [];
    
    // Analyze current month expenses
    const currentDate = new Date();
    const currentMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentDate.getMonth() && 
             expenseDate.getFullYear() === currentDate.getFullYear();
    });

    const totalExpenses = currentMonthExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    
    // Enhanced category analysis
    const categorySpending = currentMonthExpenses.reduce((acc: any, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    const topCategories = Object.entries(categorySpending)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 5);

    // Calculate budget performance with wisdom insights
    const budgetPerformance = budgets.map((budget: any) => {
      const categoryExpenses = currentMonthExpenses
        .filter((exp: any) => exp.category === budget.category)
        .reduce((sum: number, exp: any) => sum + exp.amount, 0);
      
      const percentage = budget.limit > 0 ? (categoryExpenses / budget.limit) * 100 : 0;
      
      return {
        category: budget.category,
        spent: categoryExpenses,
        limit: budget.limit,
        remaining: budget.limit - categoryExpenses,
        percentage,
        wisdomLevel: percentage > 100 ? 'critical' : 
                    percentage > 80 ? 'warning' : 
                    percentage > 50 ? 'moderate' : 'excellent'
      };
    });

    // Shared expenses analysis
    const sharedExpenses = currentMonthExpenses.filter((exp: any) => 
      exp.peopleIds && exp.peopleIds.length > 0
    );
    const sharedAmount = sharedExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    // Template usage analysis
    const templateUsage = templates.map((template: any) => {
      const templateExpenses = currentMonthExpenses.filter((exp: any) => 
        exp.category === template.category && 
        Math.abs(exp.amount - template.amount) < 50
      );
      return {
        template: template.description,
        usageCount: templateExpenses.length,
        category: template.category
      };
    });

    // Generate comprehensive insights with Kautilya wisdom
    const insights = [];
    const overBudgetCategories = budgetPerformance.filter(bp => bp.percentage > 100);
    const excellentCategories = budgetPerformance.filter(bp => bp.percentage < 50);
    
    if (overBudgetCategories.length > 0) {
      insights.push(`🚨 Applying Kautilya's 'Vyaya Niyantrana' (expense control): ${overBudgetCategories.length} categories exceed limits`);
    }
    
    if (excellentCategories.length > 0) {
      insights.push(`✅ Following 'Mitavyaya' (moderate spending) excellently in ${excellentCategories.length} categories`);
    }
    
    if (totalExpenses === 0) {
      insights.push("💡 'Gyana eva param balam' - Knowledge is supreme power. Begin tracking to gain financial wisdom");
    } else {
      insights.push(`💰 Monthly expenditure: ₹${totalExpenses.toLocaleString()} - Practice 'Arthagama Vyaya' (income exceeds expenses)`);
    }

    if (sharedAmount > 0) {
      insights.push(`🤝 Shared expenses: ₹${sharedAmount.toLocaleString()} - 'Sahayoga' (cooperation) in financial matters`);
    }

    if (topCategories.length > 0) {
      const [topCategory, topAmount] = topCategories[0];
      insights.push(`📊 Primary expense: ${topCategory} (₹${(topAmount as number).toLocaleString()}) - Focus your 'Vyaya Niyantrana' here`);
    }

    // Generate wisdom-based recommendations
    const recommendations = [];
    
    if (overBudgetCategories.length > 0) {
      recommendations.push("🎯 'Kosh Samrakshana' - Protect your treasury by reducing expenses in over-budget categories");
    }
    
    if (customCategories.length > 0) {
      recommendations.push(`📋 You've created ${customCategories.length} custom categories - 'Vyavasthapana' (organization) leads to prosperity`);
    }
    
    if (templates.length > 0) {
      recommendations.push(`⚡ ${templates.length} expense templates available - Use 'Purvayojana' (pre-planning) for efficiency`);
    }
    
    if (customPeople.length > 0) {
      recommendations.push(`👥 ${customPeople.length} people in your financial network - 'Mitra Yoga' (friendship) in financial planning`);
    }
    
    recommendations.push("💎 Build your 'Rajya Kosha' (royal treasury) through systematic wealth accumulation");
    
    // Calculate spending efficiency score
    const budgetedCategories = budgetPerformance.filter(bp => bp.limit > 0);
    const averageUtilization = budgetedCategories.length > 0 
      ? budgetedCategories.reduce((sum, bp) => sum + bp.percentage, 0) / budgetedCategories.length 
      : 0;
    
    const efficiencyScore = Math.max(0, 100 - Math.abs(averageUtilization - 75)); // Optimal is 75% utilization

    return {
      success: true,
      insights: {
        totalExpenses,
        budgetPerformance,
        categoryAnalysis: {
          topCategories: topCategories.map(([cat, amount]) => ({ 
            category: cat as string, 
            amount: amount as number 
          })),
          customCategoriesCount: customCategories.length,
          totalCategories: Object.keys(categorySpending).length
        },
        sharedExpenses: {
          count: sharedExpenses.length,
          totalAmount: sharedAmount,
          networkSize: customPeople.length
        },
        templateInsights: {
          availableTemplates: templates.length,
          mostUsed: templateUsage.sort((a, b) => b.usageCount - a.usageCount).slice(0, 3)
        },
        financialHealth: {
          efficiencyScore: Math.round(efficiencyScore),
          budgetCompliance: overBudgetCategories.length === 0,
          diversification: Object.keys(categorySpending).length
        },
        insights,
        recommendations,
        wisdomOfTheDay: getDailyWisdom(),
        monthlyTrend: calculateMonthlyTrend(expenses),
        mode: 'comprehensive-wisdom-analysis'
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
