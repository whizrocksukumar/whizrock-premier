# Analytics & Comparative Dashboard

## Overview
A comprehensive analytics dashboard for strategic analysis of regional performance across the Premier Insulation business. This dashboard focuses on **Profit**, **Variance**, and **Efficiency** metrics to identify opportunities and issues.

## 🎯 Key Features

### 1. **Regional Comparison Cards (The Head-to-Head)**
- Side-by-side comparison of regions
- Highlights the "winner" for each metric in green
- Metrics tracked:
  - Revenue (total sales value)
  - Margin % (profitability)
  - Win Rate (conversion percentage)
- Visual performance indicators

### 2. **Variance Analysis Chart (The Profit Leak)**
- Grouped bar chart comparing Quoted m² vs Installed m²
- Identifies regions over-using materials
- Shows material overage by region
- Overall overage percentage calculated
- Helps identify profit leaks from material waste

### 3. **Conversion Funnel Chart (The Territory Tracker)**
- Multi-line chart showing conversion rates over time
- One line per region for easy comparison
- Trend indicators (improving/declining/stable)
- Track which territories are getting better at closing deals

### 4. **Global Filters**
- **Date Range Picker:**
  - Last 30 Days
  - Last 6 Months
  - Year to Date (YTD)
  - Last Year
  - Last 12 Months
- **Region Multi-Select:**
  - Compare any combination of regions
  - Quick select/deselect all
  - Visual pills showing active filters

## 📊 Data Model

### Supabase View: `analytics_monthly_regional`

The dashboard pulls data from a Supabase view that aggregates metrics by month and region:

**Metrics Calculated:**
- `total_quotes` - Total number of quotes in period
- `won_quotes` - Number of accepted/won quotes
- `conversion_rate` - Percentage of quotes converted to jobs
- `total_revenue` - Sum of quote values for won quotes
- `average_job_value` - Average value per job
- `total_cost` - Sum of actual costs from completed jobs
- `gross_margin_percent` - (Revenue - Cost) / Revenue * 100
- `variance_count` - Count of jobs where actual cost > quoted by >10%
- `total_jobs` - Total number of jobs
- `quoted_sqm` - Total square metres quoted
- `installed_sqm` - Total square metres actually installed

**Data Sources:**
- `quotes` table - Quote data with status and values
- `jobs` table - Job completion and cost data
- `quote_sections` & `quote_items` - Material quantities

## 🚀 Installation & Setup

### Step 1: Run the SQL Migration

Execute the migration file in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251208_analytics_regional_view.sql
```

This creates:
- The `analytics_monthly_regional` view
- Required indexes for performance
- Proper aggregations and calculations

### Step 2: Access the Dashboard

Navigate to: `/dashboard/analytics`

### Step 3: Select Regions and Date Range

1. Click the "Regions" filter button
2. Select regions you want to compare (e.g., West Auckland vs Rodney)
3. Choose a date range from the dropdown
4. View the comparative analysis

## 🎨 UI Components

### Files Created:

```
src/
├── app/
│   └── dashboard/
│       └── analytics/
│           └── page.tsx                    # Main dashboard page
├── components/
│   └── analytics/
│       ├── RegionalComparisonCards.tsx     # Regional metrics cards
│       ├── VarianceAnalysisChart.tsx       # Material variance chart
│       └── ConversionFunnelChart.tsx       # Conversion trend lines
└── hooks/
    └── useAnalytics.ts                     # Data fetching hook
```

### Component Hierarchy:

```
AnalyticsPage
├── Header (sticky)
│   ├── Title & Actions
│   ├── Date Range Selector
│   └── Region Filter
├── RegionalComparisonCards
│   └── RegionalCard (one per region)
│       ├── Revenue Metric
│       ├── Margin Metric
│       ├── Win Rate Metric
│       └── Performance Indicators
├── VarianceAnalysisChart
│   ├── Recharts BarChart
│   ├── Overage Summary
│   └── Regional Insights
├── ConversionFunnelChart
│   ├── Recharts LineChart
│   └── Trend Cards
└── Summary Stats
```

## 💡 Mock Data Mode

The dashboard includes intelligent mock data generation for development:

- **Automatic fallback:** If the SQL view doesn't exist, mock data is used
- **Realistic values:** Based on typical insulation business metrics
- **Regional variation:** Different regions have different performance
- **Time trends:** Shows growth patterns over time
- **Notification banner:** Alerts user when viewing mock data

To see real data, run the SQL migration in Supabase.

## 🔧 Customization

### Add New Regions

Edit the regions list in `page.tsx`:

```typescript
const AVAILABLE_REGIONS = [
  'West Auckland',
  'Rodney',
  'North Shore',
  'Central Auckland',
  'South Auckland',
  'East Auckland',
  'Your New Region' // Add here
];
```

### Customize Date Ranges

Edit the DATE_RANGES object in `useAnalytics.ts`:

```typescript
export const DATE_RANGES: Record<string, DateRange> = {
  last30: { start: ..., end: ..., label: 'Last 30 Days' },
  // Add custom ranges here
};
```

### Change Color Scheme

Edit region colors in `ConversionFunnelChart.tsx`:

```typescript
const REGION_COLORS: Record<string, string> = {
  'West Auckland': '#3b82f6',
  'Your Region': '#your-color'
};
```

## 📈 Performance Considerations

### Indexes Created:
- `idx_quotes_created_month` - Fast date filtering
- `idx_quotes_city` - Fast region filtering  
- `idx_jobs_created_month` - Job date queries
- `idx_jobs_city` - Job region queries
- `idx_jobs_completion_month` - Completion tracking

### Optimization Tips:
1. View is pre-aggregated for fast queries
2. Indexes support common filter combinations
3. Limit date ranges for faster loading
4. Fewer regions = faster rendering

## 🐛 Troubleshooting

### "No data available"
- Check if SQL migration was run in Supabase
- Verify quotes and jobs exist in the database
- Check that `city` field is populated on quotes/jobs
- Try selecting different regions or date ranges

### "Error fetching analytics"
- View may not exist - run the migration
- Check Supabase connection in console
- Verify RLS policies allow SELECT on view
- Mock data will be shown automatically

### Charts not rendering
- Verify Recharts is installed: `npm install recharts`
- Check browser console for errors
- Ensure data array is not empty

### Performance issues
- Reduce date range (e.g., use Last 6 Months instead of Last Year)
- Select fewer regions
- Check database query performance in Supabase dashboard
- Verify indexes are created

## 🔐 Security & Permissions

The view respects your existing RLS (Row Level Security) policies. To grant access:

```sql
-- Grant SELECT to authenticated users
GRANT SELECT ON analytics_monthly_regional TO authenticated;

-- Or for specific roles
GRANT SELECT ON analytics_monthly_regional TO service_role;
```

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop:** Full grid layout with all charts visible
- **Tablet:** 2-column card layout, full-width charts
- **Mobile:** Single column, stacked layout

## 🎯 Business Value

### Strategic Insights:
1. **Identify Winning Territories** - Which regions drive the most revenue?
2. **Spot Profit Leaks** - Which regions over-use materials?
3. **Track Improvement** - Are conversion rates improving over time?
4. **Resource Allocation** - Where to focus sales and operations?
5. **Performance Benchmarks** - Set regional targets based on winners

### Use Cases:
- **Monthly Reviews** - Compare regional performance monthly
- **Strategic Planning** - Identify growth opportunities
- **Cost Control** - Find and fix material waste
- **Sales Training** - Learn from high-conversion regions
- **Capacity Planning** - Allocate installers to high-demand areas

## 🚧 Future Enhancements

Potential additions:
- [ ] Export to PDF/Excel
- [ ] Email scheduled reports
- [ ] Custom metric builder
- [ ] Goal tracking & targets
- [ ] Team member performance drill-down
- [ ] Customer satisfaction by region
- [ ] Profit per installer analysis
- [ ] Seasonal trend analysis
- [ ] Predictive analytics
- [ ] Budget vs actual comparison

## 📞 Support

For issues or questions:
1. Check this README
2. Review the inline code comments
3. Check Supabase logs for database errors
4. Verify all files are in correct locations

---

**Built with:** Next.js 14, TypeScript, Tailwind CSS, Recharts, Supabase  
**Created:** December 8, 2025  
**Version:** 1.0.0
