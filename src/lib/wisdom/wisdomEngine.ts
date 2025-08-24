import { 
  ArthashashtraPrinciple, 
  ContextualWisdom, 
  UserFinancialContext, 
  WisdomEngineResponse,
  FinancialScenario 
} from './types';
import { ARTHASHASTRA_PRINCIPLES, FINANCIAL_SCENARIOS } from './arthashashtraKnowledge';

export class WisdomEngine {
  private principles: ArthashashtraPrinciple[];
  private scenarios: FinancialScenario[];

  constructor() {
    this.principles = ARTHASHASTRA_PRINCIPLES;
    this.scenarios = FINANCIAL_SCENARIOS;
  }

  /**
   * Find relevant wisdom based on user query and financial context
   */
  async findRelevantWisdom(
    userContext: UserFinancialContext,
    userQuery: string
  ): Promise<WisdomEngineResponse> {
    
    // 1. Analyze the user's query to understand their situation
    const detectedScenarios = this.analyzeUserQuery(userQuery);
    
    // 2. Match with user's financial context
    const contextualScenarios = this.matchUserContext(userContext, detectedScenarios);
    
    // 3. Find relevant principles
    const relevantPrinciples = this.findMatchingPrinciples(contextualScenarios);
    
    // 4. Rank principles by relevance
    const rankedWisdom = this.rankWisdomByRelevance(relevantPrinciples, userContext, userQuery);
    
    // 5. Generate personalized guidance
    const personalizedGuidance = this.generatePersonalizedGuidance(rankedWisdom[0], userContext, userQuery);
    
    return {
      primaryWisdom: rankedWisdom[0],
      supportingWisdom: rankedWisdom.slice(1, 3),
      personalizedGuidance,
      culturalContext: this.generateCulturalContext(rankedWisdom[0]),
      modernParallels: this.findModernParallels(rankedWisdom[0]),
      actionPlan: this.generateActionPlan(rankedWisdom[0], userContext)
    };
  }

  /**
   * Analyze user query to detect financial scenarios
   */
  private analyzeUserQuery(query: string): FinancialScenario[] {
    const queryLower = query.toLowerCase();
    const detectedScenarios: FinancialScenario[] = [];

    for (const scenario of this.scenarios) {
      const matchScore = this.calculateScenarioMatch(queryLower, scenario);
      if (matchScore > 0.3) { // Threshold for relevance
        detectedScenarios.push(scenario);
      }
    }

    return detectedScenarios.length > 0 ? detectedScenarios : [this.scenarios[0]]; // Default to budgeting
  }

  /**
   * Calculate how well a query matches a scenario
   */
  private calculateScenarioMatch(query: string, scenario: FinancialScenario): number {
    let score = 0;
    const totalKeywords = scenario.keywords.length;

    // Check for keyword matches
    for (const keyword of scenario.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // Check for pattern matches
    for (const pattern of scenario.commonPatterns) {
      if (query.includes(pattern.toLowerCase())) {
        score += 0.5;
      }
    }

    return score / totalKeywords;
  }

  /**
   * Match user's financial context with detected scenarios
   */
  private matchUserContext(
    userContext: UserFinancialContext,
    detectedScenarios: FinancialScenario[]
  ): FinancialScenario[] {
    const contextualScenarios = [...detectedScenarios];

    // Add scenarios based on user's current situation
    const situationScenario = this.scenarios.find(s => s.id === userContext.currentSituation);
    if (situationScenario && !contextualScenarios.includes(situationScenario)) {
      contextualScenarios.unshift(situationScenario);
    }

    // Add scenarios based on spending patterns
    if (userContext.spendingPatterns.savingsRate !== undefined) {
      if (userContext.spendingPatterns.savingsRate < 0.1) {
        const savingScenario = this.scenarios.find(s => s.id === 'saving');
        if (savingScenario && !contextualScenarios.includes(savingScenario)) {
          contextualScenarios.push(savingScenario);
        }
      }
    }

    return contextualScenarios;
  }

  /**
   * Find principles that match the identified scenarios
   */
  private findMatchingPrinciples(scenarios: FinancialScenario[]): ArthashashtraPrinciple[] {
    const matchingPrinciples: ArthashashtraPrinciple[] = [];

    for (const principle of this.principles) {
      for (const scenario of scenarios) {
        if (principle.relevantScenarios.some(ps => ps.id === scenario.id)) {
          if (!matchingPrinciples.includes(principle)) {
            matchingPrinciples.push(principle);
          }
        }
      }
    }

    return matchingPrinciples.length > 0 ? matchingPrinciples : [this.principles[0]];
  }

  /**
   * Rank wisdom by relevance to user context and query
   */
  private rankWisdomByRelevance(
    principles: ArthashashtraPrinciple[],
    userContext: UserFinancialContext,
    userQuery: string
  ): ContextualWisdom[] {
    const wisdomWithScores = principles.map(principle => {
      const relevanceScore = this.calculateRelevanceScore(principle, userContext, userQuery);
      const personalizedApplication = this.generatePersonalizedApplication(principle, userContext);
      const actionableSteps = this.generateActionableSteps(principle, userContext);
      const modernExamples = this.generateModernExamples(principle, userContext);

      return {
        principle,
        relevanceScore,
        personalizedApplication,
        actionableSteps,
        modernExamples
      };
    });

    return wisdomWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score for a principle
   */
  private calculateRelevanceScore(
    principle: ArthashashtraPrinciple,
    userContext: UserFinancialContext,
    userQuery: string
  ): number {
    let score = 0;

    // Base score for scenario match
    if (principle.relevantScenarios.some(s => s.id === userContext.currentSituation)) {
      score += 0.5;
    }

    // Query keyword matching
    const queryLower = userQuery.toLowerCase();
    for (const tag of principle.tags) {
      if (queryLower.includes(tag.replace('_', ' '))) {
        score += 0.2;
      }
    }

    // Context-specific boosts
    if (userContext.lifeStage === 'student' && principle.id === 'mitavyaya') {
      score += 0.3; // Moderation is especially important for students
    }

    if (userContext.riskProfile === 'conservative' && principle.id === 'sangraha_pariraksha') {
      score += 0.3; // Wealth protection resonates with conservative investors
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Generate personalized application of the principle
   */
  private generatePersonalizedApplication(
    principle: ArthashashtraPrinciple,
    userContext: UserFinancialContext
  ): string {
    const baseApplication = principle.modernInterpretation;
    
    // Customize based on life stage
    const lifeStageContext = this.getLifeStageContext(userContext.lifeStage);
    
    return `${baseApplication} For someone in the ${lifeStageContext} stage of life, this means focusing on ${this.getLifeStageSpecificAdvice(principle, userContext.lifeStage)}.`;
  }

  /**
   * Generate actionable steps based on principle and context
   */
  private generateActionableSteps(
    principle: ArthashashtraPrinciple,
    userContext: UserFinancialContext
  ): string[] {
    const baseSteps = principle.practicalAdvice;
    const contextualSteps: string[] = [];

    // Customize steps based on user context
    for (const step of baseSteps) {
      let customizedStep = step;
      
      // Add specific amounts or percentages if income is known
      if (userContext.spendingPatterns.monthlyIncome) {
        const income = userContext.spendingPatterns.monthlyIncome;
        if (step.includes('emergency fund')) {
          customizedStep = `Build an emergency fund of ₹${(income * 6).toLocaleString()} to ₹${(income * 12).toLocaleString()} (6-12 months of expenses)`;
        } else if (step.includes('saving') && principle.id === 'arthagama_vyaya') {
          const suggestedSavings = Math.round(income * 0.2);
          customizedStep = `${step} Aim to save at least ₹${suggestedSavings.toLocaleString()} per month (20% of your income)`;
        }
      }
      
      contextualSteps.push(customizedStep);
    }

    return contextualSteps;
  }

  /**
   * Generate modern examples relevant to the user
   */
  private generateModernExamples(
    principle: ArthashashtraPrinciple,
    userContext: UserFinancialContext
  ): string[] {
    const examples: string[] = [];

    switch (principle.id) {
      case 'kosha_mula_danda':
        examples.push('Building an emergency fund gives you the freedom to leave a toxic job');
        examples.push('Having savings allows you to negotiate better terms or take calculated risks');
        break;
      case 'arthagama_vyaya':
        examples.push('Using the 50/30/20 rule: 50% needs, 30% wants, 20% savings');
        examples.push('Tracking expenses with apps to ensure you stay within budget');
        break;
      case 'mitavyaya':
        examples.push('Choosing quality over quantity - buying fewer, better things');
        examples.push('Practicing the 24-hour rule before making non-essential purchases');
        break;
    }

    return examples;
  }

  /**
   * Generate personalized guidance combining wisdom with user context
   */
  private generatePersonalizedGuidance(
    wisdom: ContextualWisdom,
    userContext: UserFinancialContext,
    userQuery: string
  ): string {
    const principle = wisdom.principle;
    
    return `Based on your current situation and the wisdom of ${principle.sanskritTerm} (${principle.principle}) from the Arthashastra: 
    
${wisdom.personalizedApplication}

This ancient principle is particularly relevant to your query because ${this.explainRelevance(principle, userQuery)}.

${this.addContextualInsight(principle, userContext)}`;
  }

  /**
   * Generate cultural context explanation
   */
  private generateCulturalContext(wisdom: ContextualWisdom): string {
    return `${wisdom.principle.culturalContext}

This principle from Kautilya's Arthashastra (written around 300 BCE) demonstrates how ancient Indian economic thought anticipated modern financial principles. The Sanskrit term '${wisdom.principle.sanskritTerm}' encapsulates a concept that remains highly relevant in today's financial landscape.`;
  }

  /**
   * Find modern parallels to ancient wisdom
   */
  private findModernParallels(wisdom: ContextualWisdom): string[] {
    const parallels: string[] = [];
    const principle = wisdom.principle;

    switch (principle.id) {
      case 'kosha_mula_danda':
        parallels.push('Emergency Fund principle in modern personal finance');
        parallels.push('Warren Buffett\'s advice: "Cash is like oxygen"');
        break;
      case 'arthagama_vyaya':
        parallels.push('Modern budgeting rules like the 50/30/20 principle');
        parallels.push('Dave Ramsey\'s emphasis on living below your means');
        break;
      case 'mitavyaya':
        parallels.push('Minimalism and conscious consumption movements');
        parallels.push('Buddhist economics concept of "right livelihood"');
        break;
    }

    return parallels;
  }

  /**
   * Generate action plan based on wisdom and context
   */
  private generateActionPlan(
    wisdom: ContextualWisdom,
    userContext: UserFinancialContext
  ): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
    const principle = wisdom.principle;
    
    return {
      immediate: this.getImmediateActions(principle, userContext),
      shortTerm: this.getShortTermActions(principle, userContext),
      longTerm: this.getLongTermActions(principle, userContext)
    };
  }

  // Helper methods
  private getLifeStageContext(lifeStage: string): string {
    const contexts = {
      student: 'learning and skill-building',
      professional: 'career growth and wealth building', 
      family: 'family responsibilities and security',
      retirement: 'wealth preservation and legacy planning'
    };
    return contexts[lifeStage] || 'financial development';
  }

  private getLifeStageSpecificAdvice(principle: ArthashashtraPrinciple, lifeStage: string): string {
    // Customize advice based on life stage
    if (lifeStage === 'student' && principle.id === 'mitavyaya') {
      return 'developing disciplined spending habits that will serve you throughout life';
    }
    if (lifeStage === 'professional' && principle.id === 'kosha_mula_danda') {
      return 'building your financial foundation to support career growth and independence';
    }
    return principle.financialApplications[0];
  }

  private explainRelevance(principle: ArthashashtraPrinciple, userQuery: string): string {
    // Simple relevance explanation
    return `it addresses the core financial challenge you're facing and provides time-tested guidance`;
  }

  private addContextualInsight(principle: ArthashashtraPrinciple, userContext: UserFinancialContext): string {
    return `Given your ${userContext.riskProfile} risk profile and ${userContext.lifeStage} life stage, this principle can help you make more informed financial decisions.`;
  }

  private getImmediateActions(principle: ArthashashtraPrinciple, userContext: UserFinancialContext): string[] {
    return principle.practicalAdvice.slice(0, 2);
  }

  private getShortTermActions(principle: ArthashashtraPrinciple, userContext: UserFinancialContext): string[] {
    return principle.practicalAdvice.slice(1, 3);
  }

  private getLongTermActions(principle: ArthashashtraPrinciple, userContext: UserFinancialContext): string[] {
    return principle.practicalAdvice.slice(2);
  }
}
