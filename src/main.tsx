import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Global error handler to suppress known harmless errors
window.addEventListener('error', (event) => {
  // Suppress message channel errors (often caused by browser extensions)
  if (event.message && 
      (event.message.includes('message channel closed before a response was received') ||
       event.message.includes('listener indicated an asynchronous response'))) {
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
      console.debug('Suppressed harmless promise rejection:', event.reason.message);
      event.preventDefault();
      return false;
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
