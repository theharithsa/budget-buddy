import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ErrorLogger() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    // Override console.error to capture errors
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Firebase') || errorMessage.includes('permission-denied')) {
        setErrors(prev => [...prev.slice(-4), errorMessage]); // Keep last 5 errors
      }
      originalConsoleError(...args);
    };

    // Override console.warn to capture warnings
    console.warn = (...args) => {
      const warnMessage = args.join(' ');
      if (warnMessage.includes('Firebase') || warnMessage.includes('permission-denied')) {
        setErrors(prev => [...prev.slice(-4), `WARN: ${warnMessage}`]); // Keep last 5 errors
      }
      originalConsoleWarn(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  if (errors.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 max-w-md bg-red-50 border-red-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-red-800">Debug: Recent Errors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-xs text-red-700 p-2 bg-red-100 rounded">
              {error.substring(0, 100)}...
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}