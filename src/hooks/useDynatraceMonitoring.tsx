import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dynatraceMonitor } from '@/lib/dynatrace-monitor';

/**
 * Hook for component-level monitoring
 */
export function useComponentTracking(componentName: string) {
  const { user } = useAuth();

  const trackComponentEvent = useCallback((action: string, data?: Record<string, any>) => {
    const actionName = `${componentName}.${action}`;
    
    try {
      dynatraceMonitor.trackNavigation(actionName, {
        userId: user?.uid || 'anonymous',
        componentName,
        action,
        ...data
      });
    } catch (error) {
      console.debug('Component tracking error:', error);
    }
  }, [componentName, user?.uid]);

  return { trackComponentEvent };
}

/**
 * Hook for Firebase operation monitoring
 */
export function useMonitoredFirebase() {
  const { user } = useAuth();

  const trackFirebaseOperation = useCallback(async <T,>(
    operationName: string,
    operation: () => Promise<T>,
    data?: Record<string, any>
  ): Promise<T> => {
    const method = 'POST';
    const url = `/firebase/${operationName}`;
    
    try {
      const result = await dynatraceMonitor.trackXhrAction(
        `Firebase.${operationName}`, 
        method, 
        url, 
        operation
      );
      
      // Send BizEvent for successful operation
      dynatraceMonitor.sendBizEvent('Firebase Operation', {
        'event.name': 'Firebase Operation',
        operation: operationName,
        success: true,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        ...data
      });
      
      return result;
    } catch (error) {
      // Send BizEvent for failed operation
      dynatraceMonitor.sendBizEvent('Firebase Operation', {
        'event.name': 'Firebase Operation',
        operation: operationName,
        success: false,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      console.error(`Firebase ${operationName} error:`, error);
      throw error;
    }
  }, [user?.uid, user?.email]);

  return { trackFirebaseOperation };
}

/**
 * Hook for business event tracking
 */
export function useMonitoredBusiness() {
  const { user } = useAuth();

  const trackFinancialEvent = useCallback((
    eventType: string,
    amount: number,
    category: string,
    data?: Record<string, any>
  ) => {
    try {
      dynatraceMonitor.trackFinancialEvent(eventType, amount, category);
      
      // Also send detailed BizEvent
      dynatraceMonitor.sendBizEvent('Financial Transaction', {
        'event.name': 'Financial Transaction',
        eventType,
        amount,
        category,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        ...data
      });
    } catch (error) {
      console.debug('Financial event tracking error:', error);
    }
  }, [user?.uid, user?.email]);

  const trackProfileEvent = useCallback((
    action: string,
    profileName: string,
    data?: Record<string, any>
  ) => {
    try {
      dynatraceMonitor.sendBizEvent('Profile Management', {
        'event.name': 'Profile Management',
        action,
        profileName,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        ...data
      });
    } catch (error) {
      console.debug('Profile event tracking error:', error);
    }
  }, [user?.uid, user?.email]);

  const trackSystemEvent = useCallback((
    eventType: string,
    data?: Record<string, any>
  ) => {
    try {
      dynatraceMonitor.sendBizEvent('System Event', {
        'event.name': 'System Event',
        eventType,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        ...data
      });
    } catch (error) {
      console.debug('System event tracking error:', error);
    }
  }, [user?.uid, user?.email]);

  return { 
    trackFinancialEvent, 
    trackProfileEvent, 
    trackSystemEvent,
    trackUserJourney: useCallback((milestone: string, data?: any) => {
      try {
        dynatraceMonitor.trackUserJourney(milestone, {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'unknown',
          timestamp: new Date().toISOString(),
          ...data
        });
      } catch (error) {
        console.debug('User journey tracking error:', error);
      }
    }, [user?.uid, user?.email]),
    
    trackError: useCallback((error: Error | string, context?: any) => {
      try {
        dynatraceMonitor.trackError(error, {
          userId: user?.uid || 'anonymous',
          userEmail: user?.email || 'unknown',
          timestamp: new Date().toISOString(),
          ...context
        });
      } catch (trackingError) {
        console.debug('Error tracking error:', trackingError);
      }
    }, [user?.uid, user?.email])
  };
}
