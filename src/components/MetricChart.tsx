import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/types';

interface MetricData {
  labels: string[];
  values: number[];
  metadata?: Record<string, any>;
}

interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  group: string;
  chartTypes: string[];
  defaultChart: string;
}

interface MetricChartProps {
  data: MetricData;
  type: 'line' | 'bar' | 'donut';
  metric: MetricDefinition;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0',
  '#87ceeb', '#ffb347', '#98fb98', '#f0e68c', '#ff69b4', '#87cefa'
];

export function MetricChart({ data, type, metric }: MetricChartProps) {
  // Transform data for recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    // For comparison charts (budget vs actual)
    ...(data.metadata?.budgetValues && {
      budget: data.metadata.budgetValues[index]
    })
  }));

  const formatTooltipValue = (value: number) => {
    if (data.metadata?.isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return formatCurrency(value);
  };

  const formatAxisValue = (value: number) => {
    if (data.metadata?.isPercentage) {
      return `${Math.round(value)}%`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(value)}`;
  };

  if (type === 'line') {
    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatAxisValue}
            />
            <Tooltip 
              formatter={(value: number) => [formatTooltipValue(value), metric.name]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2 }}
              name={metric.name}
            />
            {data.metadata?.budgetValues && (
              <Line 
                type="monotone" 
                dataKey="budget" 
                stroke="#82ca9d" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#82ca9d', strokeWidth: 2 }}
                name="Budget"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatAxisValue}
            />
            <Tooltip 
              formatter={(value: number) => [formatTooltipValue(value), metric.name]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#8884d8"
              name={metric.name}
              radius={[4, 4, 0, 0]}
            />
            {data.metadata?.budgetValues && (
              <Bar 
                dataKey="budget" 
                fill="#82ca9d"
                name="Budget"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'donut') {
    const pieData = chartData.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));

    const total = data.values.reduce((sum, val) => sum + val, 0);

    return (
      <div className="w-full h-80 flex items-center">
        <div className="w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatTooltipValue(value), metric.name]}
                contentStyle={{ 
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-2">
          {pieData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate max-w-32">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatTooltipValue(item.value)}</div>
                  <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
