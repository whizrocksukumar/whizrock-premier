'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalyticsDataPoint } from '@/hooks/useAnalytics';
import { TrendingUp } from 'lucide-react';

interface ConversionFunnelChartProps {
  data: AnalyticsDataPoint[];
}

const REGION_COLORS: Record<string, string> = {
  'West Auckland': '#3b82f6',
  'Rodney': '#10b981',
  'North Shore': '#f59e0b',
  'Central Auckland': '#8b5cf6',
  'South Auckland': '#ef4444',
  'East Auckland': '#ec4899',
  'Unknown': '#6b7280'
};

export default function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  // Prepare time-series data grouped by region
  const chartData = prepareTimeSeriesData(data);
  const regions = Array.from(new Set(data.map(d => d.region)));

  // Calculate trends
  const trends = calculateTrends(data);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Conversion Rate Trends
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Track which territories are improving at closing deals over time
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {regions.map(region => (
              <Line
                key={region}
                type="monotone"
                dataKey={region}
                name={region}
                stroke={REGION_COLORS[region] || '#6b7280'}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No conversion data available for selected period
        </div>
      )}

      {/* Trend Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.slice(0, 4).map((trend) => (
          <div key={trend.region} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">{trend.region}</p>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: REGION_COLORS[trend.region] || '#6b7280' }}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {trend.current.toFixed(1)}%
              </span>
              {trend.change !== 0 && (
                <span className={`text-sm font-semibold flex items-center gap-1 ${trend.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.change > 0 ? '↑' : '↓'} {Math.abs(trend.change).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {trend.change > 0 ? 'Improving' : trend.change < 0 ? 'Declining' : 'Stable'} conversion rate
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function prepareTimeSeriesData(data: AnalyticsDataPoint[]) {
  // Group by month
  const monthMap = new Map<string, any>();

  data.forEach(point => {
    const monthKey = new Date(point.month).toISOString().split('T')[0];
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { month: monthKey });
    }
    
    const monthData = monthMap.get(monthKey);
    monthData[point.region] = point.conversion_rate;
  });

  return Array.from(monthMap.values()).sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );
}

function calculateTrends(data: AnalyticsDataPoint[]) {
  const regionMap = new Map<string, { rates: number[], months: string[] }>();

  data.forEach(point => {
    if (!regionMap.has(point.region)) {
      regionMap.set(point.region, { rates: [], months: [] });
    }
    const regional = regionMap.get(point.region)!;
    regional.rates.push(point.conversion_rate);
    regional.months.push(point.month);
  });

  return Array.from(regionMap.entries()).map(([region, { rates }]) => {
    const current = rates[rates.length - 1] || 0;
    const previous = rates.length > 1 ? rates[0] : current;
    const change = current - previous;

    return {
      region,
      current,
      previous,
      change
    };
  }).sort((a, b) => b.current - a.current);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(label);
  const formattedDate = date.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs">
      <p className="font-semibold text-gray-900 mb-3">{formattedDate}</p>
      <div className="space-y-2">
        {payload
          .sort((a: any, b: any) => b.value - a.value)
          .map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-semibold text-sm">{entry.value.toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}
