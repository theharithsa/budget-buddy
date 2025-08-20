import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
// import { initializeLogger, log } from './lib/logger.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// TEMPORARILY DISABLED LOGGING TO FIX HANG ISSUE
// Initialize logger with environment configuration
const loggerConfig = {
  logLevel: (import.meta.env.VITE_LOG_LEVEL as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR') || 'ERROR',
  enableConsole: false, // Disabled
  dynatraceUrl: undefined, // Disabled
  dynatraceToken: undefined, // Disabled
  bufferSize: parseInt(import.meta.env.VITE_LOG_BUFFER_SIZE) || 1000,
  flushInterval: parseInt(import.meta.env.VITE_LOG_FLUSH_INTERVAL) || 60000
};

// initializeLogger(loggerConfig);

// Log application startup
// log.info('Application', 'Budget Buddy application starting', {
//   environment: import.meta.env.MODE,
//   userAgent: navigator.userAgent,
//   url: window.location.href,
//   timestamp: new Date().toISOString()
// });

// Global error handler to suppress known harmless errors
window.addEventListener('error', (event) => {
  // Suppress message channel errors (often caused by browser extensions)
  if (event.message && 
      (event.message.includes('message channel closed before a response was received') ||
       event.message.includes('listener indicated an asynchronous response'))) {
    // log.debug('ErrorHandler', 'Suppressed harmless error', { message: event.message });
    console.debug('Suppressed harmless error:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress Firebase permission errors that don't affect functionality
  if (event.reason && event.reason.message) {
    const message = event.reason.message.toLowerCase();
    if (message.includes('message channel closed') || 
        message.includes('listener indicated an asynchronous response') ||
        message.includes('permission-denied')) {
      // log.debug('ErrorHandler', 'Suppressed harmless promise rejection', { reason: event.reason.message });
      console.debug('Suppressed harmless promise rejection:', event.reason.message);
      event.preventDefault();
      return false;
    }
  }
});

// Log before creating React app
// log.info('Application', 'Creating React root and rendering application');
console.log('Creating React root and rendering application');

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
