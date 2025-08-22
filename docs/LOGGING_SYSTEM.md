# 📝 Logging System - Budget Buddy

**Application**: Budget Buddy v2.2.1  
**Last Updated**: August 2025  
**Status**: Available but Disabled (Performance Issues)

## 📋 Overview

Budget Buddy includes a comprehensive logging system designed for production monitoring and debugging. However, the system is currently **disabled** due to performance issues that caused application hangs. This document outlines the logging architecture and provides guidance for future implementation.

## ⚠️ Current Status

### **System Status: DISABLED**

The logging system was temporarily disabled due to:
- **Performance Impact**: Causing application hangs and slow response times
- **Memory Consumption**: Excessive memory usage from log buffering
- **User Experience**: Degraded application performance affecting user interactions

### **Alternative Monitoring**

Current monitoring relies on:
- ✅ **Console Logging**: Development debugging via browser console
- ✅ **Error Boundaries**: React error boundaries for component errors
- ✅ **Firebase Analytics**: User behavior and basic performance tracking
- 🟡 **Dynatrace**: Optional third-party monitoring (when configured)

## 🏗️ Logging Architecture

### **System Design**

| Component | Purpose | Status |
|-----------|---------|--------|
| **Core Logger** | `src/lib/logger.ts` - Main logging utility | 🔴 Disabled |
| **Event Tracking** | User actions and system events | 🔴 Disabled |
| **Performance Monitoring** | API calls and component timing | 🔴 Disabled |
| **Error Capturing** | Comprehensive error tracking | 🟡 Partial (Error Boundaries) |
| **Remote Ingestion** | Dynatrace API integration | 🔴 Disabled |

### **Intended Features**

```typescript
// Comprehensive logging capabilities (when enabled)
interface LoggingCapabilities {
  userActions: 'Authentication, navigation, feature usage';
  systemEvents: 'Component lifecycle, state changes';
  apiCalls: 'Firebase operations, external APIs';
  performance: 'Load times, render performance';
  errors: 'JavaScript errors, boundary catches';
  business: 'Budget analysis, expense tracking';
}
```

## 🔧 Technical Implementation

### **Core Logger Service**

```typescript
// src/lib/logger.ts (currently disabled)
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private buffer: LogEntry[] = [];
  private isEnabled: boolean = false; // Currently disabled
  
  constructor(config: LoggerConfig) {
    this.isEnabled = config.enabled && process.env.NODE_ENV === 'production';
  }
  
  // Methods: debug(), info(), warn(), error()
  // Features: Buffering, remote ingestion, performance tracking
}
```

### **Integration Points**

```typescript
// Example integration patterns (when system is enabled)

// 1. Component Lifecycle Logging
const useComponentLogger = (componentName: string) => {
  useEffect(() => {
    logger.info('Component', `${componentName} mounted`);
    return () => logger.info('Component', `${componentName} unmounted`);
  }, [componentName]);
};

// 2. API Call Logging
const loggedFirebaseOperation = async (operation: string, fn: () => Promise<any>) => {
  const startTime = performance.now();
  logger.debug('API', `Starting ${operation}`);
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.info('API', `${operation} completed`, { duration });
    return result;
  } catch (error) {
    logger.error('API', `${operation} failed`, { error: error.message });
    throw error;
  }
};

// 3. User Action Logging
const trackUserAction = (action: string, metadata?: object) => {
  logger.info('UserAction', action, metadata);
};
```

## 🚫 Performance Issues Identified

### **Root Causes**

1. **Excessive Logging Volume**
   ```typescript
   // Problem: Too frequent logging calls
   useEffect(() => {
     logger.debug('Component', 'State changed', newState); // Called on every state change
   }, [state]);
   ```

2. **Memory Leaks**
   ```typescript
   // Problem: Unbounded buffer growth
   private buffer: LogEntry[] = []; // No size limits or cleanup
   ```

3. **Synchronous Operations**
   ```typescript
   // Problem: Blocking main thread
   const processLogBuffer = () => {
     // Heavy processing on main thread
     buffer.forEach(entry => processEntry(entry));
   };
   ```

4. **Remote API Overhead**
   ```typescript
   // Problem: Too frequent API calls
   setInterval(flushLogs, 1000); // Every second regardless of volume
   ```

### **Impact Analysis**

| Impact Area | Severity | Description |
|-------------|----------|-------------|
| **Application Response** | 🔴 High | UI freezing during log processing |
| **Memory Usage** | 🔴 High | Memory leaks from unbounded buffers |
| **Network Overhead** | 🟡 Medium | Frequent API calls to Dynatrace |
| **User Experience** | 🔴 High | Slow page loads and interactions |

## 🔄 Future Implementation Strategy

### **Performance Optimization Plan**

#### **1. Asynchronous Processing**
```typescript
// Use Web Workers for log processing
const logWorker = new Worker('log-processor-worker.js');

// Non-blocking log processing
const processLogsAsync = (entries: LogEntry[]) => {
  logWorker.postMessage({ type: 'PROCESS_LOGS', entries });
};
```

#### **2. Smart Buffering**
```typescript
// Bounded buffer with intelligent flushing
class SmartLogBuffer {
  private buffer: LogEntry[] = [];
  private maxSize = 100;
  private flushInterval = 30000; // 30 seconds
  
  add(entry: LogEntry) {
    this.buffer.push(entry);
    
    // Flush when buffer is full or on errors
    if (this.buffer.length >= this.maxSize || entry.level === 'ERROR') {
      this.flush();
    }
  }
  
  private async flush() {
    if (this.buffer.length === 0) return;
    
    const toFlush = this.buffer.splice(0);
    await this.sendToRemote(toFlush);
  }
}
```

#### **3. Sampling Strategy**
```typescript
// Implement log sampling to reduce volume
class SamplingLogger {
  private sampleRates = {
    DEBUG: 0.1,   // Sample 10% of debug logs
    INFO: 0.5,    // Sample 50% of info logs
    WARN: 1.0,    // Always log warnings
    ERROR: 1.0    // Always log errors
  };
  
  log(level: LogLevel, message: string, metadata?: object) {
    if (Math.random() < this.sampleRates[level]) {
      this.actuallyLog(level, message, metadata);
    }
  }
}
```

#### **4. Local Storage Fallback**
```typescript
// Use IndexedDB for offline log storage
class OfflineLogStorage {
  private db: IDBDatabase;
  
  async store(entries: LogEntry[]) {
    const transaction = this.db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    
    for (const entry of entries) {
      await store.add(entry);
    }
  }
  
  async retrieveAndClear(): Promise<LogEntry[]> {
    // Retrieve stored logs when connectivity returns
  }
}
```

## 🛠️ Alternative Monitoring Solutions

### **Lightweight Error Tracking**

```typescript
// Minimal error tracking without performance impact
const trackError = (error: Error, context: string) => {
  // Only for critical errors
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      context
    });
  }
  
  console.error(`[${context}]`, error);
};
```

### **Performance Monitoring**

```typescript
// Web Performance API for key metrics
const trackPerformance = () => {
  // Use built-in performance APIs
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('Page load time:', entry.duration);
      }
    });
  });
  
  observer.observe({ entryTypes: ['navigation', 'measure'] });
};
```

### **User Analytics**

```typescript
// Firebase Analytics for user behavior
import { logEvent } from 'firebase/analytics';

const trackUserAction = (action: string, parameters?: object) => {
  // Use Firebase Analytics instead of custom logging
  logEvent(analytics, action, {
    timestamp: Date.now(),
    version: process.env.VITE_APP_VERSION,
    ...parameters
  });
};
```

## 🔍 Debugging Without Full Logging

### **Development Debugging**

```typescript
// Enhanced console logging for development
const devLog = (category: string, message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const style = 'color: #10b981; font-weight: bold;';
    
    console.group(`%c[${timestamp}] ${category}`, style);
    console.log(message);
    if (data) console.log(data);
    console.groupEnd();
  }
};
```

### **Production Error Monitoring**

```typescript
// Error boundary with remote reporting
class ProductionErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send only critical errors to monitoring
    if (window.gtag) {
      window.gtag('event', 'react_error', {
        error_message: error.message,
        component_stack: errorInfo.componentStack,
        error_boundary: this.constructor.name
      });
    }
    
    // Always log to console for debugging
    console.error('React Error Boundary:', error, errorInfo);
  }
}
```

## 📊 Monitoring Strategy

### **Current Monitoring Approach**

| Method | Purpose | Performance Impact | Status |
|--------|---------|-------------------|--------|
| **Console Logs** | Development debugging | None | ✅ Active |
| **Error Boundaries** | React error catching | Minimal | ✅ Active |
| **Firebase Analytics** | User behavior | Low | ✅ Active |
| **Dynatrace (Optional)** | Full monitoring | Low | 🟡 Configurable |
| **Custom Logging** | Detailed application logs | High | 🔴 Disabled |

### **Recommended Monitoring Stack**

```typescript
// Lightweight monitoring configuration
const monitoringConfig = {
  development: {
    console: true,
    errorBoundaries: true,
    analytics: false,
    dynatrace: false
  },
  production: {
    console: false,
    errorBoundaries: true,
    analytics: true,
    dynatrace: true, // Optional
    customLogging: false // Until performance issues resolved
  }
};
```

## 🔄 Re-enabling Process

### **Prerequisites for Re-enabling**

1. **Performance Testing**
   ```bash
   # Load testing with logging enabled
   npm run test:performance
   
   # Memory profiling
   npm run profile:memory
   
   # Bundle size analysis
   npm run analyze:bundle
   ```

2. **Optimization Implementation**
   - [ ] Web Worker implementation
   - [ ] Smart buffering system
   - [ ] Sampling configuration
   - [ ] Offline storage solution
   - [ ] Performance monitoring

3. **Gradual Rollout**
   ```typescript
   // Feature flag for logging system
   const loggingConfig = {
     enabled: process.env.VITE_LOGGING_ENABLED === 'true',
     sampleRate: parseFloat(process.env.VITE_LOG_SAMPLE_RATE || '0.1'),
     bufferSize: parseInt(process.env.VITE_LOG_BUFFER_SIZE || '50')
   };
   ```

### **Testing Protocol**

```bash
# 1. Enable in development
VITE_LOGGING_ENABLED=true npm run dev

# 2. Performance benchmark
npm run benchmark:logging

# 3. Staging deployment
npm run deploy:staging

# 4. Production canary (10% traffic)
VITE_LOG_SAMPLE_RATE=0.1 npm run deploy:canary

# 5. Full production rollout
VITE_LOG_SAMPLE_RATE=1.0 npm run deploy:production
```

## 🚨 Emergency Procedures

### **Quick Disable Process**

```bash
# Environment variable method
VITE_LOGGING_ENABLED=false

# Or via Firebase Remote Config
firebase remoteconfig:set logging_enabled false
```

### **Performance Recovery**

```typescript
// Emergency performance mode
if (performance.now() - pageLoadTime > 5000) {
  // Disable all non-critical logging
  logger.disable();
  
  // Clear log buffers
  logger.clearBuffers();
  
  // Notify monitoring
  trackError(new Error('Performance degradation detected'), 'emergency');
}
```

## 📚 Documentation & Resources

### **Code References**

- **Logger Implementation**: `src/lib/logger.ts` (disabled)
- **Error Boundaries**: `src/ErrorFallback.tsx`
- **Analytics**: `src/lib/analytics.ts`
- **Performance**: `src/lib/performance.ts`

### **Related Documentation**

- [Performance Monitoring](./OBSERVABILITY_GUIDE.md)
- [Error Handling](./SECURITY.md#error-handling)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

### **External Resources**

- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Dynatrace Documentation](https://www.dynatrace.com/support/help/)

---

## 📞 Support & Next Steps

### **Current Recommendations**

1. **Continue with Current Monitoring**: Use error boundaries and Firebase Analytics
2. **Optional Dynatrace**: Configure if detailed monitoring is required
3. **Development Debugging**: Use enhanced console logging for development
4. **Performance Focus**: Monitor application performance without heavy logging

### **Future Implementation**

1. **Research Phase**: Investigate lightweight logging solutions
2. **Performance Testing**: Benchmark potential solutions
3. **Gradual Rollout**: Implement with feature flags and sampling
4. **Continuous Monitoring**: Monitor impact on application performance

**Logging System Documentation**: v2.2.1  
**Status**: Disabled due to performance issues  
**Last Updated**: August 2025  
**Next Review**: November 2025
VITE_LOG_LEVEL=INFO

# Enable console logging (default: true in development)
VITE_LOG_ENABLE_CONSOLE=true

# Dynatrace Logging Configuration (optional)
VITE_DYNATRACE_URL=https://your-environment.live.dynatrace.com
VITE_DYNATRACE_LOG_TOKEN=dt0c01.your-log-ingest-token

# Log buffer settings
VITE_LOG_BUFFER_SIZE=100
VITE_LOG_FLUSH_INTERVAL=5000
```

### Azure App Service Setup

1. **Environment Variables**: Configure logging variables in Azure App Service > Configuration > Application settings

2. **Dynatrace Token**: Create a log ingest token in Dynatrace:
   - Go to Settings > Integration > Dynatrace API
   - Create token with `logs.ingest` scope
   - Add token to `VITE_DYNATRACE_LOG_TOKEN`

3. **Monitoring**: Logs will appear in Dynatrace under Logs section

## Usage Examples

### Basic Logging

```typescript
import { log } from '@/lib/logger';

// Information logging
log.info('ComponentName', 'Action completed', { details: 'additional data' });

// Error logging with stack trace
log.error('ComponentName', 'Operation failed', { error: errorDetails }, error);

// Performance tracking
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;
log.performance('OperationName', duration, { additionalData });
```

### User Action Tracking

```typescript
// Track user interactions
log.userAction('Button Click', { button: 'analyze-budget', page: 'dashboard' });

// Track navigation
log.userAction('Page Navigation', { from: '/login', to: '/dashboard' });
```

### API Call Logging

```typescript
// Automatic API call logging
log.apiCall('POST', '/api/budget/analyze', 200, 1500);

// API error logging
log.apiCall('POST', '/api/budget/analyze', 500, 3000, { error: 'Server Error' });
```

## Log Categories

### Authentication (`Auth`)
- Sign-in attempts and results
- User context changes
- Authentication errors
- Session management

### Budget Analysis (`BudgetAnalyzer`)
- Analysis initiation and completion
- AI service selection
- Performance metrics
- Analysis mode selection (demo/statistical/AI)

### Firebase Operations (`Firebase`)
- Database operations
- Authentication flows
- Storage operations
- Network requests

### User Actions (`UserAction`)
- Button clicks
- Navigation events
- Form submissions
- Feature usage

### Performance (`Performance`)
- Operation durations
- API response times
- Component render times
- Resource loading

### API Calls (`APICall`)
- External API requests
- Response status codes
- Request/response times
- Error details

## Log Structure

Each log entry contains:

```json
{
  "timestamp": "2025-01-28T10:30:00.000Z",
  "level": "INFO",
  "category": "BudgetAnalyzer",
  "message": "Budget analysis completed",
  "details": {
    "duration": 1500,
    "mode": "statistical",
    "expensesCount": 25
  },
  "userId": "user-123",
  "sessionId": "session_1706435400000_abc123",
  "userAgent": "Mozilla/5.0...",
  "url": "https://budget-buddy.azurewebsites.net/dashboard",
  "stackTrace": "..."
}
```

## Dynatrace Integration

### Log Ingestion

Logs are sent to Dynatrace via the Logs API v2:

- **Endpoint**: `{DYNATRACE_URL}/api/v2/logs/ingest`
- **Authentication**: API Token with `logs.ingest` scope
- **Batching**: Logs are buffered and sent in batches every 5 seconds or when buffer reaches 100 entries

### Custom Attributes

Logs include custom attributes for filtering and analysis:

- `service.name`: "budget-buddy-frontend"
- `service.version`: "1.0.0"
- `user.session`: Session identifier
- `user.id`: User identifier (when authenticated)
- `log.source`: "budget-buddy"
- `log.level`: Log level (DEBUG, INFO, WARN, ERROR)

### Querying Logs

Use Dynatrace Query Language (DQL) to analyze logs:

```dql
fetch logs
| filter service.name == "budget-buddy-frontend"
| filter log.level == "ERROR"
| sort timestamp desc
| limit 100
```

## Production Deployment

### Azure App Service Configuration

1. **Application Settings**:
   ```
   VITE_LOG_LEVEL = INFO
   VITE_LOG_ENABLE_CONSOLE = false
   VITE_DYNATRACE_URL = https://your-environment.live.dynatrace.com
   VITE_DYNATRACE_LOG_TOKEN = dt0c01.your-token
   ```

2. **Build Settings**: Ensure environment variables are available during build

3. **Monitoring**: Set up Dynatrace dashboards for log analysis

### Performance Considerations

- **Buffer Size**: Adjust `VITE_LOG_BUFFER_SIZE` based on traffic volume
- **Flush Interval**: Lower `VITE_LOG_FLUSH_INTERVAL` for real-time monitoring
- **Log Level**: Use `WARN` or `ERROR` in production to reduce volume

## Troubleshooting

### Common Issues

1. **Logs not appearing in Dynatrace**:
   - Check API token permissions
   - Verify Dynatrace URL format
   - Check browser network tab for API calls

2. **High log volume**:
   - Increase log level to `WARN` or `ERROR`
   - Reduce buffer size to flush more frequently
   - Filter unnecessary log categories

3. **Performance impact**:
   - Disable console logging in production
   - Increase flush interval
   - Use async logging where possible

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
VITE_LOG_LEVEL=DEBUG
VITE_LOG_ENABLE_CONSOLE=true
```

## Security Considerations

- **API Tokens**: Store Dynatrace tokens securely in Azure Key Vault
- **Data Privacy**: Avoid logging sensitive user data
- **Log Retention**: Configure appropriate retention policies in Dynatrace
- **Access Control**: Restrict log access to authorized personnel

## Future Enhancements

Potential improvements for the logging system:

1. **Structured Error Reporting**: Enhanced error categorization
2. **User Journey Tracking**: Complete user flow analysis
3. **Performance Budgets**: Automated performance monitoring
4. **Log Analytics**: Built-in dashboard for key metrics
5. **Real-time Alerts**: Immediate notification for critical errors

## Support

For logging system issues or questions:

1. Check Azure App Service logs
2. Verify Dynatrace connectivity
3. Review browser console for client-side errors
4. Contact development team for assistance
