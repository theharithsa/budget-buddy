// Dynatrace Monitoring Hooks for React Components
// Custom hooks to easily integrate monitoring into React components

import { useCallback, useEffect, useRef } from 'react';
import { dynatraceMonitor } from '../lib/dynatrace-monitor';

// Hook for tracking clicks on elements
export function useMonitoredClick(actionName: string, context?: any) {
  return useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement;
    dynatraceMonitor.trackClick(element, actionName, context);
  }, [actionName, context]);
}

// Hook for tracking form submissions
export function useMonitoredForm(formName: string) {
  return useCallback((formData: any) => {
    dynatraceMonitor.trackFormSubmit(formName, formData);
  }, [formName]);
}

// Hook for tracking navigation events
export function useMonitoredNavigation() {
  return useCallback((route: string, context?: any) => {
    dynatraceMonitor.trackNavigation(route, context);
  }, []);
}

// Hook for tracking search operations
export function useMonitoredSearch() {
  return useCallback((query: string, results?: number) => {
    dynatraceMonitor.trackSearch(query, results);
  }, []);
}

// Hook for tracking Firebase operations
export function useMonitoredFirebase() {
  const trackOperation = useCallback((operation: string, collection: string, success: boolean, data?: any) => {
    dynatraceMonitor.trackFirebaseOperation(operation, collection, success, data);
  }, []);

  const trackXhrOperation = useCallback(async <T,>(
    operationName: string, 
    url: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return dynatraceMonitor.trackXhrAction(operationName, 'POST', url, operation);
  }, []);

  const trackExpense = useCallback((operation: 'create' | 'update' | 'delete', expense?: any) => {
    dynatraceMonitor.trackExpenseOperation(operation, expense);
  }, []);

  const trackBudget = useCallback((operation: 'create' | 'update' | 'delete', budget?: any) => {
    dynatraceMonitor.trackBudgetOperation(operation, budget);
  }, []);

  const trackAI = useCallback((operation: string, success: boolean, responseTime?: number) => {
    dynatraceMonitor.trackAIOperation(operation, success, responseTime);
  }, []);

  return {
    trackOperation,
    trackXhrOperation,
    trackExpense,
    trackBudget,
    trackAI
  };
}

// Hook for tracking business events
export function useMonitoredBusiness() {
  const trackFinancialEvent = useCallback((eventType: string, amount?: number, category?: string) => {
    dynatraceMonitor.trackFinancialEvent(eventType, amount, category);
  }, []);

  const trackUserJourney = useCallback((milestone: string, data?: any) => {
    dynatraceMonitor.trackUserJourney(milestone, data);
  }, []);

  const trackError = useCallback((error: Error | string, context?: any) => {
    dynatraceMonitor.trackError(error, context);
  }, []);

  return {
    trackFinancialEvent,
    trackUserJourney,
    trackError
  };
}

// Hook for setting user context
export function useMonitoredUserContext() {
  const setUserContext = useCallback((userId: string, userProperties?: any) => {
    dynatraceMonitor.setUserContext(userId, userProperties);
  }, []);

  const setBudgetContext = useCallback((totalBudgets: number, activeBudgets: number) => {
    dynatraceMonitor.setBudgetContext(totalBudgets, activeBudgets);
  }, []);

  const setExpenseContext = useCallback((totalExpenses: number, monthlySpend: number) => {
    dynatraceMonitor.setExpenseContext(totalExpenses, monthlySpend);
  }, []);

  return {
    setUserContext,
    setBudgetContext,
    setExpenseContext
  };
}

// Hook for automatic page tracking
export function usePageTracking(pageName: string, pageGroup?: string) {
  useEffect(() => {
    dynatraceMonitor.trackUserJourney(`Page Visit: ${pageName}`, {
      pageGroup,
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });

    // Track page view duration
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      dynatraceMonitor.trackUserJourney(`Page Exit: ${pageName}`, {
        duration,
        pageGroup
      });
    };
  }, [pageName, pageGroup]);
}

// Hook for component lifecycle tracking
export function useComponentTracking(componentName: string) {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    // Component mounted
    dynatraceMonitor.trackUserJourney(`Component Mount: ${componentName}`, {
      timestamp: new Date().toISOString()
    });

    return () => {
      // Component unmounted
      const lifetime = Date.now() - mountTime.current;
      dynatraceMonitor.trackUserJourney(`Component Unmount: ${componentName}`, {
        lifetime
      });
    };
  }, [componentName]);

  // Return tracking functions for component-specific events
  return {
    trackComponentEvent: useCallback((eventName: string, data?: any) => {
      dynatraceMonitor.trackUserJourney(`${componentName}: ${eventName}`, data);
    }, [componentName]),
    
    trackComponentError: useCallback((error: Error | string, context?: any) => {
      dynatraceMonitor.trackError(error, {
        component: componentName,
        ...context
      });
    }, [componentName])
  };
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const trackPerformance = useCallback((operationName: string, startTime: number, endTime?: number) => {
    const actualEndTime = endTime || Date.now();
    const duration = actualEndTime - startTime;
    
    dynatraceMonitor.trackUserJourney(`Performance: ${operationName}`, {
      duration,
      startTime,
      endTime: actualEndTime
    });
  }, []);

  const trackAsyncOperation = useCallback(async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await operation();
      trackPerformance(operationName, startTime);
      return result;
    } catch (error) {
      dynatraceMonitor.trackError(error as Error, {
        operation: operationName,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }, [trackPerformance]);

  return {
    trackPerformance,
    trackAsyncOperation
  };
}

// Hook for error boundary integration
export function useErrorBoundaryTracking(componentName: string) {
  return useCallback((error: Error, errorInfo: any) => {
    dynatraceMonitor.trackError(error, {
      component: componentName,
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
      errorStack: error.stack
    });
  }, [componentName]);
}

// Hook for tab/route tracking
export function useTabTracking() {
  return useCallback((tabName: string, previousTab?: string) => {
    dynatraceMonitor.trackUserJourney(`Tab Switch: ${tabName}`, {
      previousTab,
      timestamp: new Date().toISOString()
    });
    
    dynatraceMonitor.trackNavigation(`/tab/${tabName.toLowerCase()}`, {
      tabName,
      previousTab
    });
  }, []);
}
