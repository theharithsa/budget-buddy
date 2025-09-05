import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  useComponentTracking, 
  useMonitoredFirebase, 
  useMonitoredBusiness,
  useMonitoredClick,
  usePageTracking
} from '@/hooks/useDynatraceMonitoring';

// Demo component showcasing enhanced Dynatrace monitoring
export function DynatraceMonitoringDemo() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced monitoring hooks
  const { trackComponentEvent, trackComponentError } = useComponentTracking('MonitoringDemo');
  const { trackXhrOperation, trackExpense } = useMonitoredFirebase();
  const { trackFinancialEvent, trackUserJourney } = useMonitoredBusiness();
  
  // Track page visit
  usePageTracking('Monitoring Demo', 'Development Tools');

  // Monitored click handler
  const handleAddExpenseClick = useMonitoredClick('Demo Add Expense', {
    amount: parseFloat(amount) || 0,
    category
  });

  // Demo XHR operation with comprehensive tracking
  const simulateExpenseCreation = async () => {
    if (!amount || !category) {
      trackComponentError('Validation Error: Missing required fields', {
        missingFields: {
          amount: !amount,
          category: !category
        }
      });
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Track the XHR operation with proper error handling and BizEvents
      const result = await trackXhrOperation(
        'Demo Expense Creation',
        'https://firestore.googleapis.com/v1/projects/finbuddy/databases/(default)/documents/expenses',
        async () => {
          // Simulate Firebase operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
          
          // Simulate occasional failures for demo
          if (Math.random() < 0.2) {
            throw new Error('Simulated Firebase timeout');
          }

          return {
            id: `demo_${Date.now()}`,
            amount: parseFloat(amount),
            category,
            date: new Date().toISOString(),
            success: true
          };
        }
      );

      // Track successful expense operation (generates BizEvent)
      trackExpense('create', {
        amount: parseFloat(amount),
        category,
        demoMode: true
      });

      // Track financial event (generates BizEvent)
      trackFinancialEvent('Demo Expense Added', parseFloat(amount), category);

      // Track user journey milestone
      trackUserJourney('Demo Expense Creation Success', {
        amount: parseFloat(amount),
        category,
        timestamp: new Date().toISOString()
      });

      // Component-specific event tracking
      trackComponentEvent('Demo Form Submission Success', {
        amount: parseFloat(amount),
        category,
        responseTime: result ? 'normal' : 'slow'
      });

      toast.success(`Demo expense of $${amount} added successfully!`);
      setAmount('');
      setCategory('');

    } catch (error) {
      // Enhanced error tracking with context
      trackComponentError(error as Error, {
        operation: 'simulateExpenseCreation',
        formData: { amount, category },
        timestamp: new Date().toISOString()
      });

      // Track failed financial event
      trackFinancialEvent('Demo Expense Creation Failed', parseFloat(amount), category);

      // Track user journey for failed attempt
      trackUserJourney('Demo Expense Creation Failed', {
        error: (error as Error).message,
        amount: parseFloat(amount),
        category
      });

      toast.error(`Failed to create demo expense: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Dynatrace Monitoring Demo
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Enhanced Tracking
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Demonstrates XHR vs Load action differentiation, error handling, and BizEvent integration
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Demo Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input
              placeholder="e.g., Food, Transport"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              handleAddExpenseClick(e);
              simulateExpenseCreation();
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Creating Demo Expense...' : 'Create Demo Expense (XHR Action)'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              trackUserJourney('Demo Reset', { timestamp: new Date().toISOString() });
              setAmount('');
              setCategory('');
              toast.info('Demo form reset');
            }}
            disabled={isLoading}
          >
            Reset (Load Action)
          </Button>
        </div>

        {/* Monitoring Information */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">📊 What's Being Tracked:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>XHR Actions:</strong> Firebase operations, API calls with proper error handling</li>
            <li>• <strong>Load Actions:</strong> UI interactions, form resets, button clicks</li>
            <li>• <strong>BizEvents:</strong> Business operations like expense creation, financial events</li>
            <li>• <strong>Error Tracking:</strong> Comprehensive error capture with context</li>
            <li>• <strong>User Journey:</strong> Page visits, component lifecycle, milestones</li>
            <li>• <strong>Performance:</strong> Operation timing, response times, component metrics</li>
          </ul>
        </div>

        {/* Technical Details */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">🔧 Technical Implementation:</h4>
          <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
            <p><strong>XHR Actions:</strong> <code>dtrum.enterXhrAction()</code> for network operations</p>
            <p><strong>Load Actions:</strong> <code>dtrum.enterAction()</code> for UI interactions</p>
            <p><strong>BizEvents:</strong> <code>dynatrace.sendBizEvent()</code> for business metrics</p>
            <p><strong>Error Tracking:</strong> <code>dtrum.reportError()</code> + <code>dtrum.markXHRFailed()</code></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
