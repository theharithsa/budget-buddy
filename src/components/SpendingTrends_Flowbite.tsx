import { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ApexCharts from 'apexcharts';
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Activity } from 'lucide-react';
import { type Expense, type Budget, formatCurrency } from '@/lib/types';

interface SpendingTrendsProps {
  expenses: Expense[];
  budgets: Budget[];
}

export function SpendingTrends({ expenses, budgets }: SpendingTrendsProps) {
  // Flowbite Chart References
  const monthlyAreaChartRef = useRef<HTMLDivElement>(null);
  const categoryBarChartRef = useRef<HTMLDivElement>(null);
  const weeklyColumnChartRef = useRef<HTMLDivElement>(null);
  const dailyLineChartRef = useRef<HTMLDivElement>(null);

  // Calculate trends data
  const trendsData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        monthlyTrends: [],
        categoryTrends: [],
        weeklyTrends: [],
        dailyTrends: [],
        totalSpent: 0,
        avgDaily: 0,
        growth: 0
      };
    }

    // Monthly trends (last 12 months)
    const monthlyTrends: { month: string; amount: number; year: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthTotal,
        year: date.getFullYear()
      });
    }

    // Category trends
    const categoryMap = new Map();
    expenses.forEach(expense => {
      const category = expense.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    });
    const categoryTrends = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Weekly trends (last 8 weeks)
    const weeklyTrends: { week: string; amount: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });
      const weekTotal = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      weeklyTrends.push({
        week: `Week ${8 - i}`,
        amount: weekTotal
      });
    }

    // Daily trends (last 30 days)
    const dailyTrends: { day: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === date.toDateString();
      });
      const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      dailyTrends.push({
        day: date.getDate().toString(),
        amount: dayTotal
      });
    }

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgDaily = totalSpent / 30;
    const lastMonthSpent = monthlyTrends[monthlyTrends.length - 1]?.amount || 0;
    const prevMonthSpent = monthlyTrends[monthlyTrends.length - 2]?.amount || 0;
    const growth = prevMonthSpent > 0 ? ((lastMonthSpent - prevMonthSpent) / prevMonthSpent) * 100 : 0;

    return {
      monthlyTrends,
      categoryTrends,
      weeklyTrends,
      dailyTrends,
      totalSpent,
      avgDaily,
      growth
    };
  }, [expenses]);

  // Monthly Area Chart - Flowbite Style
  useEffect(() => {
    if (monthlyAreaChartRef.current && trendsData.monthlyTrends.length > 0) {
      const chart = new ApexCharts(monthlyAreaChartRef.current, {
        chart: {
          height: 400,
          type: 'area',
          fontFamily: 'Inter, sans-serif',
          dropShadow: { enabled: false },
          toolbar: { show: false },
        },
        tooltip: { enabled: true, x: { show: false } },
        legend: { show: false },
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
            shade: '#1C64F2',
            gradientToColors: ['#1C64F2'],
          },
        },
        dataLabels: { enabled: false },
        stroke: { width: 6 },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: 0 },
        },
        series: [{
          name: 'Monthly Spending',
          data: trendsData.monthlyTrends.map(item => item.amount),
          color: '#1A56DB',
        }],
        xaxis: {
          categories: trendsData.monthlyTrends.map(item => item.month),
          labels: { show: true },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          show: true,
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            }
          }
        },
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [trendsData.monthlyTrends]);

  // Category Bar Chart - Flowbite Style
  useEffect(() => {
    if (categoryBarChartRef.current && trendsData.categoryTrends.length > 0) {
      const chart = new ApexCharts(categoryBarChartRef.current, {
        chart: {
          height: 400,
          type: 'bar',
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: true,
            columnWidth: '70%',
            borderRadiusApplication: 'end',
            borderRadius: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          style: { fontFamily: 'Inter, sans-serif' },
        },
        states: {
          hover: {
            filter: { type: 'darken', value: 1 },
          },
        },
        stroke: { show: true, width: 0, colors: ['transparent'] },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: -14 },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
            }
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: true },
        fill: { opacity: 1 },
        series: [{
          name: 'Category Spending',
          color: '#1A56DB',
          data: trendsData.categoryTrends.map(item => ({
            x: item.category,
            y: item.amount
          })),
        }],
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [trendsData.categoryTrends]);

  // Weekly Column Chart - Flowbite Style
  useEffect(() => {
    if (weeklyColumnChartRef.current && trendsData.weeklyTrends.length > 0) {
      const chart = new ApexCharts(weeklyColumnChartRef.current, {
        chart: {
          height: 350,
          type: 'bar',
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '70%',
            borderRadiusApplication: 'end',
            borderRadius: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          style: { fontFamily: 'Inter, sans-serif' },
        },
        states: {
          hover: {
            filter: { type: 'darken', value: 1 },
          },
        },
        stroke: { show: true, width: 0, colors: ['transparent'] },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: -14 },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
            }
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false },
        fill: { opacity: 1 },
        series: [{
          name: 'Weekly Spending',
          color: '#16BDCA',
          data: trendsData.weeklyTrends.map(item => ({
            x: item.week,
            y: item.amount
          })),
        }],
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [trendsData.weeklyTrends]);

  // Daily Line Chart - Flowbite Style
  useEffect(() => {
    if (dailyLineChartRef.current && trendsData.dailyTrends.length > 0) {
      const chart = new ApexCharts(dailyLineChartRef.current, {
        chart: {
          height: 350,
          type: 'line',
          fontFamily: 'Inter, sans-serif',
          dropShadow: { enabled: false },
          toolbar: { show: false },
        },
        tooltip: { enabled: true, x: { show: false } },
        legend: { show: false },
        dataLabels: { enabled: false },
        stroke: { width: 6, curve: 'smooth' },
        grid: {
          show: true,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: 0 },
        },
        series: [{
          name: 'Daily Spending',
          data: trendsData.dailyTrends.map(item => item.amount),
          color: '#9061F9',
        }],
        xaxis: {
          categories: trendsData.dailyTrends.map(item => item.day),
          labels: { show: true },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          show: true,
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            }
          }
        },
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [trendsData.dailyTrends]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spending Trends</h1>
          <p className="text-muted-foreground">
            Analyze your spending patterns over time
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center me-3">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {formatCurrency(trendsData.totalSpent)}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Total Spending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center me-3">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {formatCurrency(trendsData.avgDaily)}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Daily Average</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center me-3 ${
              trendsData.growth >= 0 
                ? 'bg-red-100 dark:bg-red-900' 
                : 'bg-green-100 dark:bg-green-900'
            }`}>
              {trendsData.growth >= 0 ? (
                <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {Math.abs(trendsData.growth).toFixed(1)}%
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {trendsData.growth >= 0 ? 'Increase' : 'Decrease'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Pure Flowbite Design */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <BarChart3 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Monthly Trends</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Last 12 months spending</p>
              </div>
            </div>
          </div>
          <div ref={monthlyAreaChartRef} className="h-96"></div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <Activity className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Top Categories</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Spending by category</p>
              </div>
            </div>
          </div>
          <div ref={categoryBarChartRef} className="h-96"></div>
        </div>

        {/* Weekly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <TrendingUp className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Weekly Performance</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Last 8 weeks</p>
              </div>
            </div>
          </div>
          <div ref={weeklyColumnChartRef} className="h-80"></div>
        </div>

        {/* Daily Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <Calendar className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Daily Activity</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Last 30 days</p>
              </div>
            </div>
          </div>
          <div ref={dailyLineChartRef} className="h-80"></div>
        </div>
      </div>
    </div>
  );
}
