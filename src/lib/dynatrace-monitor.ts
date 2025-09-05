// Dynatrace User Action Monitoring Service for FinBuddy
// Comprehensive monitoring for all user interactions, XHR calls, and business events

// Dynatrace Business Event interface
interface BizEventAttributes {
  "event.name": string;
  [key: string]: string | number | boolean;
}

interface DynatraceMonitoring {
  // Load Actions (UI interactions)
  trackClick: (element: HTMLElement, actionName: string, context?: any) => void;
  trackFormSubmit: (formName: string, data?: any) => void;
  trackNavigation: (route: string, context?: any) => void;
  trackSearch: (query: string, results?: number) => void;
  
  // XHR Actions (network calls)
  trackXhrAction: (actionName: string, method: string, url: string, operation: () => Promise<any>) => Promise<any>;
  
  // Firebase Operations (as XHR actions)
  trackFirebaseOperation: (operation: string, collection: string, success: boolean, data?: any) => void;
  trackExpenseOperation: (operation: 'create' | 'update' | 'delete', expense?: any) => void;
  trackBudgetOperation: (operation: 'create' | 'update' | 'delete', budget?: any) => void;
  trackAIOperation: (operation: string, success: boolean, responseTime?: number) => void;
  
  // Business Events
  sendBizEvent: (eventType: string, attributes: BizEventAttributes) => void;
  trackFinancialEvent: (eventType: string, amount?: number, category?: string) => void;
  trackUserJourney: (milestone: string, data?: any) => void;
  trackError: (error: Error | string, context?: any) => void;
  
  // Session Properties
  setUserContext: (userId: string, userProperties?: any) => void;
  setBudgetContext: (totalBudgets: number, activeBudgets: number) => void;
  setExpenseContext: (totalExpenses: number, monthlySpend: number) => void;
}

class FinBuddyDynatraceMonitor implements DynatraceMonitoring {
  private dtrum: any;
  private isEnabled: boolean = false;
  private actionCounter: number = 0;
  private sessionContext: any = {};

  constructor() {
    this.initializeDtrum();
    this.setupGlobalListeners();
  }

  private initializeDtrum() {
    // Check if dtrum is available globally
    if (typeof window !== 'undefined' && (window as any).dtrum) {
      this.dtrum = (window as any).dtrum;
      this.isEnabled = true;
      console.log('✅ FinBuddy Dynatrace monitoring initialized');
      
      // Setup action listeners
      this.setupActionListeners();
    } else {
      console.warn('⚠️ Dynatrace RUM not detected - monitoring disabled');
    }
  }

  private setupActionListeners() {
    if (!this.dtrum) return;

    // Global action enter listener
    this.dtrum.addEnterActionListener((actionData: any) => {
      const actionId = actionData.actionId;
      const actionName = actionData.name || 'Unknown Action';
      
      console.log(`🔍 Action Started: ${actionName} (ID: ${actionId})`);
      
      // Add context properties based on current app state
      this.addContextualProperties(actionId);
    });

    // Global action leave listener
    this.dtrum.addLeaveActionListener((actionData: any) => {
      const actionId = actionData.actionId;
      const actionName = actionData.name || 'Unknown Action';
      const duration = actionData.duration || 0;
      
      console.log(`✅ Action Completed: ${actionName} (ID: ${actionId}) - ${duration}ms`);
    });

    // Page leaving listener for cleanup
    this.dtrum.addPageLeavingListener(() => {
      this.dtrum.sendBeacon(false, true, false);
    });
  }

  private setupGlobalListeners() {
    if (typeof window === 'undefined') return;

    // Global click listener
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.handleGenericClick(target);
      }
    }, true);

    // Global form submit listener
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form) {
        this.handleFormSubmit(form);
      }
    }, true);

    // Global error listener
    window.addEventListener('error', (event) => {
      this.trackError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled-promise-rejection'
      });
    });
  }

  private addContextualProperties(actionId: number) {
    if (!this.dtrum) return;

    const contextData = {
      // Session context
      ...this.sessionContext,
      
      // App state context
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString(),
      actionSequence: ++this.actionCounter
    };

    // Add properties to action
    this.dtrum.addActionProperties(
      actionId,
      {
        actionSequence: { value: contextData.actionSequence, public: true }
      },
      {
        actionTimestamp: { value: new Date(), public: true }
      },
      {
        currentPath: { value: contextData.currentPath, public: true },
        userAgent: { value: navigator.userAgent, public: false }
      }
    );
  }

  private handleGenericClick(element: HTMLElement) {
    const actionName = this.generateClickActionName(element);
    const context = this.extractElementContext(element);
    
    this.trackClick(element, actionName, context);
  }

  private generateClickActionName(element: HTMLElement): string {
    // Button clicks
    if (element.tagName === 'BUTTON' || element.role === 'button') {
      const buttonText = element.textContent?.trim() || element.getAttribute('aria-label') || 'Button';
      return `Click: ${buttonText}`;
    }

    // Link clicks
    if (element.tagName === 'A' || element.closest('a')) {
      const link = element.closest('a') || element as HTMLAnchorElement;
      const href = link.href || link.getAttribute('href') || '';
      const linkText = link.textContent?.trim() || 'Link';
      return `Navigate: ${linkText}`;
    }

    // Tab clicks
    if (element.getAttribute('data-value') || element.role === 'tab') {
      const tabName = element.textContent?.trim() || element.getAttribute('data-value') || 'Tab';
      return `Tab Switch: ${tabName}`;
    }

    // Card clicks
    if (element.classList.contains('card') || element.closest('.card')) {
      return `Card Interaction: ${element.textContent?.substring(0, 50)}...`;
    }

    // Modal/Dialog clicks
    if (element.closest('[role="dialog"]') || element.closest('.modal')) {
      return `Modal: ${element.textContent?.trim() || 'Action'}`;
    }

    // Form controls
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      const fieldName = element.getAttribute('name') || element.getAttribute('placeholder') || element.tagName;
      return `Form Field: ${fieldName}`;
    }

    // Generic click
    const elementId = element.id || element.className.split(' ')[0] || element.tagName;
    return `Click: ${elementId}`;
  }

  private extractElementContext(element: HTMLElement) {
    return {
      tagName: element.tagName,
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.substring(0, 100) || undefined,
      role: element.role || undefined,
      dataAttributes: this.getDataAttributes(element)
    };
  }

  private getDataAttributes(element: HTMLElement): Record<string, string> {
    const dataAttrs: Record<string, string> = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }
    return dataAttrs;
  }

  private handleFormSubmit(form: HTMLFormElement) {
    const formName = form.getAttribute('name') || 
                    form.id || 
                    form.className.split(' ')[0] || 
                    'Unknown Form';
    
    this.trackFormSubmit(formName);
  }

  // Public API Implementation
  trackClick(element: HTMLElement, actionName: string, context?: any) {
    if (!this.dtrum) return;

    const userInput = this.dtrum.beginUserInput(element, 'click', '', 5000);
    
    // Set meaningful action name
    this.dtrum.actionName(actionName);

    console.log(`🎯 Click Tracked: ${actionName}`, context);

    // Add custom properties if context provided
    if (context) {
      setTimeout(() => {
        const actionId = this.getCurrentActionId();
        if (actionId) {
          this.dtrum.addActionProperties(
            actionId,
            undefined,
            undefined,
            {
              clickContext: { value: JSON.stringify(context).substring(0, 100), public: true },
              elementTag: { value: context.tagName || 'unknown', public: true }
            }
          );
        }
      }, 100);
    }

    this.dtrum.endUserInput(userInput);
  }

  trackFormSubmit(formName: string, data?: any) {
    if (!this.dtrum) return;

    const actionId = this.dtrum.enterAction(`Form Submit: ${formName}`);
    
    console.log(`📝 Form Submit Tracked: ${formName}`, data);

    if (data) {
      this.dtrum.addActionProperties(
        actionId,
        {
          formFieldCount: { value: Object.keys(data).length, public: true }
        },
        undefined,
        {
          formName: { value: formName, public: true },
          formData: { value: JSON.stringify(data).substring(0, 200), public: false }
        }
      );
    }

    setTimeout(() => {
      this.dtrum.leaveAction(actionId);
    }, 1000);
  }

  trackNavigation(route: string, context?: any) {
    if (!this.dtrum) return;

    this.dtrum.actionName(`Navigate to: ${route}`);
    
    console.log(`🧭 Navigation Tracked: ${route}`, context);

    const actionId = this.getCurrentActionId();
    if (actionId && context) {
      this.dtrum.addActionProperties(
        actionId,
        undefined,
        undefined,
        {
          route: { value: route, public: true },
          navigationContext: { value: JSON.stringify(context), public: true }
        }
      );
    }
  }

  trackSearch(query: string, results?: number) {
    if (!this.dtrum) return;

    const actionId = this.dtrum.enterAction(`Search: ${query.substring(0, 50)}`);
    
    console.log(`🔍 Search Tracked: "${query}" - ${results} results`);

    this.dtrum.addActionProperties(
      actionId,
      {
        searchResults: { value: results || 0, public: true }
      },
      undefined,
      {
        searchQuery: { value: query.substring(0, 100), public: true },
        searchType: { value: 'expense-search', public: true }
      }
    );

    setTimeout(() => {
      this.dtrum.leaveAction(actionId);
    }, 2000);
  }

  // XHR Action for network operations
  async trackXhrAction(actionName: string, method: string, url: string, operation: () => Promise<any>): Promise<any> {
    if (!this.dtrum) {
      return await operation();
    }

    const xhrAction = this.dtrum.enterXhrAction(actionName, method, url);
    console.log(`🌐 XHR Action Started: ${actionName} (${method} ${url})`);

    try {
      const result = await operation();
      
      this.dtrum.addActionProperties(
        xhrAction,
        {
          operationSuccess: { value: 1, public: true }
        },
        undefined,
        {
          xhrMethod: { value: method, public: true },
          xhrUrl: { value: url, public: true },
          operationName: { value: actionName, public: true }
        }
      );

      this.dtrum.leaveXhrAction(xhrAction);
      console.log(`✅ XHR Action Completed: ${actionName}`);
      return result;
      
    } catch (error) {
      console.error(`❌ XHR Action Failed: ${actionName}`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      
      this.dtrum.reportError(errorMessage, errorStack);
      this.dtrum.markXHRFailed(500, errorMessage, xhrAction);
      this.dtrum.leaveXhrAction(xhrAction);
      
      throw error;
    }
  }

  // Business Event tracking
  sendBizEvent(eventType: string, attributes: BizEventAttributes): void {
    if (!this.dtrum || typeof (window as any).dynatrace === 'undefined') {
      console.warn(`📊 BizEvent queued (Dynatrace not ready): ${eventType}`, attributes);
      return;
    }

    try {
      (window as any).dynatrace.sendBizEvent(eventType, attributes);
      console.log(`📊 BizEvent Sent: ${eventType}`, attributes);
    } catch (error) {
      console.error(`❌ BizEvent Failed: ${eventType}`, error);
      this.trackError(error instanceof Error ? error : new Error('BizEvent send failed'), {
        eventType,
        attributes
      });
    }
  }

  trackFirebaseOperation(operation: string, collection: string, success: boolean, data?: any) {
    if (!this.dtrum) return;

    // Use XHR action for Firebase operations
    const xhrAction = this.dtrum.enterXhrAction(
      `Firebase ${operation}: ${collection}`, 
      operation.toUpperCase().includes('GET') || operation.toUpperCase().includes('FETCH') ? 'GET' : 'POST', 
      `https://firestore.googleapis.com/v1/${collection}`
    );
    
    console.log(`🔥 Firebase XHR Operation: ${operation} on ${collection} - ${success ? 'Success' : 'Failed'}`);

    try {
      this.dtrum.addActionProperties(
        xhrAction,
        {
          operationSuccess: { value: success ? 1 : 0, public: true }
        },
        undefined,
        {
          firebaseOperation: { value: operation, public: true },
          firebaseCollection: { value: collection, public: true },
          operationData: { value: data ? JSON.stringify(data).substring(0, 200) : 'none', public: false }
        }
      );

      if (!success) {
        this.dtrum.reportError(`Firebase ${operation} failed on ${collection}`, '');
        this.dtrum.markXHRFailed(400, `Firebase ${operation} failed`, xhrAction);
      }
      
      this.dtrum.leaveXhrAction(xhrAction);
      
      // Send BizEvent for Firebase operations
      if (success) {
        this.sendBizEvent('com.finbuddy.firebase.operation', {
          "event.name": `Firebase ${operation}`,
          "collection": collection,
          "operation": operation,
          "success": true,
          "timestamp": Date.now()
        });
      }
    } catch (error) {
      console.error(`❌ Firebase XHR tracking error:`, error);
      this.dtrum.reportError(error instanceof Error ? error.message : 'Firebase tracking failed', '');
      this.dtrum.leaveXhrAction(xhrAction);
    }
  }

  trackExpenseOperation(operation: 'create' | 'update' | 'delete', expense?: any) {
    if (!this.dtrum) return;

    // Track as XHR action since it involves Firebase
    this.trackFirebaseOperation(operation, 'expenses', true, expense);
    
    console.log(`💰 Expense ${operation}: `, expense);

    // Send BizEvent for expense operations
    if (expense && expense.amount && expense.category) {
      this.sendBizEvent('com.finbuddy.expense.operation', {
        "event.name": `Expense ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
        "operation": operation,
        "category": expense.category,
        "amount": expense.amount,
        "currency": "USD", // Default currency
        "timestamp": Date.now(),
        "hasReceipt": Boolean(expense.receiptUrl)
      });
    }
  }

  trackBudgetOperation(operation: 'create' | 'update' | 'delete', budget?: any) {
    if (!this.dtrum) return;

    // Track as XHR action since it involves Firebase
    this.trackFirebaseOperation(operation, 'budgets', true, budget);
    
    console.log(`📊 Budget ${operation}: `, budget);

    // Send BizEvent for budget operations
    if (budget && budget.limit) {
      this.sendBizEvent('com.finbuddy.budget.operation', {
        "event.name": `Budget ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
        "operation": operation,
        "category": budget.category || 'general',
        "amount": budget.limit,
        "currency": "USD",
        "timestamp": Date.now()
      });
    }
  }

  trackAIOperation(operation: string, success: boolean, responseTime?: number) {
    if (!this.dtrum) return;

    // Use XHR action for AI operations since they involve network calls
    const xhrAction = this.dtrum.enterXhrAction(
      `AI: ${operation}`, 
      'POST', 
      'https://us-central1-finbuddy.cloudfunctions.net/chatWithGemini'
    );
    
    console.log(`🤖 AI XHR Operation: ${operation} - ${success ? 'Success' : 'Failed'} (${responseTime}ms)`);

    try {
      this.dtrum.addActionProperties(
        xhrAction,
        {
          aiResponseTime: { value: responseTime || 0, public: true },
          aiSuccess: { value: success ? 1 : 0, public: true }
        },
        undefined,
        {
          aiOperation: { value: operation, public: true },
          aiProvider: { value: 'kautilyaai', public: true }
        }
      );

      if (!success) {
        this.dtrum.reportError(`AI operation failed: ${operation}`, '');
        this.dtrum.markXHRFailed(500, `AI operation failed: ${operation}`, xhrAction);
      }

      this.dtrum.leaveXhrAction(xhrAction);
      
      // Send BizEvent for AI operations
      this.sendBizEvent('com.finbuddy.ai.operation', {
        "event.name": `AI ${operation}`,
        "operation": operation,
        "success": success,
        "responseTime": responseTime || 0,
        "timestamp": Date.now()
      });
      
    } catch (error) {
      console.error(`❌ AI XHR tracking error:`, error);
      this.dtrum.reportError(error instanceof Error ? error.message : 'AI tracking failed', '');
      this.dtrum.leaveXhrAction(xhrAction);
    }
  }

  trackFinancialEvent(eventType: string, amount?: number, category?: string) {
    if (!this.dtrum) return;

    // Use load action for financial events (UI-triggered)
    const loadAction = this.dtrum.enterAction(`Financial Event: ${eventType}`, 'custom');
    
    console.log(`💼 Financial Event: ${eventType} - $${amount} (${category})`);

    try {
      this.dtrum.addActionProperties(
        loadAction,
        {
          eventAmount: { value: amount ? Math.round(amount * 100) : 0, public: true }
        },
        undefined,
        {
          eventType: { value: eventType, public: true },
          eventCategory: { value: category || 'general', public: true },
          currency: { value: 'USD', public: true }
        }
      );

      // Send BizEvent for financial events
      this.sendBizEvent('com.finbuddy.financial.event', {
        "event.name": eventType,
        "category": category || 'general',
        "amount": amount || 0,
        "currency": "USD",
        "timestamp": Date.now()
      });

      this.dtrum.leaveAction(loadAction);
    } catch (error) {
      console.error(`❌ Financial event tracking error:`, error);
      this.dtrum.reportError(error instanceof Error ? error.message : 'Financial event tracking failed', '');
      this.dtrum.leaveAction(loadAction);
    }
  }

  trackUserJourney(milestone: string, data?: any) {
    if (!this.dtrum) return;

    // Use load action for user journey milestones (UI interactions)
    const loadAction = this.dtrum.enterAction(`Journey: ${milestone}`, 'custom');
    
    console.log(`🚀 User Journey: ${milestone}`, data);

    try {
      this.dtrum.addActionProperties(
        loadAction,
        {
          journeyTimestamp: { value: Date.now(), public: true }
        },
        undefined,
        {
          journeyMilestone: { value: milestone, public: true },
          journeyData: { value: data ? JSON.stringify(data).substring(0, 100) : '', public: true }
        }
      );

      this.dtrum.leaveAction(loadAction);

      // Send BizEvent for user journey milestones
      this.sendBizEvent('com.finbuddy.user.journey', {
        "event.name": `Journey ${milestone}`,
        "milestone": milestone,
        "timestamp": Date.now(),
        ...data
      });
      
    } catch (error) {
      console.error(`❌ User journey tracking error:`, error);
      this.dtrum.reportError(error instanceof Error ? error.message : 'User journey tracking failed', '');
      this.dtrum.leaveAction(loadAction);
    }
  }

  trackError(error: Error | string, context?: any) {
    if (!this.dtrum) return;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;

    console.error(`❌ Error Tracked: ${errorMessage}`, context);

    try {
      // Report to Dynatrace
      this.dtrum.reportError(errorMessage, errorStack || '');

      // Add context if current action exists
      const currentAction = this.getCurrentActionId();
      if (currentAction && context) {
        this.dtrum.addActionProperties(
          currentAction,
          undefined,
          undefined,
          {
            errorContext: { value: JSON.stringify(context), public: false }
          }
        );
      }

      // Send BizEvent for significant errors
      this.sendBizEvent('com.finbuddy.error', {
        "event.name": "Application Error",
        "errorMessage": errorMessage,
        "errorType": typeof error === 'object' ? error.constructor.name : 'string',
        "timestamp": Date.now(),
        "context": JSON.stringify(context || {})
      });
      
    } catch (trackingError) {
      console.error(`❌ Error tracking failed:`, trackingError);
    }
  }

  setUserContext(userId: string, userProperties?: any) {
    if (!this.dtrum) return;

    // Identify user for Dynatrace using email if available, fallback to userId
    const userIdentifier = userProperties?.email || userId;
    this.dtrum.identifyUser(userIdentifier);

    console.log(`👤 Dynatrace User Identified: ${userIdentifier}`, userProperties);

    // Store session context
    this.sessionContext = {
      ...this.sessionContext,
      userId,
      ...userProperties
    };

    console.log(`👤 User Context Set: ${userId}`, userProperties);

    // Send session properties
    this.dtrum.sendSessionProperties(
      undefined,
      {
        userRegistration: { value: new Date(), public: true }
      },
      {
        userId: { value: userId, public: false },
        userType: { value: userProperties?.userType || 'regular', public: true }
      }
    );
  }

  setBudgetContext(totalBudgets: number, activeBudgets: number) {
    if (!this.dtrum) return;

    this.sessionContext.budgetContext = {
      totalBudgets,
      activeBudgets
    };

    console.log(`📊 Budget Context: ${activeBudgets}/${totalBudgets} active`);

    this.dtrum.sendSessionProperties(
      {
        totalBudgets: { value: totalBudgets, public: true },
        activeBudgets: { value: activeBudgets, public: true }
      }
    );
  }

  setExpenseContext(totalExpenses: number, monthlySpend: number) {
    if (!this.dtrum) return;

    this.sessionContext.expenseContext = {
      totalExpenses,
      monthlySpend
    };

    console.log(`💰 Expense Context: ${totalExpenses} expenses, ₹${monthlySpend} monthly`);

    this.dtrum.sendSessionProperties(
      {
        totalExpenses: { value: totalExpenses, public: true },
        monthlySpend: { value: Math.round(monthlySpend * 100), public: true }
      },
      undefined,
      {
        spendCurrency: { value: 'INR', public: true }
      }
    );
  }

  private getCurrentActionId(): number | null {
    // This would need to be implemented based on Dynatrace's internal action tracking
    // For now, return null as we'll use the global action listeners
    return null;
  }
}

// Export singleton instance
export const dynatraceMonitor = new FinBuddyDynatraceMonitor();

// Global window reference for debugging
if (typeof window !== 'undefined') {
  (window as any).finBuddyMonitoring = dynatraceMonitor;
}
