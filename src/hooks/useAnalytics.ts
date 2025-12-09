import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AnalyticsDataPoint {
  month: string;
  region: string;
  total_quotes: number;
  won_quotes: number;
  conversion_rate: number;
  total_revenue: number;
  average_job_value: number;
  total_cost: number;
  gross_margin_percent: number;
  variance_count: number;
  total_jobs: number;
  quoted_sqm: number;
  installed_sqm: number;
  last_updated: string;
}

export interface RegionalSummary {
  region: string;
  revenue: number;
  marginPercent: number;
  conversionRate: number;
  isWinner: {
    revenue: boolean;
    margin: boolean;
    conversion: boolean;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export const DATE_RANGES: Record<string, DateRange> = {
  last30: {
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
    label: 'Last 30 Days'
  },
  ytd: {
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
    label: 'Year to Date'
  },
  lastYear: {
    start: new Date(new Date().getFullYear() - 1, 0, 1),
    end: new Date(new Date().getFullYear() - 1, 11, 31),
    label: 'Last Year'
  },
  last6Months: {
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    end: new Date(),
    label: 'Last 6 Months'
  },
  last12Months: {
    start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
    end: new Date(),
    label: 'Last 12 Months'
  }
};

export function useAnalytics(
  selectedRegions: string[],
  dateRange: DateRange = DATE_RANGES.last6Months
) {
  const [data, setData] = useState<AnalyticsDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedRegions, dateRange]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from the view first
      let query = supabase
        .from('analytics_monthly_regional')
        .select('*')
        .gte('month', dateRange.start.toISOString())
        .lte('month', dateRange.end.toISOString());

      // Filter by regions if specified
      if (selectedRegions.length > 0) {
        query = query.in('region', selectedRegions);
      }

      const { data: viewData, error: viewError } = await query;

      if (viewError) {
        console.warn('View not available, using mock data:', viewError);
        // If view doesn't exist yet, use mock data
        setData(generateMockData(selectedRegions, dateRange));
      } else {
        setData(viewData || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      // Fallback to mock data
      setData(generateMockData(selectedRegions, dateRange));
    } finally {
      setLoading(false);
    }
  }

  // Calculate regional summaries for comparison cards
  const regionalSummaries = calculateRegionalSummaries(data);

  return {
    data,
    loading,
    error,
    regionalSummaries,
    refresh: fetchAnalytics
  };
}

function calculateRegionalSummaries(data: AnalyticsDataPoint[]): RegionalSummary[] {
  // Group by region and sum metrics
  const regionMap = new Map<string, { revenue: number; margin: number; conversion: number; count: number }>();

  data.forEach(point => {
    const existing = regionMap.get(point.region) || { revenue: 0, margin: 0, conversion: 0, count: 0 };
    regionMap.set(point.region, {
      revenue: existing.revenue + point.total_revenue,
      margin: existing.margin + point.gross_margin_percent,
      conversion: existing.conversion + point.conversion_rate,
      count: existing.count + 1
    });
  });

  // Calculate averages and convert to array
  const summaries: RegionalSummary[] = Array.from(regionMap.entries()).map(([region, stats]) => ({
    region,
    revenue: stats.revenue,
    marginPercent: stats.count > 0 ? stats.margin / stats.count : 0,
    conversionRate: stats.count > 0 ? stats.conversion / stats.count : 0,
    isWinner: { revenue: false, margin: false, conversion: false }
  }));

  // Find winners for each metric
  if (summaries.length > 0) {
    const maxRevenue = Math.max(...summaries.map(s => s.revenue));
    const maxMargin = Math.max(...summaries.map(s => s.marginPercent));
    const maxConversion = Math.max(...summaries.map(s => s.conversionRate));

    summaries.forEach(summary => {
      summary.isWinner.revenue = summary.revenue === maxRevenue;
      summary.isWinner.margin = summary.marginPercent === maxMargin;
      summary.isWinner.conversion = summary.conversionRate === maxConversion;
    });
  }

  return summaries;
}

// Mock data generator for development
function generateMockData(regions: string[], dateRange: DateRange): AnalyticsDataPoint[] {
  const mockRegions = regions.length > 0 ? regions : ['West Auckland', 'Rodney', 'North Shore', 'Central Auckland'];
  const months = getMonthsBetween(dateRange.start, dateRange.end);
  
  const mockData: AnalyticsDataPoint[] = [];

  mockRegions.forEach(region => {
    months.forEach((month, idx) => {
      const baseRevenue = region === 'West Auckland' ? 45000 : region === 'Rodney' ? 38000 : 35000;
      const trend = 1 + (idx * 0.05); // Growth trend
      
      mockData.push({
        month: month.toISOString(),
        region,
        total_quotes: Math.floor(15 + Math.random() * 10),
        won_quotes: Math.floor(8 + Math.random() * 5),
        conversion_rate: 45 + Math.random() * 20,
        total_revenue: baseRevenue * trend + (Math.random() * 5000),
        average_job_value: 3500 + Math.random() * 1000,
        total_cost: baseRevenue * trend * 0.65,
        gross_margin_percent: 30 + Math.random() * 10,
        variance_count: Math.floor(Math.random() * 3),
        total_jobs: Math.floor(8 + Math.random() * 5),
        quoted_sqm: 350 + Math.random() * 100,
        installed_sqm: 370 + Math.random() * 120, // Slightly over-using materials
        last_updated: new Date().toISOString()
      });
    });
  });

  return mockData;
}

function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(start);
  current.setDate(1); // Start of month

  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
