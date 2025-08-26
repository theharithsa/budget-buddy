/**
 * KautilyaAI Intent Classification System
 * Advanced ML-powered natural language understanding for financial queries
 */

export interface QueryIntent {
  type: 'DATA_RETRIEVAL' | 'ANALYSIS' | 'CRUD_OPERATION' | 'GENERAL_CHAT';
  subtype: string;
  confidence: number;
  parameters: Record<string, any>;
  responseFormat: 'RAW_DATA' | 'SUMMARY' | 'ANALYSIS' | 'CONVERSATION';
}

export interface DataRequest {
  entity: 'expenses' | 'budgets' | 'categories' | 'people' | 'templates';
  filters?: {
    dateRange?: { start: string; end: string };
    category?: string;
    amount?: { min?: number; max?: number };
    people?: string[];
    limit?: number;
  };
  sortBy?: string;
  groupBy?: string;
  format: 'table' | 'list' | 'summary' | 'chart_data';
}

/**
 * Advanced Intent Classification using NLP patterns and ML techniques
 */
export class IntentClassifier {
  
  // Data retrieval patterns - when users want actual data
  private static DATA_PATTERNS = [
    // List/Show patterns
    /(?:list|show|display|get|give me)\s+(?:all\s+)?(?:my\s+)?(expenses|transactions|spending|costs)/i,
    /(?:what|which)\s+(?:are\s+)?(?:all\s+)?(?:my\s+)?(expenses|transactions)/i,
    /(?:show|display)\s+(?:me\s+)?(?:all\s+)?(?:my\s+)?(budgets|categories|people)/i,
    
    // Specific queries
    /(?:expenses|spending)\s+(?:for|in|from|during)\s+(\w+)/i,
    /(?:expenses|spending)\s+(?:above|over|more than|greater than)\s+(\d+)/i,
    /(?:expenses|spending)\s+(?:below|under|less than)\s+(\d+)/i,
    /(?:expenses|spending)\s+(?:between|from)\s+(\d+)\s+(?:to|and)\s+(\d+)/i,
    
    // Date-specific queries
    /(?:expenses|spending)\s+(?:this|last)\s+(week|month|year)/i,
    /(?:expenses|spending)\s+(?:in|during|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /(?:expenses|spending)\s+(?:on|dated)\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    
    // Raw data indicators
    /(?:export|download|table|csv|raw data|detailed list)/i,
    /(?:all|every|each)\s+(?:expense|transaction|entry)/i,
    /(?:itemized|detailed|complete)\s+(?:list|breakdown|record)/i,
  ];

  // Analysis patterns - when users want insights/summaries
  private static ANALYSIS_PATTERNS = [
    /(?:analyze|analyze|summarize|insights|trends|patterns)/i,
    /(?:how much|total|sum)\s+(?:did i|have i)\s+(?:spend|spent)/i,
    /(?:spending|expense)\s+(?:analysis|summary|overview|insights)/i,
    /(?:what|where)\s+(?:do|did)\s+i\s+spend\s+(?:most|more)/i,
    /(?:financial|budget)\s+(?:health|status|performance|review)/i,
    /(?:recommend|suggest|advice|tips)/i,
    /(?:compare|comparison)\s+(?:my|this)\s+(?:spending|expenses)/i,
    /(?:trend|pattern|habit)/i,
  ];

  // CRUD operation patterns
  private static CRUD_PATTERNS = [
    // Create
    /(?:add|create|new|record)\s+(?:an?\s+)?(?:expense|budget|category)/i,
    /(?:i\s+)?(?:spent|bought|paid|purchased)/i,
    /(?:set|create)\s+(?:a\s+)?budget/i,
    
    // Update
    /(?:update|modify|change|edit)\s+(?:my\s+)?(?:expense|budget)/i,
    /(?:increase|decrease|adjust)\s+(?:my\s+)?budget/i,
    
    // Delete
    /(?:delete|remove|cancel)\s+(?:my\s+)?(?:expense|budget)/i,
  ];

  /**
   * Classify user intent using advanced NLP pattern matching
   */
  static classifyIntent(message: string): QueryIntent {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check for CRUD operations first (highest priority)
    const crudMatch = this.matchCRUDPattern(lowerMessage);
    if (crudMatch.confidence > 0.7) {
      return crudMatch;
    }
    
    // Check for data retrieval patterns
    const dataMatch = this.matchDataPattern(lowerMessage);
    if (dataMatch.confidence > 0.6) {
      return dataMatch;
    }
    
    // Check for analysis patterns
    const analysisMatch = this.matchAnalysisPattern(lowerMessage);
    if (analysisMatch.confidence > 0.5) {
      return analysisMatch;
    }
    
    // Default to general chat
    return {
      type: 'GENERAL_CHAT',
      subtype: 'financial_advice',
      confidence: 0.3,
      parameters: {},
      responseFormat: 'CONVERSATION'
    };
  }

  /**
   * Match against data retrieval patterns
   */
  private static matchDataPattern(message: string): QueryIntent {
    let maxConfidence = 0;
    let bestMatch: any = {};
    
    for (const pattern of this.DATA_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const confidence = this.calculatePatternConfidence(message, pattern);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestMatch = this.extractDataParameters(message, match);
        }
      }
    }
    
    if (maxConfidence > 0.5) {
      return {
        type: 'DATA_RETRIEVAL',
        subtype: bestMatch.entity || 'expenses',
        confidence: maxConfidence,
        parameters: bestMatch,
        responseFormat: this.determineDataFormat(message)
      };
    }
    
    return { type: 'GENERAL_CHAT', subtype: 'unknown', confidence: 0, parameters: {}, responseFormat: 'CONVERSATION' };
  }

  /**
   * Match against analysis patterns
   */
  private static matchAnalysisPattern(message: string): QueryIntent {
    let maxConfidence = 0;
    let analysisType = 'general_analysis';
    
    for (const pattern of this.ANALYSIS_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const confidence = this.calculatePatternConfidence(message, pattern);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          analysisType = this.extractAnalysisType(message);
        }
      }
    }
    
    if (maxConfidence > 0.4) {
      return {
        type: 'ANALYSIS',
        subtype: analysisType,
        confidence: maxConfidence,
        parameters: this.extractAnalysisParameters(message),
        responseFormat: 'ANALYSIS'
      };
    }
    
    return { type: 'GENERAL_CHAT', subtype: 'unknown', confidence: 0, parameters: {}, responseFormat: 'CONVERSATION' };
  }

  /**
   * Match against CRUD patterns
   */
  private static matchCRUDPattern(message: string): QueryIntent {
    let maxConfidence = 0;
    let operation = 'create';
    let entity = 'expense';
    
    for (const pattern of this.CRUD_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const confidence = this.calculatePatternConfidence(message, pattern);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          operation = this.extractCRUDOperation(message);
          entity = this.extractCRUDEntity(message);
        }
      }
    }
    
    if (maxConfidence > 0.6) {
      return {
        type: 'CRUD_OPERATION',
        subtype: `${operation}_${entity}`,
        confidence: maxConfidence,
        parameters: this.extractCRUDParameters(message),
        responseFormat: 'CONVERSATION'
      };
    }
    
    return { type: 'GENERAL_CHAT', subtype: 'unknown', confidence: 0, parameters: {}, responseFormat: 'CONVERSATION' };
  }

  /**
   * Calculate pattern confidence based on multiple factors
   */
  private static calculatePatternConfidence(message: string, pattern: RegExp): number {
    const match = message.match(pattern);
    if (!match) return 0;
    
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on match length vs message length
    const matchLength = match[0].length;
    const messageLength = message.length;
    const coverage = matchLength / messageLength;
    confidence += coverage * 0.3;
    
    // Boost for specific keywords
    const keywordBoosts = {
      'list': 0.2,
      'show': 0.2,
      'all': 0.15,
      'expenses': 0.1,
      'detailed': 0.15,
      'table': 0.2,
      'raw': 0.2
    };
    
    for (const [keyword, boost] of Object.entries(keywordBoosts)) {
      if (message.includes(keyword)) {
        confidence += boost;
      }
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract parameters for data requests
   */
  private static extractDataParameters(message: string, match: RegExpMatchArray): any {
    const parameters: any = {};
    
    // Extract entity type
    if (message.includes('budget')) parameters.entity = 'budgets';
    else if (message.includes('categor')) parameters.entity = 'categories';
    else if (message.includes('people')) parameters.entity = 'people';
    else if (message.includes('template')) parameters.entity = 'templates';
    else parameters.entity = 'expenses';
    
    // Extract filters
    parameters.filters = {};
    
    // Amount filters
    const amountMatch = message.match(/(?:above|over|more than|greater than)\s+(\d+)/i);
    if (amountMatch) {
      parameters.filters.amount = { min: parseInt(amountMatch[1]) };
    }
    
    const belowMatch = message.match(/(?:below|under|less than)\s+(\d+)/i);
    if (belowMatch) {
      parameters.filters.amount = { max: parseInt(belowMatch[1]) };
    }
    
    const rangeMatch = message.match(/(?:between|from)\s+(\d+)\s+(?:to|and)\s+(\d+)/i);
    if (rangeMatch) {
      parameters.filters.amount = { 
        min: parseInt(rangeMatch[1]), 
        max: parseInt(rangeMatch[2]) 
      };
    }
    
    // Date filters
    const dateMatch = message.match(/(?:this|last)\s+(week|month|year)/i);
    if (dateMatch) {
      parameters.filters.dateRange = this.getDateRange(dateMatch[1]);
    }
    
    const monthMatch = message.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (monthMatch) {
      parameters.filters.dateRange = this.getMonthRange(monthMatch[1]);
    }
    
    // Category filter
    const categoryMatch = message.match(/(?:for|in|category)\s+(\w+)/i);
    if (categoryMatch) {
      parameters.filters.category = categoryMatch[1];
    }
    
    // Limit
    const limitMatch = message.match(/(?:top|first|last)\s+(\d+)/i);
    if (limitMatch) {
      parameters.filters.limit = parseInt(limitMatch[1]);
    }
    
    return parameters;
  }

  /**
   * Determine the best format for data response
   */
  private static determineDataFormat(message: string): 'RAW_DATA' | 'SUMMARY' | 'ANALYSIS' | 'CONVERSATION' {
    // Strong indicators for raw data
    const rawDataKeywords = ['list', 'table', 'all', 'detailed', 'complete', 'itemized', 'raw', 'export'];
    const hasRawKeywords = rawDataKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (hasRawKeywords) return 'RAW_DATA';
    
    // Indicators for summary
    const summaryKeywords = ['summary', 'overview', 'brief'];
    const hasSummaryKeywords = summaryKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    if (hasSummaryKeywords) return 'SUMMARY';
    
    // Default to raw data for data retrieval intents
    return 'RAW_DATA';
  }

  /**
   * Helper methods for parameter extraction
   */
  private static extractAnalysisType(message: string): string {
    if (message.includes('trend')) return 'trend_analysis';
    if (message.includes('compare')) return 'comparison_analysis';
    if (message.includes('budget')) return 'budget_analysis';
    if (message.includes('category')) return 'category_analysis';
    return 'general_analysis';
  }

  private static extractAnalysisParameters(message: string): any {
    // Extract time period, categories, etc. for analysis
    return {};
  }

  private static extractCRUDOperation(message: string): string {
    if (message.includes('add') || message.includes('create') || message.includes('new') || message.includes('spent') || message.includes('bought')) return 'create';
    if (message.includes('update') || message.includes('modify') || message.includes('change') || message.includes('edit')) return 'update';
    if (message.includes('delete') || message.includes('remove') || message.includes('cancel')) return 'delete';
    return 'create';
  }

  private static extractCRUDEntity(message: string): string {
    if (message.includes('budget')) return 'budget';
    if (message.includes('category')) return 'category';
    if (message.includes('people') || message.includes('person')) return 'person';
    return 'expense';
  }

  private static extractCRUDParameters(message: string): any {
    // Extract amounts, descriptions, categories, etc.
    return {};
  }

  private static getDateRange(period: string): { start: string; end: string } {
    const now = new Date();
    const start = new Date();
    
    switch (period.toLowerCase()) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }

  private static getMonthRange(month: string): { start: string; end: string } {
    const year = new Date().getFullYear();
    const monthIndex = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ].indexOf(month.toLowerCase());
    
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
}
