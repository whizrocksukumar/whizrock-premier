-- ============================================
-- PHASE 1B JOBS SYSTEM - TEST DATA
-- Realistic Job Data for Dashboard Demo
-- ============================================

-- PURPOSE: Create jobs from accepted quotes:
--   1. Dashboard job metrics (Active/Completed counts)
--   2. Revenue calculation from completed jobs
--   3. Upcoming jobs calendar view
--   4. Jobs list page (when implemented)

-- APPROACH: Using SQL subqueries to link to accepted quotes
-- Links to team_members for crew assignments

-- ============================================
-- HELPER QUERY - View Quote IDs
-- ============================================

SELECT 
  id,
  quote_number,
  customer_first_name || ' ' || customer_last_name as customer,
  status,
  total_amount
FROM quotes
WHERE status IN ('Accepted', 'Won')
ORDER BY quote_number;

-- ============================================
-- COMPLETED JOBS (3 records)
-- Contribute to Total Revenue metric
-- ============================================

INSERT INTO jobs (
  job_number,
  quote_id,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  status,
  scheduled_date,
  start_date,
  completion_date,
  quoted_amount,
  actual_cost,
  crew_lead_id,
  notes,
  created_at
)
VALUES 
-- Job from QUO-2025-0005 (James Thompson)
(
  'JOB-2025-0001',
  (SELECT id FROM quotes WHERE quote_number = 'QUO-2025-0005' LIMIT 1),
  'James',
  'Thompson',
  'james.t@email.com',
  '021-555-0113',
  '234 Great South Road, Auckland',
  'Auckland',
  '2102',
  'Completed',
  '2025-11-18',
  '2025-11-18',
  '2025-11-19',
  10580.00,
  9850.00,
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1),
  'Job completed successfully. Customer very satisfied. R3.6 polyester installed to spec. Minor variation: additional work in living room (+$450).',
  NOW() - INTERVAL '18 days'
),

-- Job from QUO-2025-0007 (Christopher Moore - Heritage home)
(
  'JOB-2025-0002',
  (SELECT id FROM quotes WHERE quote_number = 'QUO-2025-0007' LIMIT 1),
  'Christopher',
  'Moore',
  'chris.moore@email.com',
  '021-555-0115',
  '56 Parnell Road, Auckland',
  'Auckland',
  '1052',
  'Completed',
  '2025-11-12',
  '2025-11-12',
  '2025-11-14',
  14260.00,
  13890.00,
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1),
  'Heritage property - extra care taken. 3 days work. R2.4 glasswool installed. Heritage inspector approved. No variations.',
  NOW() - INTERVAL '24 days'
),

-- Job from QUO-2025-0008 (Karen Wilson - Commercial)
(
  'JOB-2025-0003',
  (SELECT id FROM quotes WHERE quote_number = 'QUO-2025-0008' LIMIT 1),
  'Karen',
  'Wilson',
  'karen.w@email.com',
  '021-555-0116',
  '178 The Terrace, Wellington',
  'Wellington',
  '6011',
  'Completed',
  '2025-11-05',
  '2025-11-05',
  '2025-11-08',
  25875.00,
  24100.00,
  (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1),
  'Large commercial project. 4 days. R2.7 polyester acoustic. After-hours work (evenings). Building manager praised quality. Variation: additional fire-rated batts (+$800).',
  NOW() - INTERVAL '32 days'
);

-- ============================================
-- IN PROGRESS JOB (1 record)
-- Currently active
-- ============================================

INSERT INTO jobs (
  job_number,
  quote_id,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  status,
  scheduled_date,
  start_date,
  quoted_amount,
  crew_lead_id,
  notes,
  created_at
)
VALUES 
-- Job from QUO-2025-0006 (Michelle Davis - 3 townhouses)
(
  'JOB-2025-0004',
  (SELECT id FROM quotes WHERE quote_number = 'QUO-2025-0006' LIMIT 1),
  'Michelle',
  'Davis',
  'michelle.d@email.com',
  '021-555-0114',
  '89 Riccarton Road, Christchurch',
  'Christchurch',
  '8011',
  'In Progress',
  '2025-12-03',
  '2025-12-03',
  17940.00,
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1),
  'Large project - 3 townhouses. Day 3 of 5. R2.7 polyester. Unit 1 complete, Unit 2 80% done, Unit 3 starting tomorrow. On schedule.',
  NOW() - INTERVAL '2 days'
);

-- ============================================
-- SCHEDULED JOBS (2 records)
-- Future jobs for calendar view
-- ============================================

INSERT INTO jobs (
  job_number,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  status,
  scheduled_date,
  quoted_amount,
  crew_lead_id,
  notes,
  created_at
)
VALUES 
-- Standalone job (no quote in system yet)
(
  'JOB-2025-0005',
  'David',
  'Brown',
  'david.brown@email.com',
  '021-555-0119',
  '45 Queen Street, Auckland',
  'Auckland',
  '1010',
  'Scheduled',
  '2025-12-15',
  11200.00,
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1),
  'Residential insulation upgrade. R3.6 polyester. 145 sqm. Customer pre-approved. Scheduled for mid-December.',
  NOW() - INTERVAL '5 days'
),

(
  'JOB-2025-0006',
  'Emma',
  'Taylor',
  'emma.taylor@email.com',
  '021-555-0120',
  '78 Victoria Avenue, Hamilton',
  'Hamilton',
  '3216',
  'Scheduled',
  '2025-12-18',
  6850.00,
  (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1),
  'Small residential job. R2.7 polyester. 95 sqm. Quick turnaround requested. Before Christmas completion.',
  NOW() - INTERVAL '3 days'
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count jobs by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(quoted_amount) as quoted_value,
  SUM(actual_cost) as actual_revenue
FROM jobs
GROUP BY status
ORDER BY status;

-- View all jobs with quote links
SELECT 
  j.job_number,
  j.customer_first_name || ' ' || j.customer_last_name as customer,
  j.status,
  j.scheduled_date,
  j.quoted_amount,
  j.actual_cost,
  q.quote_number,
  tm.first_name || ' ' || tm.last_name as crew_lead
FROM jobs j
LEFT JOIN quotes q ON j.quote_id = q.id
LEFT JOIN team_members tm ON j.crew_lead_id = tm.id
ORDER BY j.scheduled_date DESC;

-- Revenue summary
SELECT 
  'Total Jobs' as metric,
  COUNT(*) as count,
  SUM(quoted_amount) as quoted_value,
  SUM(actual_cost) as actual_revenue
FROM jobs
UNION ALL
SELECT 
  'Completed',
  COUNT(*),
  SUM(quoted_amount),
  SUM(actual_cost)
FROM jobs WHERE status = 'Completed'
UNION ALL
SELECT 
  'In Progress',
  COUNT(*),
  SUM(quoted_amount),
  NULL
FROM jobs WHERE status = 'In Progress'
UNION ALL
SELECT 
  'Scheduled',
  COUNT(*),
  SUM(quoted_amount),
  NULL
FROM jobs WHERE status = 'Scheduled';

-- Jobs with crew assignments
SELECT 
  tm.first_name || ' ' || tm.last_name as crew_lead,
  COUNT(j.id) as total_jobs,
  SUM(CASE WHEN j.status = 'Completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN j.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
  SUM(CASE WHEN j.status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
  SUM(j.actual_cost) as total_revenue
FROM jobs j
LEFT JOIN team_members tm ON j.crew_lead_id = tm.id
GROUP BY tm.first_name, tm.last_name
ORDER BY total_revenue DESC NULLS LAST;

-- ============================================
-- SUCCESS CRITERIA
-- ============================================

/*
After running this script, you should have:

✅ 6 total jobs created
✅ 3 Completed jobs (Total Revenue: $47,840)
✅ 1 In Progress job ($17,940 quoted)
✅ 2 Scheduled jobs ($18,050 quoted)
✅ 4 jobs linked to accepted quotes
✅ All jobs assigned to crew leads
✅ Realistic job timelines and notes

DASHBOARD METRICS WILL SHOW:
- Total Revenue: $47,840 (from 3 completed jobs)
- Active Jobs: 3 (1 In Progress + 2 Scheduled)
- Completed Jobs: 3
- Pipeline Value: $68,655 (from 4 accepted quotes)

REVENUE BREAKDOWN:
- JOB-2025-0001: $9,850
- JOB-2025-0002: $13,890
- JOB-2025-0003: $24,100
= Total Revenue: $47,840

UPCOMING JOBS CALENDAR:
- Dec 3: Michelle Davis (In Progress - 3 townhouses)
- Dec 15: David Brown (Scheduled - Residential)
- Dec 18: Emma Taylor (Scheduled - Small residential)

CREW WORKLOAD:
- James Thompson: 2 jobs (1 completed, 1 in progress)
- Mike Chen: 2 jobs (1 completed, 1 scheduled)
- Sarah Williams: 2 jobs (1 completed, 1 scheduled)

DEMO READY:
✅ Complete sales pipeline visible
✅ Real revenue from completed work
✅ Active jobs showing work in progress
✅ Future jobs on calendar
✅ Conversion rate calculation (4 won / 10 quotes = 40%)

EXECUTION ORDER:
1. Run scripts/insert_test_assessments.sql ✅ (Already done - 12 assessments)
2. Run scripts/insert_test_quotes.sql ⬅️ (Run this next - 10 quotes)
3. Run scripts/insert_test_jobs.sql ⬅️ (Run this last - 6 jobs)

After all three scripts, refresh dashboard to see:
- Full assessment pipeline (5 Scheduled, 5 Completed, 2 Cancelled)
- Full quote pipeline (2 Draft, 2 Sent, 4 Won, 2 Lost)
- Full job pipeline (3 Completed, 1 In Progress, 2 Scheduled)
- Real revenue metrics ($47,840)
- 40% conversion rate
*/
