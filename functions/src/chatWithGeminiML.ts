/**
 * Enhanced KautilyaAI Chat Function with ML-Powered Intent Classification
 * Supports intelligent data retrieval, analysis, and conversational AI
 */

import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import {GoogleGenerativeAI} from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import { IntentClassifier, QueryIntent } from "./lib/ml/intentClassifier.js";
import { DataFormatter } from "./lib/ml/dataFormatter.js";

// Initialize Firestore (Firebase Admin is initialized in index.ts)
const db = getFirestore();

// Define Gemini API key secret
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Enhanced chat function with ML-powered intent classification
 */
export const chatWithGeminiML = onCall({
  secrets: [geminiApiKey],
  cors: true,
  timeoutSeconds: 60,
  memory: "1GiB",
}, async (request) => {
  try {
    const {userId, message, context: userContext, conversationHistory = []} = request.data;
    
    // Validate authentication
    if (!request.auth || request.auth.uid !== userId) {
      throw new Error("Authentication required");
    }

    logger.info("Processing ML-enhanced chat request", {
      userId, 
      message,
      contextLength: conversationHistory.length
    });

    // Step 1: Classify user intent using ML
    const intent = IntentClassifier.classifyIntent(message);
    
    logger.info("Intent classified", {
      type: intent.type,
      subtype: intent.subtype,
      confidence: intent.confidence,
      responseFormat: intent.responseFormat
    });

    // Step 2: Get user's financial data - use frontend context if available for performance
    let userData;
    if (userContext && userContext.recentExpenses) {
      // Use frontend context for better performance
      userData = {
        expenses: userContext.recentExpenses || [],
        budgets: userContext.activeBudgets || [],
        customPeople: userContext.customPeople || [],
        publicPeople: userContext.publicPeople || [],
        customCategories: [],
        publicCategories: [],
        templates: []
      };
      
      logger.info("Using frontend context", {
        expenses: userData.expenses.length,
        budgets: userData.budgets.length,
        people: userData.customPeople.length + userData.publicPeople.length
      });
    } else {
      // Fallback to Firestore fetch
      userData = await getUserFinancialData(userId);
      logger.info("Fetched from Firestore", {
        expenses: userData.expenses.length,
        budgets: userData.budgets.length
      });
    }
    
    // Step 3: Handle based on intent type
    switch (intent.type) {
      case 'DATA_RETRIEVAL':
        return await handleDataRetrieval(intent, userData, message);
      
      case 'ANALYSIS':
        return await handleAnalysis(intent, userData, message);
      
      case 'CRUD_OPERATION':
        return await handleCRUDOperation(intent, userData, message, userId);
      
      default:
        return await handleGeneralChat(intent, userData, message, conversationHistory);
    }

  } catch (error) {
    logger.error("Enhanced chat error", { error, userId: request.data.userId });
    return {
      success: false,
      error: "Failed to process your request. Please try again.",
      response: "I'm experiencing some technical difficulties. Please try rephrasing your question or try again in a moment."
    };
  }
});

/**
 * Handle data retrieval requests - return structured data
 */
async function handleDataRetrieval(intent: QueryIntent, userData: any, message: string) {
  logger.info("Processing data retrieval request", { intent });
  
  const { parameters } = intent;
  const entity = intent.subtype;
  
  let data = [];
  
  // Get data based on entity type
  switch (entity) {
    case 'expenses':
      data = await filterExpenses(userData.expenses, parameters.filters);
      break;
    case 'budgets':
      data = userData.budgets;
      break;
    case 'categories':
      data = [...userData.customCategories, ...userData.publicCategories];
      break;
    case 'people':
      data = [...userData.customPeople, ...userData.publicPeople];
      break;
    case 'templates':
      data = userData.templates;
      break;
    default:
      data = userData.expenses;
  }
  
  // Apply additional filters if specified
  if (parameters.filters) {
    data = applyAdvancedFilters(data, parameters.filters, entity);
  }
  
  // Sort and limit data
  if (parameters.filters?.limit) {
    data = data.slice(0, parameters.filters.limit);
  }
  
  // Format response based on intent
  const formattedResponse = DataFormatter.formatResponse(intent, data, message, userData);
  
  return {
    success: true,
    response: formattedResponse.content,
    metadata: formattedResponse.metadata,
    intentType: 'DATA_RETRIEVAL',
    dataCount: data.length,
    entity: entity
  };
}

/**
 * Handle analysis requests - provide insights and summaries
 */
async function handleAnalysis(intent: QueryIntent, userData: any, message: string) {
  logger.info("Processing analysis request", { intent });
  
  // Initialize Gemini for analysis
  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // Create analysis-specific prompt
  const analysisPrompt = createAnalysisPrompt(message, userData, intent);
  
  // Generate AI analysis
  const result = await model.generateContent(analysisPrompt);
  const response = result.response.text();
  
  // Add data context to response
  const contextInfo = generateAnalysisContext(userData, intent);
  
  return {
    success: true,
    response: response + "\n\n" + contextInfo,
    intentType: 'ANALYSIS',
    analysisType: intent.subtype
  };
}

/**
 * Handle CRUD operations - create, update, delete data
 */
async function handleCRUDOperation(intent: QueryIntent, userData: any, message: string, userId: string) {
  logger.info("Processing CRUD operation", { intent });
  
  // Initialize Gemini for CRUD parsing
  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // Create CRUD-specific prompt
  const crudPrompt = createCRUDPrompt(message, userData, intent);
  
  // Generate CRUD actions
  const result = await model.generateContent(crudPrompt);
  const response = result.response.text();
  
  // Parse and execute actions
  const actionItems = await parseAndExecuteActions(response, userId, userData);
  
  return {
    success: true,
    response: `I've processed your request: ${message}\n\n${response}`,
    executedActions: actionItems,
    intentType: 'CRUD_OPERATION',
    operationType: intent.subtype
  };
}

/**
 * Handle general chat - conversational AI
 */
async function handleGeneralChat(intent: QueryIntent, userData: any, message: string, conversationHistory: any[]) {
  logger.info("Processing general chat", { intent });
  
  // Initialize Gemini for conversation
  const genAI = new GoogleGenerativeAI(geminiApiKey.value());
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // Create conversational prompt with context
  const conversationalPrompt = createConversationalPrompt(message, userData, conversationHistory);
  
  // Generate response
  const result = await model.generateContent(conversationalPrompt);
  const response = result.response.text();
  
  return {
    success: true,
    response: response,
    intentType: 'GENERAL_CHAT',
    subtype: intent.subtype
  };
}

/**
 * Filter expenses based on parameters
 */
async function filterExpenses(expenses: any[], filters: any) {
  if (!filters) return expenses;
  
  let filtered = [...expenses];
  
  // Date range filter
  if (filters.dateRange) {
    const start = new Date(filters.dateRange.start);
    const end = new Date(filters.dateRange.end);
    filtered = filtered.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= start && expDate <= end;
    });
  }
  
  // Category filter
  if (filters.category) {
    filtered = filtered.filter(exp => 
      exp.category.toLowerCase().includes(filters.category.toLowerCase())
    );
  }
  
  // Amount filter
  if (filters.amount) {
    if (filters.amount.min) {
      filtered = filtered.filter(exp => exp.amount >= filters.amount.min);
    }
    if (filters.amount.max) {
      filtered = filtered.filter(exp => exp.amount <= filters.amount.max);
    }
  }
  
  // People filter
  if (filters.people && filters.people.length > 0) {
    filtered = filtered.filter(exp => 
      exp.peopleIds && exp.peopleIds.some((id: string) => filters.people.includes(id))
    );
  }
  
  return filtered;
}

/**
 * Apply advanced filters to any data type
 */
function applyAdvancedFilters(data: any[], filters: any, entity: string) {
  if (!filters) return data;
  
  const filtered = [...data];
  
  // Sort by date (most recent first)
  if (entity === 'expenses') {
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  return filtered;
}

/**
 * Create analysis-specific prompt
 */
function createAnalysisPrompt(message: string, userData: any, intent: QueryIntent): string {
  const { expenses, budgets } = userData;
  
  let prompt = `You are KautilyaAI, an expert financial analyst. The user wants ANALYSIS, not raw data.\n\n`;
  prompt += `ANALYSIS REQUEST: "${message}"\n\n`;
  prompt += `USER'S FINANCIAL DATA:\n`;
  prompt += `- Total Expenses: ${expenses.length} entries\n`;
  prompt += `- Active Budgets: ${budgets.length}\n`;
  prompt += `- Total Spending: ₹${expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0).toLocaleString()}\n\n`;
  
  // Add specific analysis context
  switch (intent.subtype) {
    case 'trend_analysis':
      prompt += `Focus on: Spending trends, patterns over time, growth/decline analysis\n`;
      break;
    case 'budget_analysis':
      prompt += `Focus on: Budget performance, overspending, remaining amounts, compliance\n`;
      break;
    case 'category_analysis':
      prompt += `Focus on: Category-wise spending, top categories, distribution analysis\n`;
      break;
    default:
      prompt += `Provide comprehensive financial insights and recommendations\n`;
  }
  
  prompt += `\nProvide detailed analysis with specific numbers, trends, and actionable recommendations.`;
  
  return prompt;
}

/**
 * Create CRUD-specific prompt
 */
function createCRUDPrompt(message: string, userData: any, intent: QueryIntent): string {
  let prompt = `You are KautilyaAI CRUD processor. Extract actionable operations from user input.\n\n`;
  prompt += `USER REQUEST: "${message}"\n\n`;
  prompt += `OPERATION TYPE: ${intent.subtype}\n\n`;
  prompt += `Extract and format as JSON array with operations. Example:\n`;
  prompt += `[{"type": "ADD_EXPENSE", "data": {"amount": 150, "category": "food", "description": "lunch"}}]\n\n`;
  prompt += `Available categories: ${userData.customCategories.map((c: any) => c.name).join(', ')}\n`;
  prompt += `Available people: ${userData.customPeople.map((p: any) => p.name).join(', ')}\n`;
  
  return prompt;
}

/**
 * Create conversational prompt
 */
function createConversationalPrompt(message: string, userData: any, conversationHistory: any[]): string {
  let prompt = `You are KautilyaAI, a wise financial co-pilot inspired by ancient Arthashastra principles.\n\n`;
  prompt += `USER QUESTION: "${message}"\n\n`;
  prompt += `CONTEXT: User has ${userData.expenses.length} expenses, ${userData.budgets.length} budgets\n`;
  
  // Add conversation history
  if (conversationHistory.length > 0) {
    prompt += `\nRECENT CONVERSATION:\n`;
    conversationHistory.slice(-3).forEach((msg: any) => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }
  
  prompt += `\nProvide helpful, wise financial guidance with practical advice.`;
  
  return prompt;
}

/**
 * Generate analysis context
 */
function generateAnalysisContext(userData: any, intent: QueryIntent): string {
  const { expenses, budgets } = userData;
  const totalSpending = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  
  let context = `\n📊 **Analysis Context:**\n`;
  context += `• Total Entries Analyzed: ${expenses.length}\n`;
  context += `• Total Amount: ₹${totalSpending.toLocaleString()}\n`;
  context += `• Active Budgets: ${budgets.length}\n`;
  
  return context;
}

/**
 * Parse and execute CRUD actions (simplified for demo)
 */
async function parseAndExecuteActions(response: string, userId: string, userData: any): Promise<any[]> {
  // This would contain the actual CRUD execution logic
  // For now, return mock actions
  return [
    {
      type: 'CRUD_PROCESSED',
      success: true,
      summary: 'Action processed successfully'
    }
  ];
}

/**
 * Get user's financial data (same as before)
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
      db.collection(`users/${userId}/expenses`).orderBy('date', 'desc').limit(200).get(),
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

    // Also get public data
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
