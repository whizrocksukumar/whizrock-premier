-- ============================================
-- PHASE 1B QUOTES SYSTEM - TEST DATA
-- Realistic Quote Data for Dashboard Demo
-- ============================================

-- PURPOSE: Create quotes to populate:
--   1. Dashboard quote metrics (Draft/Sent/Accepted pipeline)
--   2. Quotes list page (when implemented)
--   3. Revenue and conversion calculations

-- APPROACH: Using SQL subqueries to auto-resolve UUIDs
-- Links to completed assessments automatically!

-- ============================================
-- HELPER QUERY - View Assessment IDs
-- ============================================

SELECT 
  id,
  reference_number,
  customer_name,
  status
FROM assessments
WHERE status = 'Completed'
ORDER BY reference_number;

-- ============================================
-- DRAFT QUOTES (2 records)
-- Linked to completed assessments
-- ============================================

INSERT INTO quotes (
  quote_number,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  assessment_id,
  status,
  subtotal,
  gst_amount,
  total_amount,
  margin_percentage,
  notes,
  valid_until,
  created_by,
  created_at
)
VALUES 
-- Quote for Lisa Anderson (ASS-2025-0006)
(
  'QUO-2025-0001',
  'Lisa',
  'Anderson',
  'lisa.a@email.com',
  '021-555-0106',
  '67 Remuera Road, Auckland',
  'Auckland',
  '1050',
  (SELECT id FROM assessments WHERE reference_number = 'ASS-2025-0006' LIMIT 1),
  'Draft',
  2200.00,
  330.00,
  2530.00,
  30.0,
  'Quote for R3.6 insulation. 120.5 sqm residential property. Clean installation, standard access.',
  NOW() + INTERVAL '30 days',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '2 days'
),

-- Quote for Jennifer Garcia (ASS-2025-0008)
(
  'QUO-2025-0002',
  'Jennifer',
  'Garcia',
  'jennifer.g@email.com',
  '021-555-0108',
  '91 Papanui Road, Christchurch',
  'Christchurch',
  '8053',
  (SELECT id FROM assessments WHERE reference_number = 'ASS-2025-0008' LIMIT 1),
  'Draft',
  1150.00,
  172.50,
  1322.50,
  28.0,
  'Quote includes R2.7 insulation plus moisture barrier. Conditional on customer fixing spouting first.',
  NOW() + INTERVAL '30 days',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '1 day'
);

-- ============================================
-- SENT QUOTES (2 records)
-- Awaiting customer response
-- ============================================

INSERT INTO quotes (
  quote_number,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  customer_company,
  site_address,
  city,
  postcode,
  assessment_id,
  status,
  quote_date,
  subtotal,
  gst_amount,
  total_amount,
  margin_percentage,
  notes,
  valid_until,
  created_by,
  created_at
)
VALUES 
-- Quote for Robert Martinez (ASS-2025-0007) - Commercial
(
  'QUO-2025-0003',
  'Robert',
  'Martinez',
  'rob.martinez@email.com',
  '021-555-0107',
  'Martinez Construction',
  '34 Lambton Quay, Wellington',
  'Wellington',
  '6011',
  (SELECT id FROM assessments WHERE reference_number = 'ASS-2025-0007' LIMIT 1),
  'Sent',
  '2025-11-25',
  8000.00,
  1200.00,
  9200.00,
  32.0,
  'Commercial quote for 350 sqm. Includes removal of old insulation and installation of R2.7 polyester batts. After-hours installation.',
  '2025-12-25',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '10 days'
),

-- Quote for Amanda White (ASS-2025-0010) - New Build
(
  'QUO-2025-0004',
  'Amanda',
  'White',
  'amanda.white@email.com',
  '021-555-0110',
  NULL,
  '123 Victoria Street, Hamilton',
  'Hamilton',
  '3204',
  (SELECT id FROM assessments WHERE reference_number = 'ASS-2025-0010' LIMIT 1),
  'Sent',
  '2025-12-02',
  1270.00,
  190.50,
  1460.50,
  29.0,
  'New build insulation. R2.7 polyester for building consent compliance. Quick turnaround requested.',
  '2026-01-02',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '3 days'
);

-- ============================================
-- ACCEPTED/WON QUOTES (4 records)
-- Ready to convert to jobs
-- ============================================

INSERT INTO quotes (
  quote_number,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  status,
  quote_date,
  accepted_date,
  subtotal,
  gst_amount,
  total_amount,
  margin_percentage,
  notes,
  valid_until,
  created_by,
  created_at
)
VALUES 
-- Standalone quote (no assessment)
(
  'QUO-2025-0005',
  'James',
  'Thompson',
  'james.t@email.com',
  '021-555-0113',
  '234 Great South Road, Auckland',
  'Auckland',
  '2102',
  'Accepted',
  '2025-11-10',
  '2025-11-15',
  9200.00,
  1380.00,
  10580.00,
  31.0,
  'Residential retrofit. R3.6 polyester. 130 sqm. Customer referred by previous client.',
  '2025-12-10',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '25 days'
),

(
  'QUO-2025-0006',
  'Michelle',
  'Davis',
  'michelle.d@email.com',
  '021-555-0114',
  '89 Riccarton Road, Christchurch',
  'Christchurch',
  '8011',
  'Accepted',
  '2025-11-12',
  '2025-11-18',
  15600.00,
  2340.00,
  17940.00,
  30.0,
  'New development - 3 townhouses. R2.7 throughout. Large project approved.',
  '2025-12-12',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '23 days'
),

(
  'QUO-2025-0007',
  'Christopher',
  'Moore',
  'chris.moore@email.com',
  '021-555-0115',
  '56 Parnell Road, Auckland',
  'Auckland',
  '1052',
  'Won',
  '2025-11-05',
  '2025-11-08',
  12400.00,
  1860.00,
  14260.00,
  33.0,
  'Heritage home insulation upgrade. Special care required. R2.4 glasswool. Heritage consent obtained.',
  '2025-12-05',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '30 days'
),

(
  'QUO-2025-0008',
  'Karen',
  'Wilson',
  'karen.w@email.com',
  '021-555-0116',
  '178 The Terrace, Wellington',
  'Wellington',
  '6011',
  'Won',
  '2025-10-28',
  '2025-11-01',
  22500.00,
  3375.00,
  25875.00,
  29.0,
  'Commercial office refit. 280 sqm. R2.7 polyester with acoustic properties. Premium project.',
  '2025-11-28',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '37 days'
);

-- ============================================
-- REJECTED/LOST QUOTES (2 records)
-- ============================================

INSERT INTO quotes (
  quote_number,
  customer_first_name,
  customer_last_name,
  customer_email,
  customer_phone,
  site_address,
  city,
  postcode,
  status,
  quote_date,
  subtotal,
  gst_amount,
  total_amount,
  notes,
  valid_until,
  created_by,
  created_at
)
VALUES 
(
  'QUO-2025-0009',
  'Steven',
  'Young',
  'steven.y@email.com',
  '021-555-0117',
  '99 Broadway, Newmarket',
  'Auckland',
  '1023',
  'Rejected',
  '2025-10-20',
  8500.00,
  1275.00,
  9775.00,
  'Customer chose competitor with lower price. Lost on price alone.',
  '2025-11-20',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '45 days'
),

(
  'QUO-2025-0010',
  'Nancy',
  'King',
  'nancy.k@email.com',
  '021-555-0118',
  '234 Main Road, Tauranga',
  'Tauranga',
  '3110',
  'Lost',
  '2025-10-15',
  6800.00,
  1020.00,
  7820.00,
  'Customer decided not to proceed with project. Budget constraints.',
  '2025-11-15',
  (SELECT id FROM team_members WHERE role = 'Virtual Assistant' LIMIT 1),
  NOW() - INTERVAL '50 days'
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count quotes by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_value
FROM quotes
GROUP BY status
ORDER BY status;

-- View all quotes with assessment links
SELECT 
  q.quote_number,
  q.customer_first_name || ' ' || q.customer_last_name as customer,
  q.status,
  q.total_amount,
  a.reference_number as assessment_ref
FROM quotes q
LEFT JOIN assessments a ON q.assessment_id = a.id
ORDER BY q.created_at DESC;

-- Pipeline summary
SELECT 
  'Total Quotes' as metric,
  COUNT(*) as count,
  SUM(total_amount) as value
FROM quotes
UNION ALL
SELECT 
  'Draft',
  COUNT(*),
  SUM(total_amount)
FROM quotes WHERE status = 'Draft'
UNION ALL
SELECT 
  'Sent',
  COUNT(*),
  SUM(total_amount)
FROM quotes WHERE status = 'Sent'
UNION ALL
SELECT 
  'Accepted/Won',
  COUNT(*),
  SUM(total_amount)
FROM quotes WHERE status IN ('Accepted', 'Won');

-- ============================================
-- SUCCESS CRITERIA
-- ============================================

/*
After running this script, you should have:

✅ 10 total quotes created
✅ 2 Draft quotes ($3,852.50)
✅ 2 Sent quotes ($10,660.50)
✅ 4 Accepted/Won quotes ($68,655)
✅ 2 Rejected/Lost quotes ($17,595)
✅ 4 quotes linked to completed assessments
✅ Realistic quote values and margins
✅ Various customer types and project sizes

DASHBOARD METRICS WILL SHOW:
- Total Quote Value: ~$100,763
- Won Pipeline Value: $68,655
- Conversion Rate: 40% (4 won out of 10 total)
- Pipeline by stage: Draft → Sent → Won

NEXT FILE TO RUN:
- scripts/insert_test_jobs.sql (to create jobs from accepted quotes)
*/
