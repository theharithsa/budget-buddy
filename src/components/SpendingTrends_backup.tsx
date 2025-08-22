import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ApexCharts from 'apexcharts';
import { TrendingUp } from 'lucide-react';
import { type Expense, DEFAULT_CATEGORIES, formatCurrency, getCurrentMonth, getMonthlyExpenses } from '@/lib/types';

interface SpendingTrendsProps {
  expenses: Expense[];
}

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  
  const currentMonth = getCurrentMonth();
  const monthlyExpenses = getMonthlyExpenses(expenses, currentMonth);

  const categoryData = useMemo(() => {
    const categoryTotals = DEFAULT_CATEGORIES.map(category => {
      const total = monthlyExpenses
        .filter(expense => expense.category === category.name)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: category.name,
        value: total,
        color: category.color,
        icon: category.icon,
      };
    }).filter(item => item.value > 0);

    return categoryTotals.sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const last6MonthsData = useMemo(() => {
    const months: { month: string; amount: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthExpenses = getMonthlyExpenses(expenses, monthKey);
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: total,
      });
    }
    
    return months;
  }, [expenses]);

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Initialize ApexCharts
  useEffect(() => {
    // Pie Chart - Category Spending
    if (pieChartRef.current && categoryData.length > 0) {
      const pieChart = new ApexCharts(pieChartRef.current, {
        chart: {
          type: 'pie',
          height: 320,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
          toolbar: {
            show: false,
          },
        },
        series: categoryData.map(item => item.value),
        labels: categoryData.map(item => item.name),
        colors: categoryData.map(item => item.color),
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '14px',
          fontWeight: 500,
          labels: {
            colors: 'rgb(107 114 128)',
          },
          markers: {
            width: 8,
            height: 8,
            radius: 2,
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: '0%',
            },
            expandOnClick: false,
            dataLabels: {
              offset: 25,
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '12px',
            fontWeight: '600',
            colors: ['#fff'],
          },
          dropShadow: {
            enabled: false,
          },
          formatter: (val: number, opts: any) => {
            const value = categoryData[opts.seriesIndex]?.value;
            return formatCurrency(value);
          },
        },
        stroke: {
          width: 2,
          colors: ['#ffffff'],
        },
        tooltip: {
          theme: 'light',
          style: {
            fontSize: '12px',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
          y: {
            formatter: (value: number) => formatCurrency(value),
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 300,
              },
              legend: {
                position: 'bottom',
              },
            },
          },
        ],
      });

      pieChart.render();

      return () => {
        pieChart.destroy();
      };
    }
  }, [categoryData]);

  // Bar Chart - 6 Month Trend
  useEffect(() => {
    if (barChartRef.current && last6MonthsData.length > 0) {
      const barChart = new ApexCharts(barChartRef.current, {
        chart: {
          type: 'bar',
          height: 320,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
          toolbar: {
            show: false,
          },
        },
        series: [
          {
            name: 'Monthly Spending',
            data: last6MonthsData.map(item => item.amount),
          },
        ],
        xaxis: {
          categories: last6MonthsData.map(item => item.month),
          labels: {
            style: {
              colors: 'rgb(107 114 128)',
              fontSize: '12px',
              fontWeight: 500,
            },
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: 'rgb(107 114 128)',
              fontSize: '12px',
              fontWeight: 500,
            },
            formatter: (value: number) => formatCurrency(value),
          },
        },
        colors: ['#1f77b4'],
        plotOptions: {
          bar: {
            borderRadius: 4,
            borderRadiusApplication: 'end',
            columnWidth: '60%',
          },
        },
        dataLabels: {
          enabled: false,
        },
        grid: {
          show: true,
          borderColor: 'rgb(229 231 235)',
          strokeDashArray: 0,
          xaxis: {
            lines: {
              show: false,
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
        tooltip: {
          theme: 'light',
          style: {
            fontSize: '12px',
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
          y: {
            formatter: (value: number) => formatCurrency(value),
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              chart: {
                height: 300,
              },
              plotOptions: {
                bar: {
                  columnWidth: '80%',
                },
              },
            },
          },
        ],
      });

      barChart.render();

      return () => {
        barChart.destroy();
      };
    }
  }, [last6MonthsData]);

  if (expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          <h2 className="text-2xl font-bold">Spending Trends</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No spending data</h3>
              <p className="text-muted-foreground">
                Add some expenses to see your spending trends and patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={24} className="text-primary" />
        <h2 className="text-2xl font-bold">Spending Trends</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData[0]?.name || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryData[0] ? formatCurrency(categoryData[0].value) : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent / new Date().getDate())}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current month
            </p>
          </CardContent>
        </Card>
      </div>

      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={pieChartRef} className="w-full h-80"></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => {
                  const percentage = (category.value / totalSpent) * 100;
                  return (
                    <div key={category.name} className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">
                            {formatCurrency(category.value)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>6-Month Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={barChartRef} className="w-full h-80"></div>
        </CardContent>
      </Card>
    </div>
  );
}