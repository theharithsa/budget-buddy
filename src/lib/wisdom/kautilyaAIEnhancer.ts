import { WisdomEngine } from './wisdomEngine';
import { FinancialContextAnalyzer } from './financialContextAnalyzer';
import { UserFinancialContext, WisdomEngineResponse } from './types';
import { Expense, Budget } from '../types';

export class KautilyaAIEnhancer {
  private wisdomEngine: WisdomEngine;

  constructor() {
    this.wisdomEngine = new WisdomEngine();
  }

  /**
   * Enhance user query with financial wisdom and context
   */
  async enhanceUserQuery(
    userQuery: string,
    expenses: Expense[],
    budgets: Budget[],
    userProfile?: Partial<UserFinancialContext>
  ): Promise<{
    enhancedPrompt: string;
    wisdomResponse: WisdomEngineResponse | null;
    context: UserFinancialContext;
  }> {
    
    // Analyze user's financial context
    const context = FinancialContextAnalyzer.analyzeUserFinancialContext(
      expenses, 
      budgets, 
      userProfile
    );

    // Get relevant wisdom for the query
    const wisdomResponse = await this.wisdomEngine.findRelevantWisdom(
      context,
      userQuery
    );

    // Create enhanced prompt for AI
    const enhancedPrompt = this.createEnhancedPrompt(
      userQuery,
      context,
      wisdomResponse
    );

    return {
      enhancedPrompt,
      wisdomResponse,
      context
    };
  }

  /**
   * Create enhanced AI prompt with context and wisdom
   */
  private createEnhancedPrompt(
    userQuery: string,
    context: UserFinancialContext,
    wisdomResponse: WisdomEngineResponse | null
  ): string {
    const baseSystemPrompt = this.getBaseSystemPrompt();
    const contextPrompt = this.createContextualPrompt(context);
    const wisdomPrompt = wisdomResponse ? this.createWisdomPrompt(wisdomResponse) : '';

    return `${baseSystemPrompt}

${contextPrompt}

${wisdomPrompt}

User Query: "${userQuery}"

Please provide a comprehensive response that:
1. Directly addresses the user's question
2. Incorporates relevant financial context from their spending patterns
3. ${wisdomResponse ? 'Includes wisdom from Arthashastra where applicable' : 'Provides practical financial advice'}
4. Offers specific, actionable recommendations
5. Maintains a helpful, encouraging tone

Response:`;
  }

  /**
   * Base system prompt for KautilyaAI
   */
  private getBaseSystemPrompt(): string {
    return `You are KautilyaAI, a sophisticated personal finance assistant named after the ancient Indian economist and philosopher Kautilya (also known as Chanakya), author of the Arthashastra. You combine modern financial expertise with timeless wisdom from ancient Indian economic principles.

Your core capabilities:
- Analyze spending patterns and financial behavior
- Provide personalized budget recommendations  
- Offer investment and savings guidance
- Share relevant wisdom from Arthashastra when applicable
- Help users achieve financial goals through practical advice

Your personality:
- Wise yet approachable, like a knowledgeable friend
- Culturally aware and respectful of diverse financial situations
- Practical and actionable in recommendations
- Encouraging and supportive of financial growth
- Able to explain complex concepts simply`;
  }

  /**
   * Create contextual prompt based on user's financial situation
   */
  private createContextualPrompt(context: UserFinancialContext): string {
    const { currentSituation, spendingPatterns, financialGoals, riskProfile, lifeStage } = context;

    let contextPrompt = `User Financial Context:
- Current Focus: ${this.formatCurrentSituation(currentSituation)}
- Life Stage: ${this.formatLifeStage(lifeStage)}
- Risk Profile: ${riskProfile}
- Financial Goals: ${financialGoals.join(', ')}`;

    if (spendingPatterns.monthlyIncome) {
      contextPrompt += `
- Monthly Income: ₹${spendingPatterns.monthlyIncome.toLocaleString()}`;
    }

    if (spendingPatterns.monthlyExpenses) {
      contextPrompt += `
- Monthly Expenses: ₹${spendingPatterns.monthlyExpenses.toLocaleString()}`;
    }

    if (spendingPatterns.savingsRate !== undefined) {
      contextPrompt += `
- Savings Rate: ${(spendingPatterns.savingsRate * 100).toFixed(1)}%`;
    }

    if (spendingPatterns.topCategories && spendingPatterns.topCategories.length > 0) {
      contextPrompt += `
- Top Spending Categories: ${spendingPatterns.topCategories.join(', ')}`;
    }

    return contextPrompt;
  }

  /**
   * Create wisdom prompt from Arthashastra principles
   */
  private createWisdomPrompt(wisdomResponse: WisdomEngineResponse): string {
    if (!wisdomResponse.primaryWisdom && !wisdomResponse.supportingWisdom?.length) {
      return '';
    }

    let wisdomPrompt = `\nRelevant Wisdom from Arthashastra:`;

    // Add primary wisdom
    if (wisdomResponse.primaryWisdom) {
      const principle = wisdomResponse.primaryWisdom.principle;
      wisdomPrompt += `
Primary Principle: ${principle.principle} (${principle.sanskritTerm})
   "${principle.modernInterpretation}"
   Application: ${principle.financialApplications.join(', ')}`;
    }

    // Add supporting wisdom
    if (wisdomResponse.supportingWisdom && wisdomResponse.supportingWisdom.length > 0) {
      wisdomPrompt += `\n\nSupporting Wisdom:`;
      wisdomResponse.supportingWisdom.forEach((wisdom, index) => {
        const principle = wisdom.principle;
        wisdomPrompt += `
${index + 1}. ${principle.principle}: ${principle.modernInterpretation}`;
      });
    }

    // Add personalized guidance
    if (wisdomResponse.personalizedGuidance) {
      wisdomPrompt += `\n\nPersonalized Guidance: ${wisdomResponse.personalizedGuidance}`;
    }

    return wisdomPrompt;
  }

  /**
   * Format current situation for better readability
   */
  private formatCurrentSituation(situation: UserFinancialContext['currentSituation']): string {
    const situationMap = {
      'budgeting': 'Learning to budget and track expenses',
      'saving': 'Building savings and reducing expenses',
      'investing': 'Growing wealth through investments',
      'debt_management': 'Managing and reducing debt',
      'financial_planning': 'Long-term financial planning',
      'overspending': 'Controlling spending and staying within budget'
    };
    
    return situationMap[situation] || situation;
  }

  /**
   * Format life stage for better readability
   */
  private formatLifeStage(stage: UserFinancialContext['lifeStage']): string {
    const stageMap = {
      'student': 'Student managing limited income',
      'professional': 'Working professional',
      'family': 'Family with children/dependents',
      'retired': 'Retirement/post-career phase'
    };
    
    return stageMap[stage] || stage;
  }

  /**
   * Quick enhancement for simple queries without full context
   */
  async quickEnhance(userQuery: string): Promise<string> {
    const simpleContext = FinancialContextAnalyzer.createSimpleContext();
    
    const wisdomResponse = await this.wisdomEngine.findRelevantWisdom(
      simpleContext,
      userQuery
    );

    return this.createEnhancedPrompt(userQuery, simpleContext, wisdomResponse);
  }

  /**
   * Get financial insights for dashboard
   */
  async getFinancialInsights(
    expenses: Expense[],
    budgets: Budget[]
  ): Promise<{
    insights: string[];
    recommendations: string[];
    wisdomOfTheDay: string;
  }> {
    const context = FinancialContextAnalyzer.analyzeUserFinancialContext(expenses, budgets);
    
    const insights = this.generateInsights(context);
    const recommendations = this.generateRecommendations(context);
    const wisdomOfTheDay = this.getRandomWisdom();

    return {
      insights,
      recommendations,
      wisdomOfTheDay
    };
  }

  /**
   * Generate insights based on spending patterns
   */
  private generateInsights(context: UserFinancialContext): string[] {
    const insights: string[] = [];
    
    if (context.spendingPatterns.savingsRate !== undefined && context.spendingPatterns.savingsRate < 0.1) {
      insights.push("Your savings rate is below the recommended 10-20%. Consider reviewing your expenses.");
    }
    
    if (context.spendingPatterns.savingsRate !== undefined && context.spendingPatterns.savingsRate > 0.25) {
      insights.push("Excellent savings rate! You're on track for strong financial growth.");
    }
    
    if (context.currentSituation === 'overspending') {
      insights.push("Your spending is trending upward. Time to review and adjust your budget.");
    }
    
    return insights;
  }

  /**
   * Generate recommendations based on context
   */
  private generateRecommendations(context: UserFinancialContext): string[] {
    const recommendations: string[] = [];
    
    switch (context.currentSituation) {
      case 'budgeting':
        recommendations.push("Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings");
        break;
      case 'saving':
        recommendations.push("Consider automating your savings to ensure consistency");
        break;
      case 'investing':
        recommendations.push("Diversify your portfolio based on your risk tolerance");
        break;
    }
    
    return recommendations;
  }

  /**
   * Get random wisdom from Arthashastra principles
   */
  private getRandomWisdom(): string {
    const randomIndex = Math.floor(Math.random() * this.wisdomEngine['principles'].length);
    const principle = this.wisdomEngine['principles'][randomIndex];
    return `${principle.principle} - ${principle.modernInterpretation}`;
  }
}
