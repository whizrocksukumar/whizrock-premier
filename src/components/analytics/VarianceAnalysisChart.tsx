'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalyticsDataPoint } from '@/hooks/useAnalytics';
import { AlertTriangle } from 'lucide-react';

interface VarianceAnalysisChartProps {
  data: AnalyticsDataPoint[];
}

export default function VarianceAnalysisChart({ data }: VarianceAnalysisChartProps) {
  // Aggregate by region
  const chartData = aggregateByRegion(data);

  // Calculate overall variance
  const totalQuoted = chartData.reduce((sum, d) => sum + d.quoted_sqm, 0);
  const totalInstalled = chartData.reduce((sum, d) => sum + d.installed_sqm, 0);
  const overagePercent = totalQuoted > 0 ? ((totalInstalled - totalQuoted) / totalQuoted) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Variance Analysis: Quoted vs Installed
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Material overage by region - identify profit leaks
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Overall Overage</p>
          <p className={`text-2xl font-bold ${overagePercent > 5 ? 'text-red-600' : overagePercent > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {overagePercent > 0 ? '+' : ''}{overagePercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="region" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Square Metres (m²)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="quoted_sqm" 
              name="Quoted m²" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="installed_sqm" 
              name="Installed m²" 
              fill="#ef4444" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No variance data available for selected period
        </div>
      )}

      {/* Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {chartData.slice(0, 3).map((region) => {
          const overage = region.installed_sqm - region.quoted_sqm;
          const overagePercent = region.quoted_sqm > 0 ? (overage / region.quoted_sqm) * 100 : 0;
          
          return (
            <div key={region.region} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{region.region}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${overagePercent > 5 ? 'text-red-600' : overagePercent > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {overage > 0 ? '+' : ''}{overage.toFixed(0)} m²
                </span>
                <span className="text-sm text-gray-600">
                  ({overagePercent > 0 ? '+' : ''}{overagePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function aggregateByRegion(data: AnalyticsDataPoint[]) {
  const regionMap = new Map<string, { quoted_sqm: number; installed_sqm: number }>();

  data.forEach(point => {
    const existing = regionMap.get(point.region) || { quoted_sqm: 0, installed_sqm: 0 };
    regionMap.set(point.region, {
      quoted_sqm: existing.quoted_sqm + point.quoted_sqm,
      installed_sqm: existing.installed_sqm + point.installed_sqm
    });
  });

  return Array.from(regionMap.entries())
    .map(([region, stats]) => ({
      region,
      ...stats,
      variance: stats.installed_sqm - stats.quoted_sqm,
      variance_percent: stats.quoted_sqm > 0 ? ((stats.installed_sqm - stats.quoted_sqm) / stats.quoted_sqm) * 100 : 0
    }))
    .sort((a, b) => b.variance_percent - a.variance_percent);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const quoted = payload[0]?.value || 0;
  const installed = payload[1]?.value || 0;
  const variance = installed - quoted;
  const variancePercent = quoted > 0 ? (variance / quoted) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            Quoted:
          </span>
          <span className="font-semibold">{quoted.toFixed(0)} m²</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            Installed:
          </span>
          <span className="font-semibold">{installed.toFixed(0)} m²</span>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Variance:</span>
            <span className={`font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(0)} m² ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
