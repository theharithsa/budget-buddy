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
const db = getFirestore();

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
    
    // Parse and execute CRUD actions from user message
    const { executedActions, updatedResponse } = await parseAndExecuteActions(
      message, 
      response, 
      userId
    );
    
    // Extract actionable items
    const actionItems = extractActionableItems(updatedResponse);
    
    return {
      success: true,
      response: updatedResponse,
      timestamp: new Date().toISOString(),
      actionItems: actionItems,
      executedActions: executedActions
    };
    
  } catch (error) {
    logger.error("Error in chatWithGemini", {error});
    throw new Error(`AI chat error: ${error}`);
  }
});

/**
 * Parse and execute CRUD operations from AI response
 */
async function parseAndExecuteActions(
  userMessage: string,
  response: string, 
  userId: string
): Promise<{executedActions: any[], updatedResponse: string}> {
  const executedActions = [];
  let updatedResponse = response;

  try {
    // Detect Add Expense operations
    const addExpensePatterns = [
      // Pattern 1: "Add ₹150 for lunch in food category"
      /add.*?(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on)?\s*([a-zA-Z\s]+?)\s+(?:in|to|category)\s+([a-zA-Z\s]+?)(?:\s+category)?$/i,
      // Pattern 2: "Add ₹150 lunch food" or "Add ₹150 for lunch food"
      /add.*?(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on)?\s*([a-zA-Z\s]+?)\s+([a-zA-Z\s]+?)$/i,
      // Pattern 3: "Spent ₹150 on lunch in food category"
      /(?:spent?|paid?)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on)\s*([a-zA-Z\s]+?)\s+(?:in|to|category)\s+([a-zA-Z\s]+?)(?:\s+category)?$/i,
      // Pattern 4: Simple "₹150 for lunch food"
      /(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on)\s*([a-zA-Z\s]+?)\s+([a-zA-Z\s]+?)$/i,
      // Pattern 5: Fallback "Add ₹150 for lunch" (category = Other)
      /add.*?(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on)?\s*([a-zA-Z\s]+?)$/i
    ];

    for (const pattern of addExpensePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        const description = match[2]?.trim();
        let category = match[3]?.trim() || 'Other';

        // For the fallback pattern (no category specified), check if description contains category hints
        if (!match[3] && description) {
          const categoryHints = {
            'lunch': 'Food', 'dinner': 'Food', 'breakfast': 'Food', 'coffee': 'Food', 'restaurant': 'Food',
            'taxi': 'Transportation', 'uber': 'Transportation', 'bus': 'Transportation', 'metro': 'Transportation',
            'movie': 'Entertainment', 'game': 'Entertainment', 'music': 'Entertainment',
            'shopping': 'Shopping', 'clothes': 'Shopping', 'buy': 'Shopping',
            'doctor': 'Healthcare', 'medicine': 'Healthcare', 'hospital': 'Healthcare'
          };
          
          for (const [hint, cat] of Object.entries(categoryHints)) {
            if (description.toLowerCase().includes(hint)) {
              category = cat;
              break;
            }
          }
        }

        // Normalize category
        category = normalizeCategory(category);

        // Create expense
        const expenseData = {
          amount,
          description: description || 'Expense',
          category,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };

        // Add to Firestore
        const expenseRef = await db.collection(`users/${userId}/expenses`).add(expenseData);
        
        executedActions.push({
          type: 'add_expense',
          data: { id: expenseRef.id, ...expenseData },
          success: true
        });

        updatedResponse += `\n\n✅ **Expense Added Successfully!**\n- ID: ${expenseRef.id}\n- Amount: ₹${amount.toFixed(2)}\n- Category: ${category}\n- Description: ${description}`;
        break;
      }
    }

    // Detect Add Budget operations
    const addBudgetPatterns = [
      /(?:set|create|add).*?budget.*?(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)\s*(?:for|on|in)?\s*([a-zA-Z\s]+)/i,
      /budget.*?([a-zA-Z\s]+?).*?(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)/i
    ];

    for (const pattern of addBudgetPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        let category = match[2]?.trim();

        if (!amount || !category) continue;

        // Normalize category
        category = normalizeCategory(category);

        // Create budget
        const budgetData = {
          category,
          limit: amount,
          spent: 0,
          month: new Date().toISOString().slice(0, 7)
        };

        // Check if budget exists, update if it does
        const existingBudget = await db.collection(`users/${userId}/budgets`)
          .where('category', '==', category)
          .limit(1)
          .get();

        if (!existingBudget.empty) {
          // Update existing budget
          await existingBudget.docs[0].ref.update({ limit: amount });
          executedActions.push({
            type: 'update_budget',
            data: { id: existingBudget.docs[0].id, category, limit: amount },
            success: true
          });
          updatedResponse += `\n\n✅ **Budget Updated Successfully!**\n- Category: ${category}\n- New Limit: ₹${amount.toFixed(2)}`;
        } else {
          // Add new budget
          const budgetRef = await db.collection(`users/${userId}/budgets`).add(budgetData);
          executedActions.push({
            type: 'add_budget',
            data: { id: budgetRef.id, ...budgetData },
            success: true
          });
          updatedResponse += `\n\n✅ **Budget Created Successfully!**\n- Category: ${category}\n- Limit: ₹${amount.toFixed(2)}`;
        }
        break;
      }
    }

    // Detect Delete operations
    const deletePatterns = [
      /(?:delete|remove)\s*(?:expense|transaction).*?(?:id|#)\s*([a-zA-Z0-9]+)/i,
      /(?:delete|remove)\s*(?:the\s+)?(?:last|recent|latest)\s*(?:expense|transaction)/i,
      /(?:delete|remove)\s*(?:expense|transaction)/i,
      /(?:delete|remove)\s*budget.*?(?:for|from)?\s*([a-zA-Z\s]+)/i,
      /(?:delete|remove)\s*person.*?(?:named?)?\s*([a-zA-Z\s]+)/i,
      /(?:delete|remove)\s*template.*?(?:named?)?\s*([a-zA-Z\s]+)/i,
      /(?:delete|remove)\s*category.*?(?:named?)?\s*([a-zA-Z\s]+)/i
    ];

    for (const pattern of deletePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const identifier = match[1]?.trim();
        
        // Handle expense deletion
        if (userMessage.toLowerCase().includes('expense') || userMessage.toLowerCase().includes('transaction')) {
          
          // Case 1: Delete by specific ID
          if (identifier && identifier.length > 5) {
            try {
              const expenseDoc = await db.collection(`users/${userId}/expenses`).doc(identifier).get();
              if (expenseDoc.exists) {
                await expenseDoc.ref.delete();
                const data = expenseDoc.data();
                executedActions.push({
                  type: 'delete_expense',
                  data: { id: identifier, amount: data?.amount, description: data?.description },
                  success: true
                });
                updatedResponse += `\n\n✅ **Expense Deleted Successfully!**\n- ID: ${identifier}\n- Amount: ₹${data?.amount?.toFixed(2)}\n- Description: ${data?.description}`;
              } else {
                updatedResponse += `\n\n❌ **Expense not found**: ID ${identifier} doesn't exist`;
              }
            } catch (error) {
              updatedResponse += `\n\n❌ **Failed to delete expense**: ${identifier} - ${error}`;
            }
          }
          
          // Case 2: Delete last/recent expense (no ID specified)
          else if (userMessage.toLowerCase().includes('last') || userMessage.toLowerCase().includes('recent') || userMessage.toLowerCase().includes('latest') || !identifier) {
            try {
              const recentExpensesQuery = await db.collection(`users/${userId}/expenses`)
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
              
              if (!recentExpensesQuery.empty) {
                // Show recent expenses for user to choose from
                updatedResponse += `\n\n📋 **Recent Expenses (for deletion reference):**\n`;
                recentExpensesQuery.docs.forEach((doc, index) => {
                  const data = doc.data();
                  updatedResponse += `${index + 1}. ID: ${doc.id} - ₹${data.amount?.toFixed(2)} - ${data.description} (${data.category})\n`;
                });
                updatedResponse += `\n💡 **To delete a specific expense, say**: "Delete expense #[ID]"`;
                
                // If user said "delete last expense", delete the most recent one
                if (userMessage.toLowerCase().includes('last') || userMessage.toLowerCase().includes('latest')) {
                  const lastExpense = recentExpensesQuery.docs[0];
                  const data = lastExpense.data();
                  await lastExpense.ref.delete();
                  
                  executedActions.push({
                    type: 'delete_expense',
                    data: { id: lastExpense.id, amount: data.amount, description: data.description },
                    success: true
                  });
                  updatedResponse += `\n\n✅ **Last Expense Deleted Successfully!**\n- ID: ${lastExpense.id}\n- Amount: ₹${data.amount?.toFixed(2)}\n- Description: ${data.description}`;
                }
              } else {
                updatedResponse += `\n\n❌ **No expenses found** to delete`;
              }
            } catch (error) {
              updatedResponse += `\n\n❌ **Failed to fetch expenses**: ${error}`;
            }
          }
          break;
        }
        
        // Delete budget
        else if (userMessage.toLowerCase().includes('budget')) {
          const budgetQuery = await db.collection(`users/${userId}/budgets`)
            .where('category', '==', normalizeCategory(identifier))
            .limit(1)
            .get();
          
          if (!budgetQuery.empty) {
            await budgetQuery.docs[0].ref.delete();
            executedActions.push({
              type: 'delete_budget',
              data: { id: budgetQuery.docs[0].id, category: identifier },
              success: true
            });
            updatedResponse += `\n\n✅ **Budget Deleted Successfully!**\n- Category: ${identifier}`;
          } else {
            updatedResponse += `\n\n❌ **Budget not found**: ${identifier}`;
          }
        }
        
        // Delete person
        else if (userMessage.toLowerCase().includes('person') || userMessage.toLowerCase().includes('people')) {
          const personQuery = await db.collection(`users/${userId}/customPeople`)
            .where('name', '==', identifier)
            .limit(1)
            .get();
          
          if (!personQuery.empty) {
            await personQuery.docs[0].ref.delete();
            executedActions.push({
              type: 'delete_person',
              data: { id: personQuery.docs[0].id, name: identifier },
              success: true
            });
            updatedResponse += `\n\n✅ **Person Deleted Successfully!**\n- Name: ${identifier}`;
          } else {
            updatedResponse += `\n\n❌ **Person not found**: ${identifier}`;
          }
        }
        
        // Delete template
        else if (userMessage.toLowerCase().includes('template')) {
          const templateQuery = await db.collection(`users/${userId}/templates`)
            .where('title', '==', identifier)
            .limit(1)
            .get();
          
          if (!templateQuery.empty) {
            await templateQuery.docs[0].ref.delete();
            executedActions.push({
              type: 'delete_template',
              data: { id: templateQuery.docs[0].id, title: identifier },
              success: true
            });
            updatedResponse += `\n\n✅ **Template Deleted Successfully!**\n- Title: ${identifier}`;
          } else {
            updatedResponse += `\n\n❌ **Template not found**: ${identifier}`;
          }
        }
        
        // Delete category
        else if (userMessage.toLowerCase().includes('category')) {
          const categoryQuery = await db.collection(`users/${userId}/customCategories`)
            .where('name', '==', identifier)
            .limit(1)
            .get();
          
          if (!categoryQuery.empty) {
            await categoryQuery.docs[0].ref.delete();
            executedActions.push({
              type: 'delete_category',
              data: { id: categoryQuery.docs[0].id, name: identifier },
              success: true
            });
            updatedResponse += `\n\n✅ **Category Deleted Successfully!**\n- Name: ${identifier}`;
          } else {
            updatedResponse += `\n\n❌ **Category not found**: ${identifier}`;
          }
        }
        break;
      }
    }

    // Detect Add People operations
    const addPeoplePatterns = [
      /(?:add|create)\s*person.*?(?:named?)?\s*([a-zA-Z\s]+?)(?:\s+(?:with|as)?\s*(family|friend|colleague|other))?\s*$/i,
      /(?:add|create)\s*([a-zA-Z\s]+?)\s+(?:as|to)\s*people/i
    ];

    for (const pattern of addPeoplePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const name = match[1]?.trim();
        const relationship = match[2]?.trim() || 'Other';

        if (!name) continue;

        // Create person
        const personData = {
          name,
          relationship: relationship.charAt(0).toUpperCase() + relationship.slice(1).toLowerCase(),
          color: '#3B82F6', // Default blue
          icon: '👤', // Default person icon
          userId,
          isPublic: false,
          createdAt: new Date().toISOString(),
          createdBy: 'User'
        };

        // Add to Firestore
        const personRef = await db.collection(`users/${userId}/customPeople`).add(personData);
        
        executedActions.push({
          type: 'add_person',
          data: { id: personRef.id, ...personData },
          success: true
        });

        updatedResponse += `\n\n✅ **Person Added Successfully!**\n- Name: ${name}\n- Relationship: ${relationship}`;
        break;
      }
    }

    // Detect Add Template operations
    const addTemplatePatterns = [
      /(?:add|create|save)\s*template.*?(?:named?)?\s*([a-zA-Z\s]+?)(?:\s+(?:for|with)?\s*₹?(\d+(?:\.\d{2})?))?\s*$/i,
      /(?:save|create)\s*([a-zA-Z\s]+?)\s+(?:as|to)\s*template/i
    ];

    for (const pattern of addTemplatePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const title = match[1]?.trim();
        const amount = match[2] ? parseFloat(match[2]) : 0;

        if (!title) continue;

        // Create template
        const templateData = {
          title,
          amount,
          category: 'Other',
          description: `Template: ${title}`,
          userId,
          isPublic: false,
          createdAt: new Date().toISOString()
        };

        // Add to Firestore
        const templateRef = await db.collection(`users/${userId}/templates`).add(templateData);
        
        executedActions.push({
          type: 'add_template',
          data: { id: templateRef.id, ...templateData },
          success: true
        });

        updatedResponse += `\n\n✅ **Template Created Successfully!**\n- Title: ${title}${amount > 0 ? `\n- Amount: ₹${amount.toFixed(2)}` : ''}`;
        break;
      }
    }

    // Detect Add Category operations
    const addCategoryPatterns = [
      /(?:add|create)\s*category.*?(?:named?)?\s*([a-zA-Z\s]+)/i,
      /(?:add|create)\s*([a-zA-Z\s]+?)\s+(?:as|to)\s*category/i
    ];

    for (const pattern of addCategoryPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const name = match[1]?.trim();

        if (!name) continue;

        // Create category
        const categoryData = {
          name: normalizeCategory(name),
          color: '#3B82F6', // Default blue
          icon: '📝', // Default category icon
          userId,
          isPublic: false,
          createdAt: new Date().toISOString(),
          createdBy: 'User'
        };

        // Add to Firestore
        const categoryRef = await db.collection(`users/${userId}/customCategories`).add(categoryData);
        
        executedActions.push({
          type: 'add_category',
          data: { id: categoryRef.id, ...categoryData },
          success: true
        });

        updatedResponse += `\n\n✅ **Category Created Successfully!**\n- Name: ${categoryData.name}`;
        break;
      }
    }

    // Detect Update operations
    const updatePatterns = [
      /(?:update|edit|change)\s*(?:expense|transaction)\s*(?:id|#)?\s*([a-zA-Z0-9]+)\s*(?:to|with)?\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)?/i,
      /(?:update|edit|change)\s*budget\s*([a-zA-Z\s]+?)\s*(?:to|with)?\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)/i,
      /(?:update|edit|change|rename)\s*person\s*([a-zA-Z\s]+?)\s*(?:to|with)?\s*([a-zA-Z\s]+)/i,
      /(?:update|edit|change|rename)\s*template\s*([a-zA-Z\s]+?)\s*(?:to|with)?\s*([a-zA-Z\s]+)/i,
      /(?:update|edit|change)\s*template\s*([a-zA-Z\s]+?)\s*(?:amount\s*)?(?:to|with)?\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d{2})?)/i
    ];

    for (const pattern of updatePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const identifier = match[1]?.trim();
        const newValue = match[2]?.trim();

        if (!identifier) continue;

        // Update expense
        if (userMessage.toLowerCase().includes('expense') || userMessage.toLowerCase().includes('transaction')) {
          if (newValue && !isNaN(parseFloat(newValue))) {
            try {
              await db.collection(`users/${userId}/expenses`).doc(identifier).update({
                amount: parseFloat(newValue)
              });
              executedActions.push({
                type: 'update_expense',
                data: { id: identifier, amount: parseFloat(newValue) },
                success: true
              });
              updatedResponse += `\n\n✅ **Expense Updated Successfully!**\n- ID: ${identifier}\n- New Amount: ₹${parseFloat(newValue).toFixed(2)}`;
            } catch (error) {
              updatedResponse += `\n\n❌ **Failed to update expense**: ${identifier} not found`;
            }
          }
        }
        
        // Update budget
        else if (userMessage.toLowerCase().includes('budget')) {
          if (newValue && !isNaN(parseFloat(newValue))) {
            const budgetQuery = await db.collection(`users/${userId}/budgets`)
              .where('category', '==', normalizeCategory(identifier))
              .limit(1)
              .get();
            
            if (!budgetQuery.empty) {
              await budgetQuery.docs[0].ref.update({ limit: parseFloat(newValue) });
              executedActions.push({
                type: 'update_budget',
                data: { id: budgetQuery.docs[0].id, category: identifier, limit: parseFloat(newValue) },
                success: true
              });
              updatedResponse += `\n\n✅ **Budget Updated Successfully!**\n- Category: ${identifier}\n- New Limit: ₹${parseFloat(newValue).toFixed(2)}`;
            } else {
              updatedResponse += `\n\n❌ **Budget not found**: ${identifier}`;
            }
          }
        }
        
        // Update person
        else if (userMessage.toLowerCase().includes('person')) {
          if (newValue) {
            const personQuery = await db.collection(`users/${userId}/customPeople`)
              .where('name', '==', identifier)
              .limit(1)
              .get();
            
            if (!personQuery.empty) {
              await personQuery.docs[0].ref.update({ name: newValue });
              executedActions.push({
                type: 'update_person',
                data: { id: personQuery.docs[0].id, oldName: identifier, newName: newValue },
                success: true
              });
              updatedResponse += `\n\n✅ **Person Updated Successfully!**\n- Changed from: ${identifier}\n- Changed to: ${newValue}`;
            } else {
              updatedResponse += `\n\n❌ **Person not found**: ${identifier}`;
            }
          }
        }
        
        // Update template
        else if (userMessage.toLowerCase().includes('template')) {
          const templateQuery = await db.collection(`users/${userId}/templates`)
            .where('title', '==', identifier)
            .limit(1)
            .get();
          
          if (!templateQuery.empty) {
            const updateData: any = {};
            
            // Check if updating title or amount
            if (newValue) {
              if (!isNaN(parseFloat(newValue))) {
                // Updating amount
                updateData.amount = parseFloat(newValue);
                updatedResponse += `\n\n✅ **Template Updated Successfully!**\n- Title: ${identifier}\n- New Amount: ₹${parseFloat(newValue).toFixed(2)}`;
              } else {
                // Updating title
                updateData.title = newValue;
                updatedResponse += `\n\n✅ **Template Updated Successfully!**\n- Changed from: ${identifier}\n- Changed to: ${newValue}`;
              }
              
              await templateQuery.docs[0].ref.update(updateData);
              executedActions.push({
                type: 'update_template',
                data: { id: templateQuery.docs[0].id, ...updateData },
                success: true
              });
            }
          } else {
            updatedResponse += `\n\n❌ **Template not found**: ${identifier}`;
          }
        }
        break;
      }
    }

    // Add comprehensive query handling for READ operations
    const queryPatterns = [
      // Expense queries
      /(?:show|list|get|find).*?expenses?.*?(?:for|in|from)?\s*([a-zA-Z\s]+)/i,
      /(?:how much|what|total).*?(?:spent|spending).*?(?:on|for|in)?\s*([a-zA-Z\s]+)/i,
      /(?:show|list).*?expenses?.*?(?:by|from)?\s*([a-zA-Z\s]+)/i,
      
      // Budget queries
      /(?:show|list|get|find).*?budgets?/i,
      /(?:what|how much).*?budget.*?(?:for|in)?\s*([a-zA-Z\s]+)/i,
      /(?:budget|remaining).*?(?:for|in)?\s*([a-zA-Z\s]+)/i,
      
      // People queries
      /(?:show|list|get|find).*?(?:people|persons?)/i,
      /(?:who|which people).*?(?:spent|expense)/i,
      
      // Template queries
      /(?:show|list|get|find).*?templates?/i,
      
      // Category queries
      /(?:show|list|get|find).*?categor(?:y|ies)/i,
      /(?:what|which).*?categor(?:y|ies)/i
    ];

    let isQueryHandled = false;
    
    for (const pattern of queryPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const searchTerm = match[1]?.trim();
        
        // Handle expense queries
        if (userMessage.toLowerCase().includes('expense') || userMessage.toLowerCase().includes('spent') || userMessage.toLowerCase().includes('spending')) {
          const expensesSnapshot = await db.collection(`users/${userId}/expenses`)
            .orderBy('date', 'desc')
            .limit(20)
            .get();
          
          const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          if (searchTerm) {
            const filteredExpenses = expenses.filter((expense: any) => 
              expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (filteredExpenses.length > 0) {
              const total = filteredExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
              updatedResponse += `\n\n📊 **Expenses for "${searchTerm}":**\n`;
              filteredExpenses.slice(0, 10).forEach((exp: any) => {
                updatedResponse += `- ₹${exp.amount?.toFixed(2)} - ${exp.description} (${exp.category})\n`;
              });
              updatedResponse += `\n**Total: ₹${total.toFixed(2)}**`;
            } else {
              updatedResponse += `\n\n❌ No expenses found for "${searchTerm}"`;
            }
          } else {
            const recentExpenses = expenses.slice(0, 10);
            const total = recentExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
            updatedResponse += `\n\n📊 **Recent Expenses:**\n`;
            recentExpenses.forEach((exp: any) => {
              updatedResponse += `- ₹${exp.amount?.toFixed(2)} - ${exp.description} (${exp.category})\n`;
            });
            updatedResponse += `\n**Total: ₹${total.toFixed(2)}**`;
          }
          isQueryHandled = true;
        }
        
        // Handle budget queries
        else if (userMessage.toLowerCase().includes('budget')) {
          const budgetsSnapshot = await db.collection(`users/${userId}/budgets`).get();
          const budgets = budgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          if (searchTerm) {
            const filteredBudgets = budgets.filter((budget: any) => 
              budget.category?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (filteredBudgets.length > 0) {
              updatedResponse += `\n\n💰 **Budget for "${searchTerm}":**\n`;
              filteredBudgets.forEach((budget: any) => {
                updatedResponse += `- ${budget.category}: ₹${budget.limit?.toFixed(2)}\n`;
              });
            } else {
              updatedResponse += `\n\n❌ No budget found for "${searchTerm}"`;
            }
          } else {
            updatedResponse += `\n\n💰 **All Budgets:**\n`;
            budgets.forEach((budget: any) => {
              updatedResponse += `- ${budget.category}: ₹${budget.limit?.toFixed(2)}\n`;
            });
          }
          isQueryHandled = true;
        }
        
        // Handle people queries
        else if (userMessage.toLowerCase().includes('people') || userMessage.toLowerCase().includes('person')) {
          const peopleSnapshot = await db.collection(`users/${userId}/customPeople`).get();
          const people = peopleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          if (people.length > 0) {
            updatedResponse += `\n\n👥 **Your People:**\n`;
            people.forEach((person: any) => {
              updatedResponse += `- ${person.name} (${person.relationship || 'Other'}) ${person.icon || '👤'}\n`;
            });
          } else {
            updatedResponse += `\n\n❌ No people found in your list`;
          }
          isQueryHandled = true;
        }
        
        // Handle template queries
        else if (userMessage.toLowerCase().includes('template')) {
          const templatesSnapshot = await db.collection(`users/${userId}/templates`).get();
          const templates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          if (templates.length > 0) {
            updatedResponse += `\n\n📋 **Your Templates:**\n`;
            templates.forEach((template: any) => {
              updatedResponse += `- ${template.title}${template.amount ? ` (₹${template.amount.toFixed(2)})` : ''}\n`;
            });
          } else {
            updatedResponse += `\n\n❌ No templates found`;
          }
          isQueryHandled = true;
        }
        
        // Handle category queries
        else if (userMessage.toLowerCase().includes('categor')) {
          const categoriesSnapshot = await db.collection(`users/${userId}/customCategories`).get();
          const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          // Also include default categories
          const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];
          
          updatedResponse += `\n\n📝 **Categories:**\n`;
          updatedResponse += `**Default Categories:**\n`;
          defaultCategories.forEach(cat => {
            updatedResponse += `- ${cat}\n`;
          });
          
          if (categories.length > 0) {
            updatedResponse += `\n**Custom Categories:**\n`;
            categories.forEach((category: any) => {
              updatedResponse += `- ${category.name} ${category.icon || '📝'}\n`;
            });
          }
          isQueryHandled = true;
        }
        
        if (isQueryHandled) break;
      }
    }

    // Add analytics queries
    const analyticsPatterns = [
      /(?:total|sum|how much).*?(?:spent|expense).*?(?:this|last)?\s*(month|week|year)/i,
      /(?:spending|expense).*?(?:summary|report|analytics)/i,
      /(?:top|highest|most).*?(?:expense|spending).*?categor/i
    ];

    for (const pattern of analyticsPatterns) {
      const match = userMessage.match(pattern);
      if (match && !isQueryHandled) {
        const period = match[1]?.toLowerCase();
        
        // Get expenses for analytics
        const expensesSnapshot = await db.collection(`users/${userId}/expenses`)
          .orderBy('date', 'desc')
          .limit(100)
          .get();
        
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        if (expenses.length > 0) {
          const now = new Date();
          let filteredExpenses = expenses;
          
          if (period === 'month') {
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filteredExpenses = expenses.filter((exp: any) => {
              const expDate = new Date(exp.date);
              return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            });
          } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredExpenses = expenses.filter((exp: any) => new Date(exp.date) >= weekAgo);
          } else if (period === 'year') {
            const currentYear = now.getFullYear();
            filteredExpenses = expenses.filter((exp: any) => new Date(exp.date).getFullYear() === currentYear);
          }
          
          // Calculate totals by category
          const categoryTotals: { [key: string]: number } = {};
          filteredExpenses.forEach((exp: any) => {
            const category = exp.category || 'Other';
            categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
          });
          
          const totalSpent = Object.values(categoryTotals).reduce((sum: number, amount: number) => sum + amount, 0);
          const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          
          updatedResponse += `\n\n📈 **Spending Analytics${period ? ` (${period})` : ''}:**\n`;
          updatedResponse += `**Total Spent: ₹${totalSpent.toFixed(2)}**\n\n`;
          updatedResponse += `**Top Categories:**\n`;
          sortedCategories.forEach(([category, amount], index) => {
            const percentage = ((amount / totalSpent) * 100).toFixed(1);
            updatedResponse += `${index + 1}. ${category}: ₹${amount.toFixed(2)} (${percentage}%)\n`;
          });
        } else {
          updatedResponse += `\n\n❌ No expenses found for analysis`;
        }
        isQueryHandled = true;
        break;
      }
    }

  } catch (error) {
    logger.error("Error executing CRUD actions", { error, userId });
    executedActions.push({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
    updatedResponse += `\n\n❌ **Action Failed**: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return { executedActions, updatedResponse };
}

/**
 * Normalize category names for consistency
 */
function normalizeCategory(category: string): string {
  const categoryMapping: { [key: string]: string } = {
    'food': 'Food',
    'foods': 'Food',
    'eating': 'Food',
    'restaurant': 'Food',
    'lunch': 'Food',
    'dinner': 'Food',
    'breakfast': 'Food',
    'transport': 'Transportation',
    'transportation': 'Transportation',
    'travel': 'Transportation',
    'uber': 'Transportation',
    'taxi': 'Transportation',
    'bus': 'Transportation',
    'train': 'Transportation',
    'education': 'Education',
    'learning': 'Education',
    'course': 'Education',
    'book': 'Education',
    'books': 'Education',
    'entertainment': 'Entertainment',
    'movie': 'Entertainment',
    'movies': 'Entertainment',
    'game': 'Entertainment',
    'games': 'Entertainment',
    'shopping': 'Shopping',
    'shop': 'Shopping',
    'clothes': 'Shopping',
    'clothing': 'Shopping',
    'health': 'Healthcare',
    'healthcare': 'Healthcare',
    'medical': 'Healthcare',
    'doctor': 'Healthcare',
    'medicine': 'Healthcare',
    'pharmacy': 'Healthcare',
    'utility': 'Utilities',
    'utilities': 'Utilities',
    'electric': 'Utilities',
    'electricity': 'Utilities',
    'water': 'Utilities',
    'gas': 'Utilities',
    'internet': 'Utilities',
    'phone': 'Utilities',
    'mobile': 'Utilities'
  };

  const normalized = category.toLowerCase().trim();
  return categoryMapping[normalized] || 
         category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

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

  // Get recent expenses for context (last 5 for deletion context)
  const recentExpensesForContext = expenses.slice(0, 5);

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

  const prompt = `You are KautilyaAI Co-Pilot, an AI financial assistant for Budget Buddy, a personal expense tracking app. 
You help users understand their spending patterns, manage budgets, make better financial decisions, and track shared expenses with people.

IMPORTANT: Always use Indian Rupees (₹) for all currency amounts. The user is based in India.

CURRENT USER CONTEXT:
- Total expenses tracked: ${totalExpenses}
- Current month (${currentMonth}) expenses: ${formatIndianCurrency(totalCurrentMonth)}
- Current month transactions: ${currentMonthExpenses.length}
- Date range: ${dateRange?.newest || "N/A"} to ${dateRange?.oldest || "N/A"}

CONVERSATION CONTEXT - MOST RECENT EXPENSES (for deletion/editing reference):
${recentExpensesForContext.map((exp: any, idx: number) => {
  const sharedWith = exp.people && exp.people.length > 0 
    ? ` (shared with ${exp.people.map((id: string) => {
        const person = allPeople.find((p: any) => p.id === id);
        return person ? person.name : `Person ${id}`;
      }).join(", ")})`
    : "";
  return `${idx + 1}. **ID: ${exp.id}** - ${formatIndianCurrency(exp.amount || 0)} - ${exp.category || "Other"} - ${exp.description || "No description"}${sharedWith} (${exp.date || "No date"})`;
}).join("\n")}

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

CURRENT MONTH SPENDING BY CATEGORY:
${Object.entries(categoryTotals).map(([cat, amount]) => 
  `- ${cat}: ${formatIndianCurrency(amount as number)}`
).join("\n")}

ACTIVE BUDGETS:
${budgets.length > 0 ? budgets.map((budget: any) => 
  `- ${budget.category || "Unknown"}: ${formatIndianCurrency(budget.limit || 0)} (${budget.period || "monthly"})`
).join("\n") : "No active budgets"}

USER QUESTION: "${userMessage}"

CRUD CAPABILITIES: You can perform actions directly from this chat:
**CREATE EXPENSE**: 
- "Add ₹150 for lunch in food category" - Creates expense with specified category
- "Add ₹250 dinner food" - Creates expense, auto-detects food category
- Always provide the expense ID in your response for future reference

**DELETE EXPENSE**: 
- "Delete expense #[ID]" - Deletes specific expense by ID
- "Delete last expense" - Deletes the most recently created expense
- If user says "delete it" or "remove it", refer to the most recent expense from context

**BUDGET MANAGEMENT**: 
- "Set budget ₹5000 for food" - Creates/updates budget
- "Delete food budget" - Removes budget

**CATEGORY DETECTION**: When users specify categories like "food", "education", "transportation", make sure to properly assign them. Common category mappings:
- food/lunch/dinner/breakfast/restaurant → Food
- transport/taxi/uber/bus → Transportation  
- education/course/learning → Education
- shopping/clothes/buy → Shopping

CONTEXT AWARENESS: 
- When user refers to "it", "that expense", "the last one", refer to the most recent expense listed above
- Always include expense IDs in your responses when creating expenses
- For deletion requests without specific ID, show recent expenses and ask for clarification
- Remember conversation flow - if user just added an expense and then says "delete it", they mean that expense

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
  `- ${budget.category || "Unknown"}: ${formatIndianCurrency(budget.limit || 0)} (${budget.period || "monthly"})`
).join("\n") : "No active budgets"}

USER QUESTION: "${userMessage}"

CRUD CAPABILITIES: You can perform actions directly from this chat:
**ADD EXPENSE**: "Add ₹150 for lunch" or "Spent ₹50 on education" - I'll create the expense automatically
**ADD BUDGET**: "Set budget ₹5000 for food" or "Create budget education ₹2000" - I'll create/update budgets
**DELETE**: "Delete expense ID abc123" or "Remove food budget" - I'll delete the specified item
**CATEGORIES**: If a category doesn't exist, I'll create it automatically

Please provide a helpful, conversational response that:
1. Directly answers their question using their actual financial data
2. Provides specific insights based on their spending patterns and people relationships
3. Offers actionable advice when appropriate about both spending and people management
4. Uses a friendly, encouraging tone
5. Always formats currency in Indian Rupees using proper formatting (e.g., ₹1,23,456.78)
6. If the user asks to perform an action (add, edit, delete), acknowledge it naturally in your response
7. Format your response using markdown for better readability:
   - Use **bold** for important numbers or categories
   - Use bullet points for lists
   - Use headers (##) for sections when appropriate
   - Keep it conversational and easy to read
8. Keep responses concise but informative (max 300 words)

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
