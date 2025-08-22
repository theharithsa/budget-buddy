# 📊 Observability Guide - Budget Buddy

**Application**: Budget Buddy v2.2.1  
**Last Updated**: August 2025  
**Monitoring Stack**: Dynatrace + Firebase Analytics + Custom Logging

## 📋 Overview

This comprehensive observability guide covers monitoring, logging, performance tracking, and debugging strategies for Budget Buddy. The system implements a multi-tier observability approach with optional Dynatrace integration, Firebase analytics, and custom logging solutions.

## 🎯 Observability Strategy

### **Multi-Tier Monitoring Approach**

| Layer | Technology | Purpose | Status |
|-------|------------|---------|--------|
| **Application Performance** | Dynatrace (Optional) | Full-stack monitoring | 🟡 Configurable |
| **User Analytics** | Firebase Analytics | User behavior tracking | ✅ Active |
| **Error Tracking** | Custom Error Boundaries | React error handling | ✅ Active |
| **Performance Metrics** | Web Vitals API | Core web vitals monitoring | ✅ Active |
| **Custom Logging** | Logger Service | Application-specific logs | 🔴 Disabled |

### **Key Observability Principles**

1. **Performance First**: Monitor Core Web Vitals and user experience metrics
2. **Error Visibility**: Comprehensive error tracking with context
3. **User Journey**: Track user interactions and feature adoption
4. **Resource Monitoring**: Firebase usage, API calls, and quota management
5. **Security Monitoring**: Authentication events and access patterns

## 🔧 Configuration & Setup

### **Environment Variables**

```bash
# Dynatrace Configuration (Optional)
VITE_DYNATRACE_URL=https://your-tenant.live.dynatrace.com
VITE_DYNATRACE_TOKEN=your-dynatrace-token
VITE_ENVIRONMENT=production

# Analytics Configuration
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ANALYTICS_ENABLED=true

# Logging Configuration
VITE_LOG_LEVEL=error
VITE_LOG_CONSOLE=false
VITE_LOG_REMOTE=true
```

### **Dynatrace Integration**

#### **Setup Process**

```typescript
// src/lib/dynatrace.ts
interface DynatraceConfig {
  url: string;
  token: string;
  environment: string;
  applicationId?: string;
  serviceName?: string;
}

export const initDynatrace = async (config: DynatraceConfig) => {
  if (!config.url || !config.token) {
    console.warn('Dynatrace configuration incomplete');
    return;
  }

  try {
    // Initialize Dynatrace RUM
    const { dtrum } = await import('@dynatrace/dynatrace-api');
    
    dtrum.enable();
    dtrum.setApplicationId(config.applicationId || 'budget-buddy');
    dtrum.setServiceName(config.serviceName || 'budget-buddy-frontend');
    
    // Track deployment
    dtrum.sendEvent('Deployment', {
      version: process.env.VITE_APP_VERSION,
      environment: config.environment,
      timestamp: new Date().toISOString()
    });
    
    console.log('Dynatrace monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize Dynatrace:', error);
  }
};
```

#### **Component Integration**

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send to Dynatrace
    if (window.dtrum) {
      window.dtrum.sendError(error, {
        component: this.constructor.name,
        errorInfo: JSON.stringify(errorInfo),
        userId: this.props.userId,
        sessionId: this.props.sessionId
      });
    }
    
    // Log locally
    console.error('Component error:', error, errorInfo);
  }
}
```

### **Firebase Analytics Integration**

```typescript
// src/lib/analytics.ts
import { analytics, logEvent } from './firebase';

export const trackUserAction = (action: string, parameters?: object) => {
  if (!analytics) return;
  
  logEvent(analytics, action, {
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION,
    ...parameters
  });
};

// Track expense operations
export const trackExpenseEvent = (action: 'create' | 'edit' | 'delete', expense: Expense) => {
  trackUserAction('expense_action', {
    action,
    category: expense.category,
    amount: expense.amount,
    has_receipt: !!expense.receiptUrl
  });
};

// Track budget operations
export const trackBudgetEvent = (action: 'create' | 'edit' | 'delete', budget: Budget) => {
  trackUserAction('budget_action', {
    action,
    category: budget.category,
    limit: budget.limit,
    period: budget.period
  });
};
```

## 📈 Performance Monitoring

### **Core Web Vitals Tracking**

```typescript
// src/lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export const initPerformanceMonitoring = () => {
  const sendMetric = (metric: PerformanceMetric) => {
    // Send to analytics
    trackUserAction('performance_metric', metric);
    
    // Send to Dynatrace if available
    if (window.dtrum) {
      window.dtrum.sendMetric(metric.name, metric.value, {
        rating: metric.rating,
        timestamp: metric.timestamp
      });
    }
    
    // Console warning for poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name}: ${metric.value}ms`);
    }
  };

  // Track Core Web Vitals
  getCLS(sendMetric);
  getFID(sendMetric);
  getFCP(sendMetric);
  getLCP(sendMetric);
  getTTFB(sendMetric);
};
```

### **Custom Performance Metrics**

```typescript
// Track component render times
export const usePerformanceTimer = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      trackUserAction('component_render_time', {
        component: componentName,
        duration: renderTime,
        rating: renderTime < 100 ? 'good' : renderTime < 300 ? 'needs-improvement' : 'poor'
      });
    };
  }, [componentName]);
};

// Track API response times
export const trackApiCall = async (endpoint: string, operation: () => Promise<any>) => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    trackUserAction('api_call_success', {
      endpoint,
      duration,
      rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor'
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    trackUserAction('api_call_error', {
      endpoint,
      duration,
      error: error.message
    });
    
    throw error;
  }
};
```

## 🚨 Error Tracking & Monitoring

### **Error Boundary Implementation**

```typescript
// src/components/ErrorFallback.tsx
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  userId?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError, userId }) => {
  useEffect(() => {
    // Track error in analytics
    trackUserAction('error_boundary_triggered', {
      error_message: error.message,
      error_stack: error.stack,
      user_id: userId,
      url: window.location.href,
      user_agent: navigator.userAgent
    });
    
    // Send to Dynatrace
    if (window.dtrum) {
      window.dtrum.sendError(error, {
        source: 'error_boundary',
        userId,
        url: window.location.href
      });
    }
    
    console.error('Error boundary triggered:', error);
  }, [error, userId]);

  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetError}>Try Again</button>
    </div>
  );
};
```

### **Global Error Handling**

```typescript
// src/lib/errorTracking.ts
export const initGlobalErrorHandling = () => {
  // Catch unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    trackUserAction('javascript_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackUserAction('unhandled_promise_rejection', {
      reason: event.reason?.toString(),
      stack: event.reason?.stack
    });
  });

  // Catch resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      trackUserAction('resource_error', {
        element: event.target?.tagName,
        source: event.target?.src || event.target?.href,
        type: 'resource_load_error'
      });
    }
  }, true);
};
```

## 📊 User Analytics & Behavior

### **User Journey Tracking**

```typescript
// src/lib/userTracking.ts
export const trackUserJourney = {
  // Authentication events
  login: (method: string) => trackUserAction('login', { method }),
  logout: () => trackUserAction('logout'),
  
  // Feature usage
  featureUsed: (feature: string, context?: object) => 
    trackUserAction('feature_used', { feature, ...context }),
  
  // Page views
  pageView: (page: string) => trackUserAction('page_view', { page }),
  
  // Business metrics
  expenseCreated: (category: string, amount: number) => 
    trackUserAction('expense_created', { category, amount }),
  
  budgetCreated: (category: string, limit: number) => 
    trackUserAction('budget_created', { category, limit }),
  
  // AI interactions
  aiAnalysisRequested: (type: string) => 
    trackUserAction('ai_analysis_requested', { type }),
  
  aiAnalysisCompleted: (type: string, duration: number) => 
    trackUserAction('ai_analysis_completed', { type, duration })
};
```

### **Feature Adoption Tracking**

```typescript
// Track feature adoption across user sessions
export const trackFeatureAdoption = () => {
  const features = {
    budget_analyzer: 'AI Budget Analyzer usage',
    people_management: 'People Management feature',
    receipt_upload: 'Receipt Upload feature',
    chart_interaction: 'Chart Interaction',
    pwa_install: 'PWA Installation',
    dark_mode: 'Dark Mode usage'
  };

  Object.entries(features).forEach(([feature, description]) => {
    const lastUsed = localStorage.getItem(`feature_${feature}_last_used`);
    const usageCount = parseInt(localStorage.getItem(`feature_${feature}_count`) || '0');
    
    if (lastUsed) {
      trackUserAction('feature_adoption', {
        feature,
        description,
        last_used: lastUsed,
        usage_count: usageCount,
        days_since_last_use: Math.floor((Date.now() - parseInt(lastUsed)) / (1000 * 60 * 60 * 24))
      });
    }
  });
};
```

## 🔒 Security Monitoring

### **Authentication Event Tracking**

```typescript
// src/contexts/AuthContext.tsx - Enhanced with monitoring
export const AuthContextProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Track successful authentication
        trackUserAction('authentication_success', {
          uid: user.uid,
          provider: user.providerData[0]?.providerId,
          is_new_user: user.metadata.creationTime === user.metadata.lastSignInTime
        });
        
        // Send to Dynatrace
        if (window.dtrum) {
          window.dtrum.setUser(user.uid);
          window.dtrum.setUserProperty('provider', user.providerData[0]?.providerId);
        }
      } else {
        // Track authentication loss
        trackUserAction('authentication_lost');
      }
      
      setUser(user);
    });

    return unsubscribe;
  }, []);
};
```

### **Access Pattern Monitoring**

```typescript
// Track suspicious access patterns
export const trackSecurityEvent = (event: string, details: object) => {
  trackUserAction('security_event', {
    event,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    ip_address: 'client-side', // Would need server-side for real IP
    ...details
  });
};

// Example usage in Firebase operations
const monitoredFirebaseOperation = async (operation: string, fn: () => Promise<any>) => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    trackSecurityEvent('firebase_operation_success', {
      operation,
      duration: Date.now() - startTime
    });
    
    return result;
  } catch (error) {
    trackSecurityEvent('firebase_operation_failed', {
      operation,
      error: error.code,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
};
```

## 📱 Real-Time Monitoring Dashboard

### **Performance Dashboard Component**

```typescript
// src/components/PerformanceDashboard.tsx (Admin only)
export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  
  useEffect(() => {
    // Fetch real-time metrics from Firebase Analytics
    const fetchMetrics = async () => {
      try {
        // This would require a backend service to aggregate analytics data
        const response = await fetch('/api/analytics/metrics');
        const data = await response.json();
        setMetrics(data.metrics);
        setErrors(data.errors);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="performance-dashboard">
      <div className="metrics-grid">
        <MetricCard title="Performance Score" value={metrics.averageScore} />
        <MetricCard title="Error Rate" value={`${metrics.errorRate}%`} />
        <MetricCard title="Active Users" value={metrics.activeUsers} />
        <MetricCard title="API Response Time" value={`${metrics.apiResponseTime}ms`} />
      </div>
      
      <div className="charts-section">
        <PerformanceChart data={metrics.timeSeries} />
        <ErrorChart data={errors.timeSeries} />
      </div>
    </div>
  );
};
```

## 🔧 Debugging & Troubleshooting

### **Debug Mode Configuration**

```typescript
// src/lib/debug.ts
interface DebugConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  components: string[];
  performance: boolean;
  analytics: boolean;
}

export const debugConfig: DebugConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: (process.env.VITE_LOG_LEVEL as any) || 'error',
  components: process.env.VITE_DEBUG_COMPONENTS?.split(',') || [],
  performance: process.env.VITE_DEBUG_PERFORMANCE === 'true',
  analytics: process.env.VITE_DEBUG_ANALYTICS === 'true'
};

export const debugLog = (component: string, level: string, message: string, data?: any) => {
  if (!debugConfig.enabled) return;
  
  const shouldLog = debugConfig.components.length === 0 || 
                   debugConfig.components.includes(component);
  
  if (shouldLog) {
    console[level](`[${component}] ${message}`, data);
    
    // Send debug info to monitoring if enabled
    if (debugConfig.analytics) {
      trackUserAction('debug_log', {
        component,
        level,
        message,
        data: JSON.stringify(data)
      });
    }
  }
};
```

### **Component Debug Wrapper**

```typescript
// src/hooks/useDebug.ts
export const useDebug = (componentName: string) => {
  const log = useCallback((level: string, message: string, data?: any) => {
    debugLog(componentName, level, message, data);
  }, [componentName]);

  const trackRender = useCallback(() => {
    if (debugConfig.performance) {
      log('info', 'Component rendered');
    }
  }, [log]);

  const trackProps = useCallback((props: any) => {
    if (debugConfig.enabled) {
      log('debug', 'Props received', props);
    }
  }, [log]);

  return { log, trackRender, trackProps };
};
```

## 📊 Monitoring Dashboards & Alerts

### **Dynatrace Dashboard Configuration**

```json
{
  "dashboard": {
    "name": "Budget Buddy - Frontend Performance",
    "tiles": [
      {
        "title": "Application Performance",
        "type": "application_performance",
        "metrics": ["response_time", "error_rate", "throughput"]
      },
      {
        "title": "User Experience",
        "type": "user_experience",
        "metrics": ["core_web_vitals", "user_actions"]
      },
      {
        "title": "Error Analysis",
        "type": "error_analysis",
        "filters": ["application:budget-buddy"]
      }
    ]
  }
}
```

### **Alert Configuration**

```typescript
// Dynatrace alerting rules
const alertingRules = {
  performance: {
    metric: 'response_time',
    threshold: 3000, // 3 seconds
    condition: 'above',
    notification: 'slack_channel'
  },
  errorRate: {
    metric: 'error_rate',
    threshold: 5, // 5%
    condition: 'above',
    notification: 'email'
  },
  userExperience: {
    metric: 'core_web_vitals_lcp',
    threshold: 2500, // 2.5 seconds
    condition: 'above',
    notification: 'pagerduty'
  }
};
```

## 📈 Reporting & Analytics

### **Weekly Performance Report**

```typescript
// Generate automated performance reports
export const generateWeeklyReport = async () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const metrics = await aggregateMetrics(startDate, endDate);
  
  const report = {
    period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
    performance: {
      averageLoadTime: metrics.loadTime.average,
      errorRate: metrics.errors.rate,
      userSatisfaction: metrics.userSatisfaction
    },
    features: {
      mostUsed: metrics.features.mostUsed,
      adoptionRate: metrics.features.adoptionRate,
      newFeatures: metrics.features.newFeatures
    },
    technical: {
      deployments: metrics.deployments.count,
      incidents: metrics.incidents.count,
      uptime: metrics.uptime.percentage
    }
  };
  
  // Send report via email or Slack
  await sendReport(report);
};
```

## 🎯 Best Practices & Guidelines

### **Monitoring Implementation Guidelines**

1. **Start Small**: Begin with error tracking and basic performance metrics
2. **User-Centric**: Focus on metrics that impact user experience
3. **Actionable Alerts**: Set up alerts for metrics you can actually act upon
4. **Context Rich**: Include relevant context with all events and metrics
5. **Privacy Conscious**: Ensure no sensitive user data in logs

### **Performance Monitoring Best Practices**

```typescript
// Good: Specific, actionable metrics
trackUserAction('checkout_conversion', {
  step: 'payment_processing',
  duration: processingTime,
  payment_method: 'credit_card'
});

// Bad: Generic, non-actionable metrics
trackUserAction('user_click', { element: 'button' });
```

### **Error Handling Best Practices**

```typescript
// Good: Contextual error tracking
try {
  await saveExpense(expense);
} catch (error) {
  trackUserAction('save_expense_failed', {
    error_type: error.constructor.name,
    error_message: error.message,
    expense_category: expense.category,
    user_id: user.uid,
    retry_count: retryCount
  });
  throw error;
}
```

## 🚨 Troubleshooting Common Issues

### **Dynatrace Integration Issues**

```bash
# Problem: Dynatrace not loading
# Check: Environment variables set correctly
echo $VITE_DYNATRACE_URL
echo $VITE_DYNATRACE_TOKEN

# Problem: Missing user context
# Solution: Ensure user ID is set after authentication
dtrum.setUser(user.uid);

# Problem: Performance overhead
# Solution: Enable only in production, use sampling
```

### **Analytics Tracking Issues**

```bash
# Problem: Events not appearing in Firebase
# Check: Analytics enabled and configured
# Verify: Environment variables set
# Test: Use debug mode in development
```

### **Performance Monitoring Issues**

```bash
# Problem: High monitoring overhead
# Solution: Implement sampling and throttling
# Use: Web Vitals library for standard metrics
# Avoid: Excessive custom metric tracking
```

---

## 📞 Support & Resources

### **Documentation Links**
- [Dynatrace Documentation](https://www.dynatrace.com/support/help/)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Web Vitals](https://web.dev/vitals/)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)

### **Monitoring Checklist**

#### **Implementation Checklist**
- [ ] Dynatrace configuration (optional)
- [ ] Firebase Analytics setup
- [ ] Error boundaries implemented
- [ ] Performance monitoring active
- [ ] Security event tracking
- [ ] User journey analytics

#### **Production Readiness**
- [ ] All monitoring services tested
- [ ] Alert thresholds configured
- [ ] Dashboard access configured
- [ ] Incident response procedures
- [ ] Performance baselines established
- [ ] Privacy compliance verified

**Observability Guide**: v2.2.1  
**Last Updated**: August 2025  
**Next Review**: November 2025