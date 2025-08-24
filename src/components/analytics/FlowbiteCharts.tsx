import React, { useMemo, useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';
import { type Expense, type Budget, formatCurrency } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Target } from 'lucide-react';

interface FlowbiteChartsProps {
  expenses: Expense[];
  budgets: Budget[];
}

export function FlowbiteCharts({ expenses, budgets }: FlowbiteChartsProps) {
  const areaChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const columnChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);

  // Theme context for theme-aware charts
  const { theme } = useTheme();

  // Helper function for theme-aware chart configuration
  const getChartThemeConfig = () => {
    const isDark = theme === 'dark';
    return {
      fontFamily: 'Titillium Web, sans-serif',
      colors: {
        primary: isDark ? '#60a5fa' : '#3b82f6',
        secondary: isDark ? '#34d399' : '#10b981',
        tertiary: isDark ? '#f87171' : '#ef4444',
        background: isDark ? '#1f2937' : '#ffffff',
        text: isDark ? '#f9fafb' : '#111827',
        border: isDark ? '#374151' : '#e5e7eb'
      }
    };
  };

  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalSpent: 0,
        weeklyGrowth: 0,
        monthlyData: [],
        categoryData: { labels: [], series: [] },
        budgetPerformance: { labels: [], series: [] }
      };
    }

    // Calculate total spending and growth
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate weekly growth (mock calculation for demo)
    const weeklyGrowth = 23.5;

    // Monthly spending trend data (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        fullDate: new Date(date)
      };
    });

    const monthlyData = last6Months.map(({ month, fullDate }) => {
      const monthSpending = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === fullDate.getMonth() && 
                 expenseDate.getFullYear() === fullDate.getFullYear();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return Math.round(monthSpending);
    });

    // Category data for pie/donut charts
    const categorySpending = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryEntries = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 categories

    const categoryData = {
      labels: categoryEntries.map(([category]) => category),
      series: categoryEntries.map(([, amount]) => Math.round(amount))
    };

    // Budget performance data
    const budgetPerformance = {
      labels: budgets.map(b => b.category).slice(0, 6),
      series: budgets.slice(0, 6).map(budget => {
        const spent = expenses
          .filter(exp => exp.category === budget.category)
          .reduce((sum, exp) => sum + exp.amount, 0);
        return Math.round((spent / budget.limit) * 100);
      })
    };

    return {
      totalSpent,
      weeklyGrowth,
      monthlyData,
      categoryData,
      budgetPerformance
    };
  }, [expenses, budgets]);

  useEffect(() => {
    // Area Chart - Monthly Spending Trends
    if (areaChartRef.current && chartData.monthlyData.length > 0) {
      const themeConfig = getChartThemeConfig();
      const areaChart = new ApexCharts(areaChartRef.current, {
        chart: {
          height: 320,
          type: 'area',
          fontFamily: themeConfig.fontFamily,
          dropShadow: {
            enabled: false,
          },
          toolbar: {
            show: false,
          },
        },
        tooltip: {
          enabled: true,
          x: {
            show: false,
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
            shade: '#1C64F2',
            gradientToColors: ['#1C64F2'],
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: 6,
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: 0
          },
        },
        series: [
          {
            name: 'Monthly Spending',
            data: chartData.monthlyData,
            color: '#1A56DB',
          },
        ],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          labels: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          show: false,
        },
      });
      areaChart.render();

      return () => {
        areaChart.destroy();
      };
    }
  }, [chartData.monthlyData, theme]);

  useEffect(() => {
    // Pie Chart - Category Distribution
    if (pieChartRef.current && chartData.categoryData.series.length > 0) {
      const themeConfig = getChartThemeConfig();
      const pieChart = new ApexCharts(pieChartRef.current, {
        chart: {
          height: 320,
          type: 'pie',
          fontFamily: themeConfig.fontFamily,
        },
        series: chartData.categoryData.series,
        colors: ['#1C64F2', '#16BDCA', '#9061F9', '#FDBA8C', '#E74694'],
        labels: chartData.categoryData.labels,
        dataLabels: {
          enabled: false,
        },
        legend: {
          position: 'bottom',
          fontFamily: themeConfig.fontFamily,
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val) {
              return '$' + val;
            }
          }
        },
      });
      pieChart.render();

      return () => {
        pieChart.destroy();
      };
    }
  }, [chartData.categoryData, theme]);

  useEffect(() => {
    // Column Chart - Weekly Comparison
    if (columnChartRef.current) {
      const themeConfig = getChartThemeConfig();
      const columnChart = new ApexCharts(columnChartRef.current, {
        chart: {
          height: 320,
          type: 'bar',
          fontFamily: themeConfig.fontFamily,
          toolbar: {
            show: false,
          },
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
          style: {
            fontFamily: themeConfig.fontFamily,
          },
        },
        states: {
          hover: {
            filter: {
              type: 'darken',
              value: 1,
            },
          },
        },
        stroke: {
          show: true,
          width: 0,
          colors: ['transparent'],
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: -14
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: themeConfig.fontFamily,
              cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
            }
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          show: false,
        },
        fill: {
          opacity: 1,
        },
        series: [
          {
            name: 'Spending',
            color: '#1A56DB',
            data: [
              { x: 'Mon', y: 231 },
              { x: 'Tue', y: 122 },
              { x: 'Wed', y: 63 },
              { x: 'Thu', y: 421 },
              { x: 'Fri', y: 122 },
              { x: 'Sat', y: 323 },
              { x: 'Sun', y: 111 },
            ],
          },
        ],
      });
      columnChart.render();

      return () => {
        columnChart.destroy();
      };
    }
  }, [theme]);

  useEffect(() => {
    // Donut Chart - Budget Performance
    if (donutChartRef.current && chartData.budgetPerformance.series.length > 0) {
      const themeConfig = getChartThemeConfig();
      const donutChart = new ApexCharts(donutChartRef.current, {
        chart: {
          height: 320,
          type: 'donut',
          fontFamily: themeConfig.fontFamily,
        },
        series: chartData.budgetPerformance.series,
        colors: ['#1C64F2', '#16BDCA', '#FDBA8C', '#E74694', '#9061F9', '#10B981'],
        labels: chartData.budgetPerformance.labels,
        dataLabels: {
          enabled: false,
        },
        legend: {
          position: 'bottom',
          fontFamily: themeConfig.fontFamily,
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
            },
          },
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val) {
              return val + '%';
            }
          }
        },
      });
      donutChart.render();

      return () => {
        donutChart.destroy();
      };
    }
  }, [chartData.budgetPerformance, theme]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Area Chart - Monthly Spending */}
      <div className="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between">
          <div>
            <h5 className="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">
              {formatCurrency(chartData.totalSpent)}
            </h5>
            <p className="text-base font-normal text-gray-500 dark:text-gray-400">
              Total spending this month
            </p>
          </div>
          <div className="flex items-center px-2.5 py-0.5 text-base font-semibold text-green-500 dark:text-green-500 text-center">
            {chartData.weeklyGrowth}%
            <TrendingUp className="w-3 h-3 ms-1" />
          </div>
        </div>
        <div ref={areaChartRef}></div>
        <div className="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between">
          <div className="flex justify-between items-center pt-5">
            <button
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white"
              type="button">
              Last 6 months
              <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>
            <a
              href="#"
              className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 px-3 py-2">
              Spending Report
              <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Column Chart - Weekly Spending */}
      <div className="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between border-gray-200 border-b dark:border-gray-700 pb-3">
          <dl>
            <dt className="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">Weekly Average</dt>
            <dd className="leading-none text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(chartData.totalSpent / 4)}</dd>
          </dl>
          <div>
            <span className="bg-green-100 text-green-800 text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md dark:bg-green-900 dark:text-green-300">
              <TrendingUp className="w-2.5 h-2.5 me-1.5" />
              Weekly growth 12.5%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 py-3">
          <dl>
            <dt className="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">This Week</dt>
            <dd className="leading-none text-xl font-bold text-green-500 dark:text-green-400">{formatCurrency(chartData.totalSpent * 0.3)}</dd>
          </dl>
          <dl>
            <dt className="text-base font-normal text-gray-500 dark:text-gray-400 pb-1">Last Week</dt>
            <dd className="leading-none text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(chartData.totalSpent * 0.25)}</dd>
          </dl>
        </div>

        <div ref={columnChartRef}></div>
        <div className="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between">
          <div className="flex justify-between items-center pt-5">
            <button
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white"
              type="button">
              Last 7 days
              <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>
            <a
              href="#"
              className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 px-3 py-2">
              Weekly Report
              <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Pie Chart - Category Distribution */}
      <div className="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between items-start w-full">
          <div className="flex-col items-center">
            <div className="flex items-center mb-1">
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white me-1">Category Spending</h5>
              <svg data-popover-target="chart-info" data-popover-placement="bottom" className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 0 1 10 .5Z"/>
              </svg>
            </div>
          </div>
          <button className="inline-flex items-center text-blue-700 dark:text-blue-600 font-medium hover:underline">
            This Month
            <svg className="w-3 h-3 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
            </svg>
          </button>
        </div>

        <div className="py-6" ref={pieChartRef}></div>

        <div className="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between">
          <div className="flex justify-between items-center pt-5">
            <button
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white"
              type="button">
              Last 30 days
              <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>
            <a
              href="#"
              className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 px-3 py-2">
              Category Analysis
              <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Donut Chart - Budget Performance */}
      <div className="max-w-sm w-full bg-white rounded-lg shadow dark:bg-gray-800 p-4 md:p-6">
        <div className="flex justify-between mb-3">
          <div className="flex justify-center items-center">
            <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white pe-1">Budget Performance</h5>
            <svg data-popover-target="chart-info" data-popover-placement="bottom" className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 0 1 10 .5Z"/>
            </svg>
          </div>
          <div>
            <button type="button" className="hidden sm:inline-flex items-center justify-center text-gray-500 w-8 h-8 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm">
              <svg className="w-3.5 h-3.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 18">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="grid grid-cols-3 gap-3 mb-2">
            <dl className="bg-orange-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
              <dt className="w-8 h-8 rounded-full bg-orange-100 dark:bg-gray-500 text-orange-600 dark:text-orange-300 text-sm font-medium flex items-center justify-center mb-1">
                {budgets.filter(b => {
                  const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
                  return (spent / b.limit) < 0.5;
                }).length}
              </dt>
              <dd className="text-orange-600 dark:text-orange-300 text-sm font-medium">Under Budget</dd>
            </dl>
            <dl className="bg-teal-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
              <dt className="w-8 h-8 rounded-full bg-teal-100 dark:bg-gray-500 text-teal-600 dark:text-teal-300 text-sm font-medium flex items-center justify-center mb-1">
                {budgets.filter(b => {
                  const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
                  const ratio = spent / b.limit;
                  return ratio >= 0.5 && ratio < 0.9;
                }).length}
              </dt>
              <dd className="text-teal-600 dark:text-teal-300 text-sm font-medium">On Track</dd>
            </dl>
            <dl className="bg-red-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]">
              <dt className="w-8 h-8 rounded-full bg-red-100 dark:bg-gray-500 text-red-600 dark:text-red-300 text-sm font-medium flex items-center justify-center mb-1">
                {budgets.filter(b => {
                  const spent = expenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
                  return (spent / b.limit) >= 0.9;
                }).length}
              </dt>
              <dd className="text-red-600 dark:text-red-300 text-sm font-medium">Over Budget</dd>
            </dl>
          </div>
        </div>

        <div className="py-6" ref={donutChartRef}></div>

        <div className="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between">
          <div className="flex justify-between items-center pt-5">
            <button
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white"
              type="button">
              This Month
              <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
              </svg>
            </button>
            <a
              href="#"
              className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 px-3 py-2">
              Budget Report
              <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
