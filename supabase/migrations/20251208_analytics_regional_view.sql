-- ============================================================================
-- ANALYTICS & COMPARATIVE DASHBOARD - REGIONAL VIEW
-- Created: 2025-12-08
-- Purpose: Aggregated metrics by Month and Region for strategic analysis
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS analytics_monthly_regional CASCADE;

-- Create the main analytics view
CREATE OR REPLACE VIEW analytics_monthly_regional AS
WITH regional_quotes AS (
  SELECT 
    DATE_TRUNC('month', q.created_at) AS month,
    COALESCE(q.city, 'Unknown') AS region,
    q.id AS quote_id,
    q.status,
    q.total_inc_gst AS quote_value,
    CASE 
      WHEN q.status IN ('Accepted', 'Won') THEN 1 
      ELSE 0 
    END AS is_won
  FROM quotes q
  WHERE q.created_at IS NOT NULL
),
regional_jobs AS (
  SELECT 
    DATE_TRUNC('month', j.created_at) AS month,
    COALESCE(j.city, 'Unknown') AS region,
    j.id AS job_id,
    j.quote_id,
    j.quoted_amount,
    j.actual_cost,
    j.status,
    CASE 
      WHEN j.actual_cost > (j.quoted_amount * 1.1) THEN 1
      ELSE 0
    END AS has_variance,
    -- Calculate quoted vs installed m² from quote items
    NULL::NUMERIC AS quoted_sqm,
    NULL::NUMERIC AS installed_sqm
  FROM jobs j
  WHERE j.created_at IS NOT NULL
    AND j.status IN ('Completed', 'In Progress', 'Scheduled')
),
quote_volumes AS (
  SELECT
    DATE_TRUNC('month', q.created_at) AS month,
    COALESCE(q.city, 'Unknown') AS region,
    SUM(qi.area_sqm) AS total_quoted_sqm
  FROM quotes q
  JOIN quote_sections qs ON qs.quote_id = q.id
  JOIN quote_items qi ON qi.section_id = qs.id
  WHERE q.status IN ('Accepted', 'Won')
    AND qi.area_sqm IS NOT NULL
    AND qi.is_labour = false
  GROUP BY DATE_TRUNC('month', q.created_at), COALESCE(q.city, 'Unknown')
),
job_volumes AS (
  SELECT
    DATE_TRUNC('month', j.completion_date) AS month,
    COALESCE(j.city, 'Unknown') AS region,
    -- Placeholder for actual installed m² (would need job_items table)
    COUNT(j.id) * 50.0 AS estimated_installed_sqm
  FROM jobs j
  WHERE j.status = 'Completed'
    AND j.completion_date IS NOT NULL
  GROUP BY DATE_TRUNC('month', j.completion_date), COALESCE(j.city, 'Unknown')
)
SELECT 
  rq.month,
  rq.region,
  
  -- Quote Metrics
  COUNT(DISTINCT rq.quote_id) AS total_quotes,
  SUM(rq.is_won) AS won_quotes,
  ROUND(
    CASE 
      WHEN COUNT(DISTINCT rq.quote_id) > 0 
      THEN (SUM(rq.is_won)::NUMERIC / COUNT(DISTINCT rq.quote_id)::NUMERIC) * 100
      ELSE 0 
    END, 
    2
  ) AS conversion_rate,
  
  -- Revenue Metrics
  COALESCE(SUM(CASE WHEN rq.is_won = 1 THEN rq.quote_value ELSE 0 END), 0) AS total_revenue,
  ROUND(
    COALESCE(
      SUM(CASE WHEN rq.is_won = 1 THEN rq.quote_value ELSE 0 END) / NULLIF(SUM(rq.is_won), 0),
      0
    ),
    2
  ) AS average_job_value,
  
  -- Cost & Margin Metrics (from completed jobs)
  COALESCE(SUM(rj.actual_cost), 0) AS total_cost,
  ROUND(
    CASE 
      WHEN SUM(CASE WHEN rq.is_won = 1 THEN rq.quote_value ELSE 0 END) > 0
      THEN (
        (SUM(CASE WHEN rq.is_won = 1 THEN rq.quote_value ELSE 0 END) - COALESCE(SUM(rj.actual_cost), 0)) 
        / SUM(CASE WHEN rq.is_won = 1 THEN rq.quote_value ELSE 0 END)
      ) * 100
      ELSE 0
    END,
    2
  ) AS gross_margin_percent,
  
  -- Variance Analysis
  COUNT(DISTINCT rj.job_id) FILTER (WHERE rj.has_variance = 1) AS variance_count,
  COUNT(DISTINCT rj.job_id) AS total_jobs,
  
  -- Volume Metrics (m²)
  COALESCE(qv.total_quoted_sqm, 0) AS quoted_sqm,
  COALESCE(jv.estimated_installed_sqm, 0) AS installed_sqm,
  
  -- Metadata
  NOW() AS last_updated
  
FROM regional_quotes rq
LEFT JOIN regional_jobs rj ON rj.quote_id = rq.quote_id AND rj.month = rq.month
LEFT JOIN quote_volumes qv ON qv.month = rq.month AND qv.region = rq.region
LEFT JOIN job_volumes jv ON jv.month = rq.month AND jv.region = rq.region
GROUP BY rq.month, rq.region, qv.total_quoted_sqm, jv.estimated_installed_sqm
ORDER BY rq.month DESC, rq.region;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_month ON quotes(DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_quotes_city ON quotes(city);
CREATE INDEX IF NOT EXISTS idx_jobs_created_month ON jobs(DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_completion_month ON jobs(DATE_TRUNC('month', completion_date));

-- Add comments
COMMENT ON VIEW analytics_monthly_regional IS 'Regional analytics aggregated by month for comparative dashboard';

-- Grant access (adjust based on your RLS policies)
-- GRANT SELECT ON analytics_monthly_regional TO authenticated;
