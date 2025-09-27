// Dynatrace RUM (Real User Monitoring) integration service
// Provides comprehensive monitoring capabilities for FinBuddy v3.0.0

declare global {
  interface Window {
    dtrum?: {
      enterAction: (name: string, type?: string) => number;
      leaveAction: (actionId: number) => void;
      enterXhrAction: (name: string, type?: string, url?: string) => number;
      leaveXhrAction: (actionId: number) => void;
      reportError: (error: string | Error, parentActionId?: number) => void;
      sendBizEvent: (eventType: string, data: Record<string, any>) => void;
      addActionProperties: (actionId: number, properties: Record<string, any>) => void;
    };
  }
}

export interface MonitoringMetadata {
  userId?: string;
  userEmail?: string;
  profileId?: string;
  profileName?: string;
  component?: string;
  feature?: string;
  [key: string]: any;
}

export interface BizEventData {
  'event.name': string;
  [key: string]: any;
}

class DynatraceMonitor {
  private isEnabled: boolean = false;
  private pendingEvents: Array<{ type: 'bizvEvent' | 'error'; data: any }> = [];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Check if Dynatrace RUM is available with required methods
    if (typeof window !== 'undefined' && 
        window.dtrum && 
        typeof window.dtrum.sendBizEvent === 'function') {
      this.isEnabled = true;
      console.log('[Dynatrace] RUM monitoring initialized with full API');
      this.flushPendingEvents();
    } else {
      console.warn('[Dynatrace] RUM not available or incomplete - events will be queued');
      // In development, we might want to poll for dtrum availability
      this.pollForDtrum();
    }
  }

  private pollForDtrum(): void {
    // Poll for dtrum availability (useful during development)
    const pollInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 
          window.dtrum && 
          typeof window.dtrum.sendBizEvent === 'function') {
        this.isEnabled = true;
        console.log('[Dynatrace] RUM monitoring enabled with full API');
        clearInterval(pollInterval);
        this.flushPendingEvents();
      }
    }, 1000);

    // Stop polling after 30 seconds
    // Stop polling after 30 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      if (!this.isEnabled) {
        console.warn('[Dynatrace] RUM polling stopped - remaining in queue-only mode');
      }
    }, 30000);
  }

  private flushPendingEvents(): void {
    if (!this.isEnabled || !window.dtrum) return;

    this.pendingEvents.forEach(event => {
      try {
        if (event.type === 'bizvEvent') {
          window.dtrum!.sendBizEvent(event.data.type, event.data.data);
        } else if (event.type === 'error') {
          window.dtrum!.reportError(event.data.error, event.data.parentActionId);
        }
      } catch (error) {
        console.error('[Dynatrace] Error flushing pending event:', error);
      }
    });

    this.pendingEvents = [];
  }

  /**
   * Track a user action (e.g., button click, form submission)
   */
  public trackAction<T>(
    actionName: string,
    actionType: string = 'custom',
    actionFunction: () => T,
    metadata?: MonitoringMetadata
  ): T {
    if (!this.isEnabled || 
        !window.dtrum || 
        typeof window.dtrum.enterAction !== 'function') {
      // Fallback: execute action without monitoring
      try {
        return actionFunction();
      } catch (error) {
        console.error(`[Action] ${actionName} failed:`, error);
        throw error;
      }
    }

    let actionId: number;
    try {
      actionId = window.dtrum.enterAction(actionName, actionType);
    } catch (error) {
      console.warn('[Dynatrace] Failed to enter action, executing without tracking:', error);
      return actionFunction();
    }
    
    try {
      // Add metadata as action properties
      if (metadata && typeof window.dtrum.addActionProperties === 'function') {
        window.dtrum.addActionProperties(actionId, metadata);
      }

      const result = actionFunction();
      
      // If result is a promise, handle it asynchronously
      if (result instanceof Promise) {
        return result.finally(() => {
          if (typeof window.dtrum?.leaveAction === 'function') {
            window.dtrum.leaveAction(actionId);
          }
        }) as T;
      }

      if (typeof window.dtrum.leaveAction === 'function') {
        window.dtrum.leaveAction(actionId);
      }
      return result;

    } catch (error) {
      // Report error with action context
      if (typeof window.dtrum.reportError === 'function') {
        window.dtrum.reportError(error instanceof Error ? error : new Error(String(error)), actionId);
      }
      if (typeof window.dtrum.leaveAction === 'function') {
        window.dtrum.leaveAction(actionId);
      }
      throw error;
    }
  }

  /**
   * Track an asynchronous user action
   */
  public async trackActionAsync<T>(
    actionName: string,
    actionType: string = 'custom',
    actionFunction: () => Promise<T>,
    metadata?: MonitoringMetadata
  ): Promise<T> {
    if (!this.isEnabled || !window.dtrum) {
      try {
        return await actionFunction();
      } catch (error) {
        console.error(`[AsyncAction] ${actionName} failed:`, error);
        throw error;
      }
    }

    const actionId = window.dtrum.enterAction(actionName, actionType);

    try {
      if (metadata) {
        window.dtrum.addActionProperties(actionId, metadata);
      }

      const result = await actionFunction();
      window.dtrum.leaveAction(actionId);
      return result;

    } catch (error) {
      window.dtrum.reportError(error instanceof Error ? error : new Error(String(error)), actionId);
      window.dtrum.leaveAction(actionId);
      throw error;
    }
  }

  /**
   * Track XHR/API calls (Firebase operations, HTTP requests)
   */
  public async trackXhrAction<T>(
    actionName: string,
    method: string = 'GET',
    url: string = '',
    actionFunction: () => Promise<T>,
    metadata?: MonitoringMetadata
  ): Promise<T> {
    if (!this.isEnabled || 
        !window.dtrum || 
        typeof window.dtrum.enterXhrAction !== 'function') {
      try {
        return await actionFunction();
      } catch (error) {
        console.error(`[XHR] ${actionName} failed:`, error);
        throw error;
      }
    }

    let actionId: number;
    try {
      actionId = window.dtrum.enterXhrAction(`${method} ${actionName}`, 'xhr', url);
    } catch (error) {
      console.warn('[Dynatrace] Failed to enter XHR action, executing without tracking:', error);
      return await actionFunction();
    }

    try {
      if (metadata && typeof window.dtrum.addActionProperties === 'function') {
        window.dtrum.addActionProperties(actionId, metadata);
      }

      const result = await actionFunction();
      
      if (typeof window.dtrum.leaveXhrAction === 'function') {
        window.dtrum.leaveXhrAction(actionId);
      }
      return result;

    } catch (error) {
      if (typeof window.dtrum.reportError === 'function') {
        window.dtrum.reportError(error instanceof Error ? error : new Error(String(error)), actionId);
      }
      if (typeof window.dtrum.leaveXhrAction === 'function') {
        window.dtrum.leaveXhrAction(actionId);
      }
      throw error;
    }
  }

  /**
   * Send business events for analytics and business intelligence
   */
  public sendBizEvent(eventType: string, data: BizEventData): void {
    if (!this.isEnabled || !window.dtrum || typeof window.dtrum.sendBizEvent !== 'function') {
      // Queue the event for later
      this.pendingEvents.push({
        type: 'bizvEvent',
        data: { type: eventType, data }
      });
      console.log(`[BizEvent] ${eventType} (queued - dtrum not ready):`, data);
      return;
    }

    try {
      window.dtrum.sendBizEvent(eventType, data);
      console.log(`[BizEvent] ${eventType}:`, data);
    } catch (error) {
      console.error('[Dynatrace] Error sending business event:', error);
      // Queue for retry if the call failed
      this.pendingEvents.push({
        type: 'bizvEvent',
        data: { type: eventType, data }
      });
    }
  }

  /**
   * Report errors manually
   */
  public reportError(error: string | Error, parentActionId?: number): void {
    if (!this.isEnabled || 
        !window.dtrum || 
        typeof window.dtrum.reportError !== 'function') {
      this.pendingEvents.push({
        type: 'error',
        data: { error, parentActionId }
      });
      console.error('[Error] (queued - dtrum not ready):', error);
      return;
    }

    try {
      window.dtrum.reportError(error, parentActionId);
      console.error('[Error]:', error);
    } catch (err) {
      console.error('[Dynatrace] Error reporting error:', err);
      console.error('[Error] (fallback):', error);
    }
  }

  /**
   * Get monitoring status
   */
  public getStatus(): { enabled: boolean; pendingEvents: number } {
    return {
      enabled: this.isEnabled,
      pendingEvents: this.pendingEvents.length
    };
  }

  /**
   * Enable/disable monitoring (for testing)
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled && !!window.dtrum;
    
    if (this.isEnabled) {
      this.flushPendingEvents();
    }
  }
}

// Create singleton instance
export const dynatraceMonitor = new DynatraceMonitor();

// Export as default as well for convenience
export default dynatraceMonitor;
