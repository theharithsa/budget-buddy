# Comprehensive Logging System for Budget Buddy

This document describes the logging implementation that captures all application events, user actions, API calls, errors, and performance metrics for the Budget Buddy application.

## Overview

The logging system is designed for deployment to Azure App Service with optional Dynatrace integration. Since Azure App Service sandboxes restrict file system write access, the system uses:

1. **Console logging** for development environments
2. **Dynatrace API ingestion** for production monitoring
3. **Local browser storage** as a fallback buffer

## Architecture

### Logger Components

- **`src/lib/logger.ts`** - Main logging utility with buffering and Dynatrace integration
- **Application-wide logging** - Integrated into components for comprehensive coverage
- **Performance tracking** - Monitors execution times and performance metrics
- **Error capturing** - Global error handlers and component-specific error logging

### Features

✅ **Comprehensive Coverage**
- User authentication events
- Budget analysis operations
- API calls and responses
- Component lifecycle events
- Performance metrics
- Error tracking and stack traces

✅ **Production Ready**
- Environment-based configuration
- Dynatrace log ingestion via API
- Automatic error reporting
- Performance monitoring

✅ **Azure App Service Compatible**
- No file system dependencies
- Works within sandbox restrictions
- Configurable via environment variables

## Configuration

### Environment Variables

Add these to your Azure App Service configuration or `.env` file:

```bash
# Log level: DEBUG, INFO, WARN, ERROR (default: INFO)
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
