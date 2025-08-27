import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ApexCharts from 'apexcharts';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { type Expense, type Budget, formatCurrency } from '@/lib/types';

interface AdvancedChartsProps {
  expenses: Expense[];
  budgets: Budget[];
}

export function AdvancedCharts({ expenses, budgets }: AdvancedChartsProps) {
  // Flowbite Chart references
  const areaChartRef = useRef<HTMLDivElement>(null);
  const columnChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        monthlyTrends: [],
        categoryBreakdown: [],
        weeklyPattern: [],
        budgetPerformance: [],
        totalSpent: 0,
        avgDaily: 0
      };
    }

    // Monthly trends (last 12 months)
    const monthlyTrends: { month: string; amount: number }[] = [];
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
        amount: monthTotal
      });
    }

    // Category breakdown
    const categoryMap = new Map();
    expenses.forEach(expense => {
      const category = expense.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
    });
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Weekly pattern (last 8 weeks)
    const weeklyPattern: { week: string; amount: number }[] = [];
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
      weeklyPattern.push({
        week: `W${8 - i}`,
        amount: weekTotal
      });
    }

    // Budget performance
    const budgetPerformance = budgets.map(budget => {
      const spent = expenses.filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: budget.category,
        spent,
        budget: budget.limit,
        percentage: budget.limit > 0 ? (spent / budget.limit) * 100 : 0
      };
    });

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const avgDaily = totalSpent / 30;

    return {
      monthlyTrends,
      categoryBreakdown,
      weeklyPattern,
      budgetPerformance,
      totalSpent,
      avgDaily
    };
  }, [expenses, budgets]);

  // Area Chart - Monthly Trends (Flowbite Style)
  useEffect(() => {
    if (areaChartRef.current && chartData.monthlyTrends.length > 0) {
      const chart = new ApexCharts(areaChartRef.current, {
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
          data: chartData.monthlyTrends.map(item => item.amount),
          color: '#1A56DB',
        }],
        xaxis: {
          categories: chartData.monthlyTrends.map(item => item.month),
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
  }, [chartData.monthlyTrends]);

  // Column Chart - Category Breakdown (Flowbite Style)
  useEffect(() => {
    if (columnChartRef.current && chartData.categoryBreakdown.length > 0) {
      const chart = new ApexCharts(columnChartRef.current, {
        chart: {
          height: 400,
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
          name: 'Category Spending',
          color: '#1A56DB',
          data: chartData.categoryBreakdown.map(item => ({
            x: item.category,
            y: item.amount
          })),
        }],
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [chartData.categoryBreakdown]);

  // Pie Chart - Category Distribution (Flowbite Style)
  useEffect(() => {
    if (pieChartRef.current && chartData.categoryBreakdown.length > 0) {
      const chart = new ApexCharts(pieChartRef.current, {
        chart: {
          height: 420,
          type: 'pie',
          fontFamily: 'Inter, sans-serif',
        },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            labels: { show: true },
            size: "100%",
            dataLabels: { offset: -25 }
          },
        },
        labels: chartData.categoryBreakdown.map(item => item.category),
        series: chartData.categoryBreakdown.map(item => item.amount),
        colors: ['#1C64F2', '#16BDCA', '#9061F9', '#FDBA8C', '#E74694', '#F59E0B', '#3B82F6', '#EF4444'],
        legend: { show: false },
        tooltip: {
          enabled: true,
          x: { show: false },
        }
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [chartData.categoryBreakdown]);

  // Donut Chart - Budget Performance (Flowbite Style)
  useEffect(() => {
    if (donutChartRef.current && chartData.budgetPerformance.length > 0) {
      const chart = new ApexCharts(donutChartRef.current, {
        chart: {
          height: 420,
          type: 'donut',
          fontFamily: 'Inter, sans-serif',
        },
        stroke: {
          colors: ['transparent'],
          lineCap: '',
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontFamily: 'Inter, sans-serif',
                  offsetY: 20,
                },
                total: {
                  showAlways: true,
                  show: true,
                  label: 'Budget Usage',
                  fontFamily: 'Inter, sans-serif',
                  formatter: function (w) {
                    const totalSpent = chartData.totalSpent;
                    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
                    const percentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';
                    return `${percentage}%`;
                  },
                },
                value: {
                  show: true,
                  fontFamily: 'Inter, sans-serif',
                  offsetY: -20,
                  formatter: function (value) {
                    return value + '%';
                  },
                },
              },
              size: '80%',
            },
          },
        },
        grid: { padding: { top: -2 } },
        labels: chartData.budgetPerformance.map(item => item.category),
        series: chartData.budgetPerformance.map(item => item.percentage),
        colors: ['#16BDCA', '#FDBA8C', '#E74694', '#1C64F2', '#9061F9'],
        legend: { show: false },
        tooltip: {
          enabled: true,
          x: { show: false },
        },
        dataLabels: { enabled: false }
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [chartData.budgetPerformance, chartData.totalSpent, budgets]);

  // Line Chart - Weekly Pattern (Flowbite Style)
  useEffect(() => {
    if (lineChartRef.current && chartData.weeklyPattern.length > 0) {
      const chart = new ApexCharts(lineChartRef.current, {
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
          name: 'Weekly Spending',
          data: chartData.weeklyPattern.map(item => item.amount),
          color: '#16BDCA',
        }],
        xaxis: {
          categories: chartData.weeklyPattern.map(item => item.week),
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
  }, [chartData.weeklyPattern]);

  // Bar Chart - Budget vs Actual (Flowbite Style)
  useEffect(() => {
    if (barChartRef.current && chartData.budgetPerformance.length > 0) {
      const chart = new ApexCharts(barChartRef.current, {
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
        series: [
          {
            name: 'Budget',
            color: '#16BDCA',
            data: chartData.budgetPerformance.map(item => ({
              x: item.category,
              y: item.budget
            })),
          },
          {
            name: 'Spent',
            color: '#1A56DB',
            data: chartData.budgetPerformance.map(item => ({
              x: item.category,
              y: item.spent
            })),
          }
        ],
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [chartData.budgetPerformance]);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights and visualizations
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
                {formatCurrency(chartData.totalSpent)}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Total Spending</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center me-3">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {formatCurrency(chartData.avgDaily)}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Daily Average</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center me-3">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h5 className="leading-none text-2xl font-bold text-gray-900 dark:text-white pb-1">
                {chartData.categoryBreakdown.length}
              </h5>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Active Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Pure Flowbite Design */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Monthly Trends Area Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <TrendingUp className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Monthly Trends</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Last 12 months spending</p>
              </div>
            </div>
          </div>
          <div ref={areaChartRef} className="h-96"></div>
        </div>

        {/* Category Column Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <BarChart3 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Category Breakdown</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Spending by category</p>
              </div>
            </div>
          </div>
          <div ref={columnChartRef} className="h-96"></div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between items-start w-full mb-4">
            <div className="flex-col items-center">
              <div className="flex items-center mb-1">
                <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Category Distribution</h5>
              </div>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Percentage breakdown</p>
            </div>
          </div>
          <div ref={pieChartRef} className="h-96"></div>
        </div>

        {/* Budget Performance Donut Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between mb-3">
            <div className="flex justify-center items-center">
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pe-1">Budget Performance</h5>
            </div>
          </div>
          <div ref={donutChartRef} className="h-96"></div>
        </div>

        {/* Weekly Pattern Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <Activity className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Weekly Pattern</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Last 8 weeks</p>
              </div>
            </div>
          </div>
          <div ref={lineChartRef} className="h-80"></div>
        </div>

        {/* Budget vs Actual Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center me-3">
                <BarChart3 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="leading-none text-xl font-bold text-gray-900 dark:text-white pb-1">Budget vs Actual</h5>
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">Performance comparison</p>
              </div>
            </div>
          </div>
          <div ref={barChartRef} className="h-96"></div>
        </div>
      </div>
    </div>
  );
}
