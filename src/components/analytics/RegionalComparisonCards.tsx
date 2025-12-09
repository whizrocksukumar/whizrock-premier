import { TrendingUp, TrendingDown, DollarSign, Target, Award } from 'lucide-react';
import { RegionalSummary } from '@/hooks/useAnalytics';

interface RegionalComparisonCardsProps {
  summaries: RegionalSummary[];
}

export default function RegionalComparisonCards({ summaries }: RegionalComparisonCardsProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No regional data available. Select regions to compare.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {summaries.map((summary) => (
        <RegionalCard key={summary.region} summary={summary} />
      ))}
    </div>
  );
}

function RegionalCard({ summary }: { summary: RegionalSummary }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Region Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{summary.region}</h3>
        {(summary.isWinner.revenue || summary.isWinner.margin || summary.isWinner.conversion) && (
          <Award className="w-5 h-5 text-yellow-500" />
        )}
      </div>

      {/* Revenue Metric */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Revenue
          </span>
          {summary.isWinner.revenue && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Winner
            </span>
          )}
        </div>
        <p className={`text-2xl font-bold ${summary.isWinner.revenue ? 'text-green-600' : 'text-gray-900'}`}>
          ${summary.revenue.toLocaleString()}
        </p>
      </div>

      {/* Margin Metric */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Margin
          </span>
          {summary.isWinner.margin && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Winner
            </span>
          )}
        </div>
        <p className={`text-2xl font-bold ${summary.isWinner.margin ? 'text-green-600' : 'text-gray-900'}`}>
          {summary.marginPercent.toFixed(1)}%
        </p>
      </div>

      {/* Win Rate Metric */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Target className="w-4 h-4" />
            Win Rate
          </span>
          {summary.isWinner.conversion && (
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              Winner
            </span>
          )}
        </div>
        <p className={`text-2xl font-bold ${summary.isWinner.conversion ? 'text-green-600' : 'text-gray-900'}`}>
          {summary.conversionRate.toFixed(1)}%
        </p>
      </div>

      {/* Performance Indicator Bar */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <div 
            className={`h-2 rounded-full flex-1 ${summary.isWinner.revenue ? 'bg-green-500' : 'bg-gray-200'}`}
            title="Revenue Leader"
          />
          <div 
            className={`h-2 rounded-full flex-1 ${summary.isWinner.margin ? 'bg-green-500' : 'bg-gray-200'}`}
            title="Margin Leader"
          />
          <div 
            className={`h-2 rounded-full flex-1 ${summary.isWinner.conversion ? 'bg-green-500' : 'bg-gray-200'}`}
            title="Conversion Leader"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {[
            summary.isWinner.revenue && 'Revenue',
            summary.isWinner.margin && 'Margin',
            summary.isWinner.conversion && 'Conversion'
          ].filter(Boolean).join(' • ') || 'Performance Metrics'}
        </p>
      </div>
    </div>
  );
}
