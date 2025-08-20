// Comprehensive Logging System for Budget Buddy
// Supports both console logging and Dynatrace log ingestion

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  details?: any;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

interface LoggerConfig {
  dynatraceUrl?: string;
  dynatraceToken?: string;
  enableConsole: boolean;
  enableDynatrace: boolean;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  bufferSize: number;
  flushInterval: number; // milliseconds
}

class BudgetBuddyLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsole: true,
      enableDynatrace: Boolean(config.dynatraceUrl && config.dynatraceToken),
      logLevel: 'INFO',
      bufferSize: 100,
      flushInterval: 5000, // 5 seconds
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.startFlushTimer();
    this.isInitialized = true;

    this.info('Logger', 'BudgetBuddy Logger initialized', {
      sessionId: this.sessionId,
      config: {
        ...this.config,
        dynatraceToken: this.config.dynatraceToken ? '***' : undefined
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('GlobalError', 'Unhandled JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('GlobalError', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Capture console errors and warnings
    this.interceptConsole();
  }

  private interceptConsole(): void {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      this.error('Console', 'Console error', { args });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.warn('Console', 'Console warning', { args });
      originalWarn.apply(console, args);
    };
  }

  private shouldLog(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): boolean {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[this.config.logLevel];
  }

  private createLogEntry(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    category: string,
    message: string,
    details?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error?.stack || (new Error().stack?.split('\n').slice(2).join('\n'))
    };
  }

  private async processLog(entry: LogEntry): Promise<void> {
    // Console logging
    if (this.config.enableConsole) {
      const style = this.getConsoleStyle(entry.level);
      const logMethod = entry.level === 'ERROR' ? console.error : 
                      entry.level === 'WARN' ? console.warn : 
                      entry.level === 'DEBUG' ? console.debug : console.log;

      logMethod(
        `%c[${entry.timestamp}] [${entry.level}] [${entry.category}]`,
        style,
        entry.message,
        entry.details || ''
      );
    }

    // Buffer for Dynatrace
    if (this.config.enableDynatrace) {
      this.logBuffer.push(entry);
      
      if (this.logBuffer.length >= this.config.bufferSize) {
        await this.flushToDynatrace();
      }
    }
  }

  private getConsoleStyle(level: string): string {
    const styles = {
      DEBUG: 'color: #888; font-weight: normal',
      INFO: 'color: #0066cc; font-weight: bold',
      WARN: 'color: #ff8800; font-weight: bold',
      ERROR: 'color: #cc0000; font-weight: bold; background: #ffeeee'
    };
    return styles[level as keyof typeof styles] || styles.INFO;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    
    this.flushTimer = setInterval(async () => {
      if (this.logBuffer.length > 0) {
        await this.flushToDynatrace();
      }
    }, this.config.flushInterval);
  }

  private async flushToDynatrace(): Promise<void> {
    if (!this.config.enableDynatrace || !this.config.dynatraceUrl || !this.config.dynatraceToken || this.logBuffer.length === 0) {
      return;
    }

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const dynatracePayload = {
        'dt.entity.custom_device': `budget-buddy-frontend`,
        'dt.entity.custom_device_group': 'Budget Buddy Apps',
        'service.name': 'budget-buddy-frontend',
        'service.version': '1.0.0',
        logs: logs.map(log => ({
          timestamp: log.timestamp,
          'log.level': log.level,
          content: log.message,
          'log.source': 'budget-buddy',
          'user.session': log.sessionId,
          'user.agent': log.userAgent,
          'page.url': log.url,
          category: log.category,
          ...(log.details && { details: JSON.stringify(log.details) }),
          ...(log.stackTrace && { 'error.stack': log.stackTrace }),
          ...(log.userId && { 'user.id': log.userId })
        }))
      };

      const response = await fetch(`${this.config.dynatraceUrl}/api/v2/logs/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Token ${this.config.dynatraceToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dynatracePayload)
      });

      if (!response.ok) {
        console.warn('Failed to send logs to Dynatrace:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('Error sending logs to Dynatrace:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logs);
    }
  }

  // Public logging methods
  debug(category: string, message: string, details?: any): void {
    if (!this.shouldLog('DEBUG')) return;
    const entry = this.createLogEntry('DEBUG', category, message, details);
    this.processLog(entry);
  }

  info(category: string, message: string, details?: any): void {
    if (!this.shouldLog('INFO')) return;
    const entry = this.createLogEntry('INFO', category, message, details);
    this.processLog(entry);
  }

  warn(category: string, message: string, details?: any): void {
    if (!this.shouldLog('WARN')) return;
    const entry = this.createLogEntry('WARN', category, message, details);
    this.processLog(entry);
  }

  error(category: string, message: string, details?: any, error?: Error): void {
    if (!this.shouldLog('ERROR')) return;
    const entry = this.createLogEntry('ERROR', category, message, details, error);
    this.processLog(entry);
  }

  // Specialized logging methods
  userAction(action: string, details?: any): void {
    this.info('UserAction', action, details);
  }

  apiCall(method: string, url: string, status?: number, duration?: number, error?: any): void {
    const level = error ? 'ERROR' : status && status >= 400 ? 'WARN' : 'INFO';
    const category = 'APICall';
    const message = `${method} ${url}`;
    const logDetails = {
      method,
      url,
      status,
      duration,
      ...(error && { error: error.message || error })
    };

    if (level === 'ERROR') {
      this.error(category, message, logDetails, error);
    } else if (level === 'WARN') {
      this.warn(category, message, logDetails);
    } else {
      this.info(category, message, logDetails);
    }
  }

  performance(operation: string, duration: number, details?: any): void {
    this.info('Performance', `${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...details
    });
  }

  // Set user context
  setUser(userId: string): void {
    this.info('Auth', 'User context set', { userId });
    // Store userId for future logs
    (this as any).userId = userId;
  }

  // Manual flush
  async flush(): Promise<void> {
    await this.flushToDynatrace();
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
    this.info('Logger', 'BudgetBuddy Logger destroyed');
  }
}

// Singleton instance
let loggerInstance: BudgetBuddyLogger | null = null;

export function initializeLogger(config?: Partial<LoggerConfig>): BudgetBuddyLogger {
  if (!loggerInstance) {
    loggerInstance = new BudgetBuddyLogger(config);
  }
  return loggerInstance;
}

export function getLogger(): BudgetBuddyLogger {
  if (!loggerInstance) {
    loggerInstance = new BudgetBuddyLogger();
  }
  return loggerInstance;
}

// Convenience functions
export const log = {
  debug: (category: string, message: string, details?: any) => getLogger().debug(category, message, details),
  info: (category: string, message: string, details?: any) => getLogger().info(category, message, details),
  warn: (category: string, message: string, details?: any) => getLogger().warn(category, message, details),
  error: (category: string, message: string, details?: any, error?: Error) => getLogger().error(category, message, details, error),
  userAction: (action: string, details?: any) => getLogger().userAction(action, details),
  apiCall: (method: string, url: string, status?: number, duration?: number, error?: any) => getLogger().apiCall(method, url, status, duration, error),
  performance: (operation: string, duration: number, details?: any) => getLogger().performance(operation, duration, details),
  setUser: (userId: string) => getLogger().setUser(userId)
};

export { BudgetBuddyLogger };
export type { LoggerConfig, LogEntry };
