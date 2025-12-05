-- ============================================
-- PHASE 1A ASSESSMENT SYSTEM - TEST DATA
-- Comprehensive User Testing Mock Data
-- ============================================

-- PURPOSE: Create realistic test data to validate:
--   1. Assessment List page (/assessments)
--   2. Assessment Detail page (/assessments/[id])
--   3. Create Assessment page (/assessments/new)
--   4. Complete Assessment page (/assessments/[id]/complete)

-- APPROACH: Using SQL subqueries to auto-resolve UUIDs
-- No manual placeholder replacement needed!

-- ============================================
-- HELPER QUERIES (Run these to verify data)
-- ============================================

-- View installer IDs
SELECT 
  id,
  first_name || ' ' || last_name as name,
  role
FROM team_members 
WHERE role = 'Installer'
ORDER BY first_name;

-- View product samples for reference
SELECT 
  id,
  sku,
  product_description,
  r_value,
  retail_price
FROM products
ORDER BY sku
LIMIT 10;

-- ============================================
-- SCHEDULED ASSESSMENTS (5 records)
-- Future dates - Ready for VA workspace recommendations
-- ============================================

INSERT INTO assessments (
  reference_number, 
  customer_name, 
  customer_email, 
  customer_phone, 
  site_address, 
  city, 
  postcode, 
  scheduled_date, 
  scheduled_time, 
  assigned_installer_id, 
  status, 
  notes, 
  created_at
)
VALUES 
-- Auckland residential - Morning appointment
(
  'ASS-2025-0001', 
  'John Smith', 
  'john.smith@email.com', 
  '021-555-0101', 
  '15 Queen Street, Auckland CBD', 
  'Auckland', 
  '1010', 
  '2025-12-10', 
  '09:00', 
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 
  'Scheduled', 
  'Customer prefers morning appointments. Access via main entrance. Existing house built 1980s. Interested in R2.7 ceiling insulation. Customer mentioned some old insulation visible in roof space.', 
  NOW()
),

-- Wellington commercial - Afternoon slot
(
  'ASS-2025-0002', 
  'Sarah Johnson', 
  'sarah.j@email.com', 
  '021-555-0102', 
  '42 Willis Street, Wellington Central', 
  'Wellington', 
  '6011', 
  '2025-12-11', 
  '14:00', 
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 
  'Scheduled', 
  'Large commercial property. Bring ladder access equipment. 4-story office building. Customer is building manager. Access after hours preferred. Needs quote for PIL-015 (R2.7 Ceiling Blanket).', 
  NOW()
),

-- Christchurch new build - Mid-morning
(
  'ASS-2025-0003', 
  'Michael Brown', 
  'mbrown@email.com', 
  '021-555-0103', 
  '88 Riccarton Road, Christchurch', 
  'Christchurch', 
  '8011', 
  '2025-12-12', 
  '10:30', 
  (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 
  'Scheduled', 
  'New build project. Coordinate with site manager Tom (027-123-4567). Frame is up, ready for insulation assessment. Customer wants both wall (PIL-006 R2.4 90mm) and ceiling (PIL-015 R2.7) options. Building consent requires minimum R2.4 walls, R3.2 ceiling.', 
  NOW()
),

-- Tauranga renovation - Late morning
(
  'ASS-2025-0004', 
  'Emma Wilson', 
  'emma.wilson@email.com', 
  '021-555-0104', 
  '23 Cameron Road, Tauranga', 
  'Tauranga', 
  '3110', 
  '2025-12-13', 
  '11:00', 
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 
  'Scheduled', 
  'Renovation project. Asbestos testing completed - all clear. Heritage home from 1920s. Customer doing full reno. Needs assessment for wall and ceiling insulation upgrade. Interested in PIL-011 (R3.6) for ceiling. Some accessibility challenges - narrow crawl space.', 
  NOW()
),

-- Auckland heritage - Early morning
(
  'ASS-2025-0005', 
  'David Taylor', 
  'dtaylor@email.com', 
  '021-555-0105', 
  '156 Ponsonby Road, Auckland', 
  'Auckland', 
  '1011', 
  '2025-12-16', 
  '08:30', 
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 
  'Scheduled', 
  'Heritage building - listed property. Special care required for existing structure. Customer is architect overseeing heritage restoration. Needs insulation solution that meets heritage requirements and building code. Suspended ceiling with good access. Consider PIL-010 or PIL-011 options.', 
  NOW()
);

-- ============================================
-- COMPLETED ASSESSMENTS (5 records)
-- Past dates - Ready to convert to quotes
-- ============================================

INSERT INTO assessments (
  reference_number, 
  customer_name, 
  customer_email, 
  customer_phone, 
  site_address, 
  city, 
  postcode, 
  scheduled_date, 
  scheduled_time, 
  assigned_installer_id, 
  status, 
  notes, 
  completed_at, 
  created_at
)
VALUES 
-- Auckland residential - Clean job
(
  'ASS-2025-0006', 
  'Lisa Anderson', 
  'lisa.a@email.com', 
  '021-555-0106', 
  '67 Remuera Road, Auckland', 
  'Auckland', 
  '1050', 
  '2025-11-20', 
  '09:00', 
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 
  'Completed', 
  'ASSESSMENT COMPLETED: Standard residential property, 120.5 sqm ceiling area. Clean crawl space with good access (1.2m height). No existing insulation. Roof structure is timber trusses in excellent condition, no moisture issues. RECOMMENDATION: PIL-011 (R3.6 140mm Glasswool Blanket) - 121 sqm required. Est. material cost $1,062 + labour $850 = Total ~$2,200 + GST. Customer very interested, wants quote within 3 days. Follow-up: Ready for quote.', 
  '2025-11-20 11:30:00', 
  NOW() - INTERVAL '15 days'
),

-- Wellington commercial - Large job
(
  'ASS-2025-0007', 
  'Robert Martinez', 
  'rob.martinez@email.com', 
  '021-555-0107', 
  '34 Lambton Quay, Wellington', 
  'Wellington', 
  '6011', 
  '2025-11-22', 
  '13:00', 
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 
  'Completed', 
  'ASSESSMENT COMPLETED: Commercial office building, 350 sqm suspended ceiling area across 3 floors. Existing OLD fiberglass insulation from 1990s - REMOVAL REQUIRED (compressed, dusty, ~280 sqm salvageable). Good ceiling access via removable tiles. RECOMMENDATION: Remove old insulation + install PIL-015 (R2.7 Ceiling Blanket) 350 sqm. Est. removal $2,100 (350 sqm @ $6/sqm) + material $1,663 (350 sqm @ $4.75/sqm) + labour (2 crew, 3 days) $4,200 = Total ~$8,000 + GST. Customer requested expedited timeline (complete before Xmas). Installation must be after hours (6pm-11pm). Customer approved budget up to $12,000 incl GST. URGENT - Send quote ASAP.', 
  '2025-11-22 15:45:00', 
  NOW() - INTERVAL '13 days'
),

-- Christchurch post-earthquake - Moisture issue
(
  'ASS-2025-0008', 
  'Jennifer Garcia', 
  'jennifer.g@email.com', 
  '021-555-0108', 
  '91 Papanui Road, Christchurch', 
  'Christchurch', 
  '8053', 
  '2025-11-25', 
  '10:00', 
  (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 
  'Completed', 
  'ASSESSMENT COMPLETED: Post-earthquake renovation property, 95 sqm ceiling area. Some moisture present in NW corner - SOURCE IDENTIFIED: blocked spouting (advised customer to fix BEFORE insulation). Existing partial insulation ~30 sqm old fiberglass (leave in place, poor condition but dry). RECOMMENDATION: Add PIL-015 (R2.7 Ceiling Blanket) to uninsulated areas (65 sqm new) + moisture barrier recommended for NW corner (20 sqm). Est. material: 65 sqm @ $4.75 = $309 + barrier $120 + labour $680 = Total ~$1,150 + GST. Customer approved budget up to $1,800 incl GST. CONDITIONAL: Customer must fix spouting first, re-inspect in 2 weeks to confirm dry, THEN proceed. Follow-up scheduled for Dec 9.', 
  '2025-11-25 12:15:00', 
  NOW() - INTERVAL '10 days'
),

-- Tauranga investment property - Tight access
(
  'ASS-2025-0009', 
  'Daniel Lee', 
  'dan.lee@email.com', 
  '021-555-0109', 
  '78 The Strand, Tauranga', 
  'Tauranga', 
  '3110', 
  '2025-11-28', 
  '14:30', 
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 
  'Completed', 
  'ASSESSMENT COMPLETED: Investment property, 110 sqm ceiling area. CHALLENGING ACCESS - tight crawl space (0.7m height), single access point via bedroom wardrobe. Existing OLD fiberglass 60 sqm (deteriorated, compression, recommend REMOVAL). RECOMMENDATION: Remove old insulation (60 sqm @ $8/sqm tight space fee) = $480 + install PIL-011 (R3.6 140mm) 110 sqm @ $8.78 = $966 + labour (tight space, 2 crew, 2 days) $1,800 = Total ~$3,250 + GST. Customer is property investor, considering options - not urgent. Price-sensitive. Alternative: PIL-010 (R3.2) would save ~$250 but lower R-value. Customer wants both options in quote. Follow-up in 1 week.', 
  '2025-11-28 16:45:00', 
  NOW() - INTERVAL '7 days'
),

-- Hamilton new build - Perfect conditions
(
  'ASS-2025-0010', 
  'Amanda White', 
  'amanda.white@email.com', 
  '021-555-0110', 
  '123 Victoria Street, Hamilton', 
  'Hamilton', 
  '3204', 
  '2025-12-01', 
  '09:30', 
  (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 
  'Completed', 
  'ASSESSMENT COMPLETED: New construction, 145 sqm ceiling area. PERFECT CONDITIONS - new build, clean site, excellent access, no existing insulation. Timber frame, standard truss spacing. Building consent requires minimum R2.7 ceiling. RECOMMENDATION: PIL-015 (R2.7 Ceiling Blanket 120mm) 145 sqm @ $4.75 = $689 + labour (easy install, 1 crew, 1 day) $580 = Total ~$1,270 + GST. Customer is owner-builder, wants to proceed IMMEDIATELY to keep build schedule on track. Target install: Dec 8-9. URGENT QUOTE. Customer ready to book as soon as quote received.', 
  '2025-12-01 11:00:00', 
  NOW() - INTERVAL '4 days'
);

-- ============================================
-- CANCELLED ASSESSMENTS (2 records)
-- Various cancellation reasons
-- ============================================

INSERT INTO assessments (
  reference_number, 
  customer_name, 
  customer_email, 
  customer_phone, 
  site_address, 
  city, 
  postcode, 
  scheduled_date, 
  scheduled_time, 
  assigned_installer_id, 
  status, 
  notes, 
  created_at
)
VALUES 
-- Auckland postponed
(
  'ASS-2025-0011', 
  'Thomas Harris', 
  'thomas.h@email.com', 
  '021-555-0111', 
  '45 High Street, Auckland', 
  'Auckland', 
  '1010', 
  '2025-11-15', 
  '10:00', 
  (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 
  'Cancelled', 
  'Customer called on 2025-11-14 to postpone project until March 2026 due to budget constraints. No rescheduling at this time. Customer will contact us in February 2026 to book new assessment. Status: CANCELLED - Postponed by customer.', 
  NOW() - INTERVAL '20 days'
),

-- Wellington property sold
(
  'ASS-2025-0012', 
  'Patricia Clark', 
  'patricia.c@email.com', 
  '021-555-0112', 
  '67 Cuba Street, Wellington', 
  'Wellington', 
  '6011', 
  '2025-11-18', 
  '15:00', 
  (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 
  'Cancelled', 
  'Customer called on 2025-11-17 to cancel - property sold before assessment date. New owners taking possession Dec 1. Advised customer that new owners can book their own assessment if interested. Status: CANCELLED - Property sold.', 
  NOW() - INTERVAL '17 days'
);

-- ============================================
-- VERIFICATION QUERIES
-- Run these after INSERT to confirm data
-- ============================================

-- Count assessments by status
SELECT 
  status,
  COUNT(*) as count
FROM assessments
GROUP BY status
ORDER BY status;

-- View all scheduled assessments (should be 5)
SELECT 
  reference_number,
  customer_name,
  city,
  scheduled_date,
  scheduled_time,
  status
FROM assessments
WHERE status = 'Scheduled'
ORDER BY scheduled_date, scheduled_time;

-- View all completed assessments (should be 5)
SELECT 
  reference_number,
  customer_name,
  city,
  scheduled_date,
  completed_at,
  status
FROM assessments
WHERE status = 'Completed'
ORDER BY completed_at DESC;

-- View all cancelled assessments (should be 2)
SELECT 
  reference_number,
  customer_name,
  city,
  scheduled_date,
  status,
  notes
FROM assessments
WHERE status = 'Cancelled'
ORDER BY scheduled_date DESC;

-- ============================================
-- SUCCESS CRITERIA
-- ============================================

/*
After running this script, you should have:

✅ 12 total assessments created
✅ 5 Scheduled assessments (Dec 10-16, 2025)
✅ 5 Completed assessments (Nov 20-Dec 1, 2025)
✅ 2 Cancelled assessments (Nov 15-18, 2025)
✅ All using real installer IDs (no placeholders)
✅ All referencing real product SKUs in notes
✅ Realistic NZ addresses and scenarios
✅ Detailed assessment notes for testing quote creation

NEXT STEPS FOR TESTING:
1. Navigate to http://localhost:3000/assessments
2. Verify DataTable displays 12 assessments
3. Test filtering by status
4. Test sorting columns
5. Click on ASS-2025-0001 to view details
6. Click "Complete Assessment" to test completion flow
7. Create a new assessment via /assessments/new
8. Verify reference number auto-generates correctly

FUTURE MOCK DATA (Phase 2):
- Enquiries (to link assessments)
- Quotes (created from completed assessments)
- Jobs (created from accepted quotes)
*/
