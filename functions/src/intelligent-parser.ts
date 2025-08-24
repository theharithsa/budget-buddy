/**
 * Intelligent Natural Language Parser for Budget Buddy
 * Context-aware system that learns user behavior and understands complex financial requests
 */

export interface UserContext {
  expenses: any[];
  budgets: any[];
  customCategories: any[];
  publicCategories: any[];
  customPeople: any[];
  publicPeople: any[];
  templates: any[];
  budgetTemplates: any[];
  recentActions: any[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  commonCategories: string[];
  frequentAmounts: number[];
  usualPeople: string[];
  timePatterns: any;
  languageStyle: 'casual' | 'formal' | 'mixed';
  currency: 'INR' | 'USD';
  dateFormat: string;
}

export interface ParsedIntent {
  action: 'add' | 'update' | 'delete' | 'query' | 'analyze' | 'help';
  entity: 'expense' | 'budget' | 'category' | 'person' | 'template';
  confidence: number;
  parameters: any;
  context: any;
  suggestions: string[];
}

export interface EntityRecognition {
  amounts: Array<{ value: number; position: number; currency?: string }>;
  dates: Array<{ value: string; position: number; type: 'absolute' | 'relative' }>;
  categories: Array<{ value: string; position: number; confidence: number }>;
  people: Array<{ value: string; position: number; confidence: number }>;
  descriptions: Array<{ value: string; position: number; type: 'explicit' | 'inferred' }>;
}

/**
 * Intelligent Natural Language Understanding Engine
 */
export class IntelligentParser {
  private userContext: UserContext;
  // private categoryMappings: Map<string, string>;
  // private entityPatterns: any;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    // this.categoryMappings = this.buildCategoryMappings();
    // this.entityPatterns = this.initializePatterns();
  }

  /**
   * Main parsing function - converts natural language to structured intent
   */
  async parseMessage(message: string, conversationHistory: any[] = []): Promise<ParsedIntent> {
    const normalizedMessage = this.normalizeMessage(message);
    
    // Extract entities first
    const entities = this.extractEntities(normalizedMessage);
    
    // Determine primary intent
    const intent = this.determineIntent(normalizedMessage, entities, conversationHistory);
    
    // Apply context awareness
    const contextualIntent = this.applyContextualUnderstanding(intent, entities, conversationHistory);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(contextualIntent, entities);
    
    return {
      ...contextualIntent,
      suggestions
    };
  }

  /**
   * Advanced entity extraction using pattern matching and context
   */
  private extractEntities(message: string): EntityRecognition {
    return {
      amounts: this.extractAmounts(message),
      dates: this.extractDates(message),
      categories: this.extractCategories(message),
      people: this.extractPeople(message),
      descriptions: this.extractDescriptions(message)
    };
  }

  /**
   * Extract monetary amounts with various formats
   */
  private extractAmounts(message: string): Array<{ value: number; position: number; currency?: string }> {
    const amounts: Array<{ value: number; position: number; currency?: string }> = [];
    
    // Pattern 1: ₹1000, Rs.1000, Rs 1000
    const rupeePattern = /(?:₹|rs\.?\s*)(\d+(?:\.\d{2})?)/gi;
    let match;
    while ((match = rupeePattern.exec(message)) !== null) {
      amounts.push({
        value: parseFloat(match[1]),
        position: match.index,
        currency: 'INR'
      });
    }
    
    // Pattern 2: $100, USD 100
    const dollarPattern = /(?:\$|usd\s*)(\d+(?:\.\d{2})?)/gi;
    while ((match = dollarPattern.exec(message)) !== null) {
      amounts.push({
        value: parseFloat(match[1]),
        position: match.index,
        currency: 'USD'
      });
    }
    
    // Pattern 3: Plain numbers with context
    const numberPattern = /\b(\d+(?:\.\d{2})?)\b/g;
    while ((match = numberPattern.exec(message)) !== null) {
      const value = parseFloat(match[1]);
      // Only include if it looks like a monetary amount (reasonable range)
      if (value >= 1 && value <= 1000000) {
        amounts.push({
          value,
          position: match.index,
          currency: this.userContext.preferences.currency
        });
      }
    }
    
    return amounts;
  }

  /**
   * Extract dates with relative and absolute references
   */
  private extractDates(message: string): Array<{ value: string; position: number; type: 'absolute' | 'relative' }> {
    const dates: Array<{ value: string; position: number; type: 'absolute' | 'relative' }> = [];
    
    // Relative dates
    const relativeDates = [
      { pattern: /\b(today|now)\b/gi, offset: 0 },
      { pattern: /\b(yesterday)\b/gi, offset: -1 },
      { pattern: /\b(tomorrow)\b/gi, offset: 1 },
      { pattern: /\b(\d+)\s*days?\s*ago\b/gi, offsetCalc: (match: any) => -parseInt(match[1]) },
      { pattern: /\blast\s*week\b/gi, offset: -7 },
      { pattern: /\bnext\s*week\b/gi, offset: 7 },
      { pattern: /\blast\s*month\b/gi, offset: -30 },
      { pattern: /\bthis\s*month\b/gi, offset: 0 }
    ];
    
    for (const relativeDate of relativeDates) {
      let match;
      while ((match = relativeDate.pattern.exec(message)) !== null) {
        const offset = relativeDate.offsetCalc ? relativeDate.offsetCalc(match) : relativeDate.offset;
        const date = new Date();
        date.setDate(date.getDate() + offset);
        dates.push({
          value: date.toISOString().split('T')[0],
          position: match.index,
          type: 'relative'
        });
      }
    }
    
    // Absolute dates (DD/MM/YYYY, DD-MM-YYYY, etc.)
    const absolutePattern = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g;
    let match;
    while ((match = absolutePattern.exec(message)) !== null) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      
      if (day <= 31 && month <= 12) {
        const date = new Date(year, month - 1, day);
        dates.push({
          value: date.toISOString().split('T')[0],
          position: match.index,
          type: 'absolute'
        });
      }
    }
    
    return dates;
  }

  /**
   * Smart category detection using user's custom categories and pattern matching
   */
  private extractCategories(message: string): Array<{ value: string; position: number; confidence: number }> {
    const categories: Array<{ value: string; position: number; confidence: number }> = [];
    
    // Get all available categories
    const allCategories = [
      ...this.userContext.customCategories.map(cat => cat.name),
      ...this.userContext.publicCategories.map(cat => cat.name)
    ];
    
    // Direct category name matching
    for (const category of allCategories) {
      const regex = new RegExp(`\\b${category.toLowerCase().replace(/[^a-z0-9]/g, '\\s*')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(message)) !== null) {
        categories.push({
          value: category,
          position: match.index,
          confidence: 0.9
        });
      }
    }
    
    // Semantic category mapping based on keywords
    const semanticMappings = this.buildSemanticCategoryMappings();
    for (const [keywords, category] of semanticMappings.entries()) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(message)) !== null) {
          // Only add if not already found a direct match
          const existing = categories.find(cat => 
            Math.abs(cat.position - match!.index) < 20
          );
          if (!existing) {
            categories.push({
              value: category,
              position: match.index,
              confidence: 0.7
            });
          }
        }
      }
    }
    
    return categories;
  }

  /**
   * Extract people mentioned in the message
   */
  private extractPeople(message: string): Array<{ value: string; position: number; confidence: number }> {
    const people: Array<{ value: string; position: number; confidence: number }> = [];
    
    // Get all available people
    const allPeople = [
      ...this.userContext.customPeople.map(person => person.name),
      ...this.userContext.publicPeople.map(person => person.name)
    ];
    
    // Direct name matching
    for (const person of allPeople) {
      const regex = new RegExp(`\\b${person.toLowerCase()}\\b`, 'gi');
      let match;
      while ((match = regex.exec(message)) !== null) {
        people.push({
          value: person,
          position: match.index,
          confidence: 0.9
        });
      }
    }
    
    // Relationship-based matching
    const relationshipMappings = new Map([
      [['family', 'parents', 'mom', 'dad', 'mother', 'father'], 'Family'],
      [['spouse', 'wife', 'husband', 'partner'], 'Spouse/Partner'],
      [['friends', 'friend', 'buddy'], 'Friends'],
      [['colleagues', 'colleague', 'coworker', 'team'], 'Colleagues'],
      [['kids', 'children', 'son', 'daughter'], 'Kids']
    ]);
    
    for (const [keywords, personType] of relationshipMappings.entries()) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        let match;
        while ((match = regex.exec(message)) !== null) {
          people.push({
            value: personType,
            position: match.index,
            confidence: 0.8
          });
        }
      }
    }
    
    return people;
  }

  /**
   * Extract descriptions and transaction details with smart generation
   */
  private extractDescriptions(message: string): Array<{ value: string; position: number; type: 'explicit' | 'inferred' }> {
    const descriptions: Array<{ value: string; position: number; type: 'explicit' | 'inferred' }> = [];
    
    // Common expense description patterns
    const patterns = [
      // "for lunch", "for coffee"
      /\bfor\s+([a-zA-Z\s]+?)(?:\s+(?:at|in|from|with)|$)/gi,
      // "bought coffee", "paid for dinner"
      /\b(?:bought|paid\s+for|purchased)\s+([a-zA-Z\s]+?)(?:\s+(?:at|in|from|with)|$)/gi,
      // "at restaurant", "from store"
      /\b(?:at|from|in)\s+([a-zA-Z\s]+?)(?:\s+(?:for|with)|$)/gi,
      // Common transaction types
      /\b(lunch|dinner|breakfast|coffee|groceries|gas|taxi|movie|shopping)\b/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        descriptions.push({
          value: match[1].trim(),
          position: match.index,
          type: 'explicit'
        });
      }
    }
    
    // Smart description generation when no explicit description found
    if (descriptions.length === 0) {
      const lowerMessage = message.toLowerCase();
      
      // Generate description based on context
      if (lowerMessage.includes('with') && /with\s+([A-Z][a-z]+)/i.test(message)) {
        const personMatch = message.match(/with\s+([A-Z][a-z]+)/i);
        if (personMatch) {
          const person = personMatch[1];
          
          // Infer activity from context
          if (/lunch|dinner|breakfast|food|restaurant|meal/.test(lowerMessage)) {
            descriptions.push({
              value: `Meal with ${person}`,
              position: 0,
              type: 'inferred'
            });
          } else if (/coffee|tea|drink/.test(lowerMessage)) {
            descriptions.push({
              value: `Coffee with ${person}`,
              position: 0,
              type: 'inferred'
            });
          } else if (/movie|cinema|entertainment/.test(lowerMessage)) {
            descriptions.push({
              value: `Entertainment with ${person}`,
              position: 0,
              type: 'inferred'
            });
          } else {
            descriptions.push({
              value: `Expense with ${person}`,
              position: 0,
              type: 'inferred'
            });
          }
        }
      }
    }
    
    return descriptions;
  }

  /**
   * Determine the primary intent of the message
   */
  private determineIntent(message: string, entities: EntityRecognition, history: any[]): ParsedIntent {
    const lowerMessage = message.toLowerCase();
    
    // Action detection patterns
    const actionPatterns = [
      { actions: ['add', 'create', 'new', 'spent', 'bought', 'paid'], intent: 'add' },
      { actions: ['update', 'edit', 'change', 'modify'], intent: 'update' },
      { actions: ['delete', 'remove', 'cancel'], intent: 'delete' },
      { actions: ['show', 'list', 'display', 'get', 'find'], intent: 'query' },
      { actions: ['analyze', 'analysis', 'insight', 'report'], intent: 'analyze' },
      { actions: ['help', 'how', 'what', 'explain'], intent: 'help' }
    ];
    
    let primaryAction = 'add'; // Default to add for expense-like messages
    let confidence = 0.5;
    
    for (const pattern of actionPatterns) {
      for (const action of pattern.actions) {
        if (lowerMessage.includes(action)) {
          primaryAction = pattern.intent;
          confidence = 0.8;
          break;
        }
      }
      if (confidence > 0.7) break;
    }
    
    // Entity detection
    let primaryEntity = 'expense'; // Default
    if (lowerMessage.includes('budget')) primaryEntity = 'budget';
    else if (lowerMessage.includes('category')) primaryEntity = 'category';
    else if (lowerMessage.includes('person') || lowerMessage.includes('people')) primaryEntity = 'person';
    else if (lowerMessage.includes('template')) primaryEntity = 'template';
    
    // Extract parameters based on intent and entity
    const parameters = this.extractParameters(primaryAction, primaryEntity, entities, message);
    
    return {
      action: primaryAction as any,
      entity: primaryEntity as any,
      confidence,
      parameters,
      context: { message, entities, history },
      suggestions: [] // Will be populated later
    };
  }

  /**
   * Apply contextual understanding based on user history and preferences
   */
  private applyContextualUnderstanding(intent: ParsedIntent, entities: EntityRecognition, history: any[]): ParsedIntent {
    // Context from recent messages
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      
      // Reference resolution ("delete it", "update that")
      if (intent.parameters && !intent.parameters.id && 
          (intent.action === 'update' || intent.action === 'delete')) {
        const referenceWords = ['it', 'that', 'this', 'the last one', 'recent'];
        const hasReference = referenceWords.some(word => 
          intent.context.message.toLowerCase().includes(word)
        );
        
        if (hasReference && lastMessage.executedActions) {
          const lastAction = lastMessage.executedActions[lastMessage.executedActions.length - 1];
          if (lastAction && lastAction.data && lastAction.data.id) {
            intent.parameters.id = lastAction.data.id;
            intent.confidence = Math.min(intent.confidence + 0.2, 0.95);
          }
        }
      }
    }
    
    // Smart defaults based on user patterns
    if (intent.action === 'add' && intent.entity === 'expense') {
      if (!intent.parameters.category && entities.categories.length === 0) {
        // Infer category from description or common patterns
        intent.parameters.category = this.inferCategory(intent.parameters.description || '', intent.context.message);
      }
      
      if (!intent.parameters.date) {
        intent.parameters.date = new Date().toISOString().split('T')[0];
      }
    }
    
    return intent;
  }

  /**
   * Extract parameters for specific intent/entity combinations
   */
  private extractParameters(action: string, entity: string, entities: EntityRecognition, message: string): any {
    const parameters: any = {};
    
    if (entity === 'expense') {
      if (entities.amounts.length > 0) {
        parameters.amount = entities.amounts[0].value;
      }
      
      if (entities.categories.length > 0) {
        parameters.category = entities.categories[0].value;
      }
      
      if (entities.dates.length > 0) {
        parameters.date = entities.dates[0].value;
      }
      
      if (entities.descriptions.length > 0) {
        parameters.description = entities.descriptions[0].value;
      }
      
      if (entities.people.length > 0) {
        parameters.people = entities.people.map(p => p.value); // Store people names for auto-creation
        parameters.peopleIds = entities.people.map(p => this.findPersonId(p.value)).filter(id => id); // Only existing IDs
      }
      
      // Enhanced people extraction from natural language patterns
      const peoplePatterns = [
        /with\s+([A-Z][a-z]+)/gi,           // "with Mithun"
        /for\s+([A-Z][a-z]+)/gi,            // "for Sarah"
        /([A-Z][a-z]+)\s+and\s+me/gi,       // "Mithun and me"
        /me\s+and\s+([A-Z][a-z]+)/gi,       // "me and Sarah"
        /split\s+with\s+([A-Z][a-z]+)/gi    // "split with John"
      ];
      
      for (const pattern of peoplePatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          const personName = match[1];
          if (personName && !parameters.people?.includes(personName)) {
            parameters.people = parameters.people || [];
            parameters.people.push(personName);
          }
        }
      }
    } else if (entity === 'budget') {
      if (entities.amounts.length > 0) {
        parameters.limit = entities.amounts[0].value;
      }
      
      if (entities.categories.length > 0) {
        parameters.category = entities.categories[0].value;
      }
    }
    
    // Enhanced ID extraction for update/delete operations
    if (action === 'update' || action === 'delete') {
      // Direct ID pattern matching (#id or id: value)
      const directIdPattern = /(?:id[:\s]+|#)([a-zA-Z0-9\-_]+)/i;
      const directMatch = message.match(directIdPattern);
      if (directMatch) {
        parameters.id = directMatch[1];
      } else {
        // Smart context-based ID resolution
        const lowerMessage = message.toLowerCase();
        
        // Handle "last expense", "recent expense", "latest expense"
        if (lowerMessage.includes('last') || lowerMessage.includes('recent') || lowerMessage.includes('latest')) {
          if (this.userContext.expenses && this.userContext.expenses.length > 0) {
            parameters.id = this.userContext.expenses[0].id; // Most recent expense
            parameters.description = `last expense (${this.userContext.expenses[0].description})`;
          }
        }
        // Handle "first expense", "oldest expense"
        else if (lowerMessage.includes('first') || lowerMessage.includes('oldest')) {
          if (this.userContext.expenses && this.userContext.expenses.length > 0) {
            const lastExpense = this.userContext.expenses[this.userContext.expenses.length - 1];
            parameters.id = lastExpense.id;
            parameters.description = `first expense (${lastExpense.description})`;
          }
        }
        // Handle expense by description matching
        else {
          const expense = this.findExpenseByDescription(message);
          if (expense) {
            parameters.id = expense.id;
            parameters.description = expense.description;
          }
        }
      }
    }
    
    return parameters;
  }

  /**
   * Build semantic category mappings
   */
  private buildSemanticCategoryMappings(): Map<string[], string> {
    return new Map([
      [['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'meal', 'eating', 'snack', 'groceries'], 'Food & Dining'],
      [['taxi', 'uber', 'bus', 'metro', 'train', 'transport', 'travel', 'petrol', 'gas', 'fuel'], 'Transportation'],
      [['shopping', 'clothes', 'buy', 'purchase', 'store', 'mall'], 'Shopping'],
      [['movie', 'cinema', 'game', 'entertainment', 'show', 'concert', 'fun'], 'Entertainment'],
      [['rent', 'electricity', 'water', 'bill', 'utility', 'internet', 'phone'], 'Bills & Utilities'],
      [['doctor', 'hospital', 'medicine', 'health', 'medical', 'pharmacy', 'clinic'], 'Healthcare'],
      [['education', 'course', 'learning', 'book', 'school', 'college', 'study'], 'Education'],
      [['flight', 'hotel', 'vacation', 'trip', 'holiday', 'travel'], 'Travel']
    ]);
  }

  /**
   * Infer category from description using semantic analysis
   */
  private inferCategory(description: string, fullMessage: string): string {
    const semanticMappings = this.buildSemanticCategoryMappings();
    const text = (description + ' ' + fullMessage).toLowerCase();
    
    for (const [keywords, category] of semanticMappings.entries()) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Check user's common categories
    if (this.userContext.preferences.commonCategories.length > 0) {
      return this.userContext.preferences.commonCategories[0];
    }
    
    return 'Other';
  }

  /**
   * Find person ID by name
   */
  private findPersonId(name: string): string | undefined {
    const allPeople = [...this.userContext.customPeople, ...this.userContext.publicPeople];
    const person = allPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
    return person?.id;
  }

  /**
   * Generate contextual suggestions for the user
   */
  private generateSuggestions(intent: ParsedIntent, entities: EntityRecognition): string[] {
    const suggestions: string[] = [];
    
    if (intent.action === 'add' && intent.entity === 'expense') {
      if (!intent.parameters.amount) {
        suggestions.push("💡 Try: 'Add ₹150 for lunch'");
      }
      if (!intent.parameters.category) {
        suggestions.push("💡 Specify category: 'food and dining', 'transportation', etc.");
      }
    }
    
    if (intent.action === 'delete' && !intent.parameters.id) {
      suggestions.push("💡 For specific deletion, say: 'Delete expense #abc123'");
      suggestions.push("💡 Or try: 'Delete last expense'");
    }
    
    return suggestions;
  }

  /**
   * Find expense by description matching with enhanced fallback logic
   */
  private findExpenseByDescription(message: string): any | null {
    if (!this.userContext.expenses || this.userContext.expenses.length === 0) {
      return null;
    }

    const lowerMessage = message.toLowerCase();
    
    // For generic delete requests, just return the most recent expense
    if (/^(delete|remove)\s+(expense|transaction)?$/i.test(message.trim())) {
      console.log('🎯 Generic delete request - using most recent expense');
      return this.userContext.expenses[0]; // Most recent expense
    }
    
    // Extract potential description keywords from the message
    const keywords = lowerMessage
      .replace(/(?:delete|remove|cancel|update)\s+/g, '') // Remove action words
      .replace(/(?:expense|transaction)\s+/g, '') // Remove entity words
      .replace(/(?:the|that|this)\s+/g, '') // Remove determiners
      .split(/\s+/)
      .filter(word => word.length > 2); // Only meaningful words

    console.log('🔍 Searching for expense with keywords:', keywords);

    // Find expenses that match description keywords (more flexible matching)
    for (const expense of this.userContext.expenses) {
      const expenseDesc = expense.description.toLowerCase();
      
      // Check if any keyword matches the expense description
      for (const keyword of keywords) {
        if (expenseDesc.includes(keyword) || expense.category.toLowerCase().includes(keyword)) {
          console.log('✅ Found matching expense:', expense.id, expense.description);
          return expense;
        }
      }
    }

    // Enhanced fallback: if no specific match, look for partial matches
    for (const expense of this.userContext.expenses) {
      const expenseDesc = expense.description.toLowerCase();
      
      // Partial word matching
      for (const keyword of keywords) {
        if (keyword.length >= 3) { // Only for words 3+ chars
          // Check if expense description contains the keyword as substring
          if (expenseDesc.includes(keyword) || expense.category.toLowerCase().includes(keyword)) {
            console.log('✅ Found partial match expense:', expense.id, expense.description);
            return expense;
          }
        }
      }
    }

    // Final fallback: for any delete request that doesn't match, use most recent
    console.log('🎯 No specific match found - using most recent expense as fallback');
    return this.userContext.expenses[0]; // Most recent expense
  }

  /**
   * Normalize message for processing
   */
  private normalizeMessage(message: string): string {
    return message.trim().toLowerCase();
  }
}

/**
 * Create intelligent parser with user context
 */
export function createIntelligentParser(userContext: UserContext): IntelligentParser {
  return new IntelligentParser(userContext);
}
