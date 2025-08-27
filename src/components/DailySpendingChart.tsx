import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import ApexCharts from 'apexcharts';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { type Expense, formatCurrency } from '../lib/types';

interface DailySpendingChartProps {
  expenses: Expense[];
  dateRange: { from: string; to: string };
  className?: string;
}

export function DailySpendingChart({ expenses, dateRange, className = '' }: DailySpendingChartProps) {
  const { theme } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ApexCharts | null>(null);

  // Calculate daily spending data
  const calculateDailySpending = () => {
    const startDate = parseISO(dateRange.from);
    const endDate = parseISO(dateRange.to);
    const today = startOfDay(new Date());
    
    // Use the earlier of endDate or today to avoid showing future dates
    const actualEndDate = endDate > today ? today : endDate;
    
    // Get all days in the range up to today
    const allDays = eachDayOfInterval({ start: startDate, end: actualEndDate });
    
    // Group expenses by day
    const dailySpending: { [key: string]: number } = {};
    
    // Initialize all days with 0
    allDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      dailySpending[dayKey] = 0;
    });
    
    // Add up expenses for each day (only up to today)
    expenses.forEach(expense => {
      const expenseDate = expense.date;
      const expenseDateObj = parseISO(expenseDate);
      if (expenseDate >= dateRange.from && expenseDate <= dateRange.to && expenseDateObj <= today) {
        dailySpending[expenseDate] = (dailySpending[expenseDate] || 0) + expense.amount;
      }
    });
    
    // Convert to array format for chart
    const data = allDays.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      return {
        x: format(day, 'MMM dd'),
        y: dailySpending[dayKey] || 0
      };
    });
    
    return data;
  };

  const dailyData = calculateDailySpending();
  const totalSpending = dailyData.reduce((sum, day) => sum + day.y, 0);
  const averageDaily = dailyData.length > 0 ? totalSpending / dailyData.length : 0;
  const maxDaily = Math.max(...dailyData.map(d => d.y));

  // Theme configuration
  const getThemeConfig = () => {
    const isDark = theme === 'dark';
    return {
      colors: {
        primary: isDark ? '#3b82f6' : '#2563eb',
        text: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#334155' : '#e2e8f0',
        background: isDark ? '#0f172a' : '#ffffff'
      },
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
  };

  // Chart rendering
  useEffect(() => {
    if (!chartRef.current || !dailyData.length) return;

    // Cleanup existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const themeConfig = getThemeConfig();

    const config = {
      chart: {
        height: 200,
        type: 'area',
        fontFamily: themeConfig.fontFamily,
        background: 'transparent',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      series: [{
        name: 'Daily Spending',
        data: dailyData.map(d => d.y)
      }],
      xaxis: {
        categories: dailyData.map(d => d.x),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { show: false }
      },
      colors: [themeConfig.colors.primary],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      markers: {
        size: 0
      },
      grid: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        enabled: true,
        theme: theme,
        style: {
          fontFamily: themeConfig.fontFamily
        },
        x: {
          show: true,
          formatter: (val: number, opts: any) => {
            return dailyData[opts.dataPointIndex]?.x || '';
          }
        },
        y: {
          formatter: (value: number) => formatCurrency(value)
        }
      }
    };

    chartInstance.current = new ApexCharts(chartRef.current, config);
    chartInstance.current.render();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [dailyData, theme]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5 text-primary" />
            Daily Spending Trend
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div ref={chartRef} className="w-full h-[200px]" />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(totalSpending)}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(averageDaily)}
              </div>
              <div className="text-xs text-muted-foreground">Avg/Day</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(maxDaily)}
              </div>
              <div className="text-xs text-muted-foreground">Highest</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
