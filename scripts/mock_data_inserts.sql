-- ============================================
-- PREMIER INSULATION MOCK DATA
-- Complete Testing Scenarios
-- ============================================

/* 
PREREQUISITES:
1. Customers already imported from Processed_Customer_Contacts.xlsx
2. Products table populated with insulation products
3. Team members (installers) already created
4. Regions configured (Auckland, Wellington, Christchurch, Tauranga)

ASSUMPTIONS FOR THIS MOCK DATA:
- Using typical customer IDs: Replace with actual IDs from your customers table
- Using typical product IDs: Replace with actual IDs from your products table
- Using typical team_member IDs: Replace with actual IDs from your team_members table
- Using typical region IDs: Replace with actual IDs from your regions table
*/

-- ============================================
-- 1. ASSESSMENTS TABLE (12 records)
-- ============================================

/* SCHEDULED ASSESSMENTS (5 records) - Ready for VA to create recommendations */

INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, created_at)
VALUES 
('ASS-2025-0001', 'John Smith', 'john.smith@email.com', '021-555-0101', '15 Queen Street, Auckland CBD', 'Auckland', '1010', '2025-12-10', '09:00', 'INSTALLER_ID_1', 'Scheduled', 'Customer prefers morning appointments. Access via main entrance.', NOW()),
('ASS-2025-0002', 'Sarah Johnson', 'sarah.j@email.com', '021-555-0102', '42 Willis Street, Wellington Central', 'Wellington', '6011', '2025-12-11', '14:00', 'INSTALLER_ID_2', 'Scheduled', 'Large commercial property. Bring ladder access equipment.', NOW()),
('ASS-2025-0003', 'Michael Brown', 'mbrown@email.com', '021-555-0103', '88 Riccarton Road, Christchurch', 'Christchurch', '8011', '2025-12-12', '10:30', 'INSTALLER_ID_3', 'Scheduled', 'New build project. Coordinate with site manager.', NOW()),
('ASS-2025-0004', 'Emma Wilson', 'emma.wilson@email.com', '021-555-0104', '23 Cameron Road, Tauranga', 'Tauranga', '3110', '2025-12-13', '11:00', 'INSTALLER_ID_1', 'Scheduled', 'Renovation project. Asbestos testing completed - all clear.', NOW()),
('ASS-2025-0005', 'David Taylor', 'dtaylor@email.com', '021-555-0105', '156 Ponsonby Road, Auckland', 'Auckland', '1011', '2025-12-16', '08:30', 'INSTALLER_ID_2', 'Scheduled', 'Heritage building. Special care required for existing structure.', NOW());

/* COMPLETED ASSESSMENTS (5 records) - Ready to be converted to quotes */
/* Note: These include completion fields that may not exist yet in Phase 1A schema - add columns to assessments table if needed */

INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, completed_at, created_at)
VALUES 
('ASS-2025-0006', 'Lisa Anderson', 'lisa.a@email.com', '021-555-0106', '67 Remuera Road, Auckland', 'Auckland', '1050', '2025-11-20', '09:00', 'INSTALLER_ID_1', 'Completed', 'Standard residential assessment. Clean crawl space. Easy access. Recommend R3.6 polyester. Assessment completed successfully. Customer interested in proceeding with quote.', '2025-11-20 11:30:00', NOW() - INTERVAL '15 days'),
('ASS-2025-0007', 'Robert Martinez', 'rob.martinez@email.com', '021-555-0107', '34 Lambton Quay, Wellington', 'Wellington', '6011', '2025-11-22', '13:00', 'INSTALLER_ID_2', 'Completed', 'Commercial office building. Office building with suspended ceiling. Old insulation needs removal. Access during business hours only. Large commercial job. Quoted for polyester batts. Customer requested expedited timeline.', '2025-11-22 15:45:00', NOW() - INTERVAL '13 days'),
('ASS-2025-0008', 'Jennifer Garcia', 'jennifer.g@email.com', '021-555-0108', '91 Papanui Road, Christchurch', 'Christchurch', '8053', '2025-11-25', '10:00', 'INSTALLER_ID_3', 'Completed', 'Post-earthquake renovation. Some moisture present. Recommend moisture barrier installation. Customer approved budget up to $8,000. Recommended R2.7 with vapor barrier. Customer ready to proceed.', '2025-11-25 12:15:00', NOW() - INTERVAL '10 days'),
('ASS-2025-0009', 'Daniel Lee', 'dan.lee@email.com', '021-555-0109', '78 The Strand, Tauranga', 'Tauranga', '3110', '2025-11-28', '14:30', 'INSTALLER_ID_1', 'Completed', 'Investment property insulation upgrade. Tight crawl space. Old fiberglass needs removal. Recommend full replacement with polyester. Challenging access but doable. Quoted for removal and new installation. Customer considering options.', '2025-11-28 16:45:00', NOW() - INTERVAL '7 days'),
('ASS-2025-0010', 'Amanda White', 'amanda.white@email.com', '021-555-0110', '123 Victoria Street, Hamilton', 'Hamilton', '3204', '2025-12-01', '09:30', 'INSTALLER_ID_2', 'Completed', 'New build final insulation. New construction. Clean site. Standard residential install. Customer wants R2.7 minimum for building consent. Perfect conditions for installation. Customer ready to book immediately.', '2025-12-01 11:00:00', NOW() - INTERVAL '4 days');

/* CANCELLED ASSESSMENTS (2 records) */

INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, created_at)
VALUES 
('ASS-2025-0011', 'Thomas Harris', 'thomas.h@email.com', '021-555-0111', '45 High Street, Auckland', 'Auckland', '1010', '2025-11-15', '10:00', 'INSTALLER_ID_3', 'Cancelled', 'Customer decided to postpone project until next year.', NOW() - INTERVAL '20 days'),
('ASS-2025-0012', 'Patricia Clark', 'patricia.c@email.com', '021-555-0112', '67 Cuba Street, Wellington', 'Wellington', '6011', '2025-11-18', '15:00', 'INSTALLER_ID_1', 'Cancelled', 'Property sold before assessment. New owners will arrange own assessment.', NOW() - INTERVAL '17 days');


-- ============================================
-- 2. QUOTES TABLE (10 records)
-- ============================================

/* DRAFT QUOTES (2 records) - Linked to completed assessments */

INSERT INTO quotes (quote_number, customer_first_name, customer_last_name, customer_email, customer_phone, customer_company, site_address, region, postcode, assessment_id, status, subtotal, gst_amount, total_amount, margin_percentage, notes, valid_until, created_by, created_at)
VALUES 
('QUO-2025-0001', 'Lisa', 'Anderson', 'lisa.a@email.com', '021-555-0106', NULL, '67 Remuera Road, Auckland', 'Auckland', '1050', 'ASS-2025-0006', 'Draft', 8925.00, 1338.75, 10263.75, 30.0, 'Quote for R3.6 polyester insulation. 120.5 sqm residential property.', NOW() + INTERVAL '30 days', 'VA Team', NOW() - INTERVAL '2 days'),
('QUO-2025-0002', 'Jennifer', 'Garcia', 'jennifer.g@email.com', '021-555-0108', NULL, '91 Papanui Road, Christchurch', 'Christchurch', '8053', 'ASS-2025-0008', 'Draft', 7650.00, 1147.50, 8797.50, 28.0, 'Quote includes R2.7 insulation plus vapor barrier for moisture protection.', NOW() + INTERVAL '30 days', 'VA Team', NOW() - INTERVAL '1 day');

/* SENT TO CUSTOMER (2 records) - Awaiting response */

INSERT INTO quotes (quote_number, customer_first_name, customer_last_name, customer_email, customer_phone, customer_company, site_address, region, postcode, assessment_id, status, quote_date, subtotal, gst_amount, total_amount, margin_percentage, notes, valid_until, created_by, created_at)
VALUES 
('QUO-2025-0003', 'Robert', 'Martinez', 'rob.martinez@email.com', '021-555-0107', 'Martinez Construction', '34 Lambton Quay, Wellington', 'Wellington', '6011', 'ASS-2025-0007', 'Sent', '2025-11-25', 28750.00, 4312.50, 33062.50, 32.0, 'Commercial quote for 350 sqm. Includes removal of old insulation and installation of R2.7 polyester batts.', '2025-12-25', 'VA Team', NOW() - INTERVAL '10 days'),
('QUO-2025-0004', 'Amanda', 'White', 'amanda.white@email.com', '021-555-0110', NULL, '123 Victoria Street, Hamilton', 'Auckland', '3204', 'ASS-2025-0010', 'Sent', '2025-12-02', 10875.00, 1631.25, 12506.25, 29.0, 'New build insulation. R2.7 polyester for building consent compliance.', '2026-01-02', 'VA Team', NOW() - INTERVAL '3 days');

/* ACCEPTED/WON (4 records) - Ready to convert to jobs */

INSERT INTO quotes (quote_number, customer_first_name, customer_last_name, customer_email, customer_phone, customer_company, site_address, region, postcode, assessment_id, status, quote_date, accepted_date, subtotal, gst_amount, total_amount, margin_percentage, notes, valid_until, created_by, created_at)
VALUES 
('QUO-2025-0005', 'James', 'Thompson', 'james.t@email.com', '021-555-0113', NULL, '234 Great South Road, Auckland', 'Auckland', '2102', NULL, 'Accepted', '2025-11-10', '2025-11-15', 9200.00, 1380.00, 10580.00, 31.0, 'Residential retrofit. R3.6 polyester. 130 sqm.', '2025-12-10', 'VA Team', NOW() - INTERVAL '25 days'),
('QUO-2025-0006', 'Michelle', 'Davis', 'michelle.d@email.com', '021-555-0114', 'Davis Homes', '89 Riccarton Road, Christchurch', 'Christchurch', '8011', NULL, 'Accepted', '2025-11-12', '2025-11-18', 15600.00, 2340.00, 17940.00, 30.0, 'New development - 3 townhouses. R2.7 throughout.', '2025-12-12', 'VA Team', NOW() - INTERVAL '23 days'),
('QUO-2025-0007', 'Christopher', 'Moore', 'chris.moore@email.com', '021-555-0115', NULL, '56 Parnell Road, Auckland', 'Auckland', '1052', NULL, 'Won', '2025-11-05', '2025-11-08', 12400.00, 1860.00, 14260.00, 33.0, 'Heritage home insulation upgrade. Special care required. R2.4 glasswool.', '2025-12-05', 'VA Team', NOW() - INTERVAL '30 days'),
('QUO-2025-0008', 'Karen', 'Wilson', 'karen.w@email.com', '021-555-0116', 'Wilson Developments', '178 The Terrace, Wellington', 'Wellington', '6011', NULL, 'Won', '2025-10-28', '2025-11-01', 22500.00, 3375.00, 25875.00, 29.0, 'Commercial office refit. 280 sqm. R2.7 polyester with acoustic properties.', '2025-11-28', 'VA Team', NOW() - INTERVAL '37 days');

/* REJECTED/LOST (2 records) */

INSERT INTO quotes (quote_number, customer_first_name, customer_last_name, customer_email, customer_phone, site_address, region, postcode, status, quote_date, subtotal, gst_amount, total_amount, notes, valid_until, created_by, created_at)
VALUES 
('QUO-2025-0009', 'Steven', 'Young', 'steven.y@email.com', '021-555-0117', '99 Broadway, Newmarket', 'Auckland', '1023', 'Rejected', '2025-10-20', 8500.00, 1275.00, 9775.00, 'Customer chose competitor with lower price.', '2025-11-20', 'VA Team', NOW() - INTERVAL '45 days'),
('QUO-2025-0010', 'Nancy', 'King', 'nancy.k@email.com', '021-555-0118', '234 Main Road, Tauranga', 'Tauranga', '3110', 'Lost', '2025-10-15', 6800.00, 1020.00, 7820.00, 'Customer decided not to proceed with project.', '2025-11-15', 'VA Team', NOW() - INTERVAL '50 days');


-- ============================================
-- 3. QUOTE LINE ITEMS (for each quote)
-- ============================================

/* Quote QUO-2025-0001 - Lisa Anderson */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0001', 'PRODUCT_ID_R36', 'R3.6 150mm Polyester Insulation', 120.5, 'sqm', 55.00, 6627.50, 1),
('QUO-2025-0001', NULL, 'Labour - Installation', 1.0, 'job', 2297.50, 2297.50, 2);

/* Quote QUO-2025-0002 - Jennifer Garcia */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0002', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation', 95.0, 'sqm', 48.00, 4560.00, 1),
('QUO-2025-0002', 'PRODUCT_ID_VAPOR', 'Vapor Barrier Installation', 95.0, 'sqm', 12.00, 1140.00, 2),
('QUO-2025-0002', NULL, 'Labour - Installation', 1.0, 'job', 1950.00, 1950.00, 3);

/* Quote QUO-2025-0003 - Robert Martinez (Commercial) */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0003', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation', 350.0, 'sqm', 52.00, 18200.00, 1),
('QUO-2025-0003', NULL, 'Removal of Existing Insulation', 350.0, 'sqm', 15.00, 5250.00, 2),
('QUO-2025-0003', NULL, 'Labour - Commercial Installation', 1.0, 'job', 5300.00, 5300.00, 3);

/* Quote QUO-2025-0004 - Amanda White */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0004', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation', 145.0, 'sqm', 50.00, 7250.00, 1),
('QUO-2025-0004', NULL, 'Labour - New Build Installation', 1.0, 'job', 3625.00, 3625.00, 2);

/* Quote QUO-2025-0005 - James Thompson (ACCEPTED) */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0005', 'PRODUCT_ID_R36', 'R3.6 150mm Polyester Insulation', 130.0, 'sqm', 54.00, 7020.00, 1),
('QUO-2025-0005', NULL, 'Labour - Retrofit Installation', 1.0, 'job', 2180.00, 2180.00, 2);

/* Quote QUO-2025-0006 - Michelle Davis (ACCEPTED) */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0006', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation', 285.0, 'sqm', 46.00, 13110.00, 1),
('QUO-2025-0006', NULL, 'Labour - Multi-Unit Installation', 1.0, 'job', 2490.00, 2490.00, 2);

/* Quote QUO-2025-0007 - Christopher Moore (WON) */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0007', 'PRODUCT_ID_R24', 'R2.4 90mm Glasswool Insulation', 160.0, 'sqm', 58.00, 9280.00, 1),
('QUO-2025-0007', NULL, 'Labour - Heritage Home Specialist Installation', 1.0, 'job', 3120.00, 3120.00, 2);

/* Quote QUO-2025-0008 - Karen Wilson (WON) */
INSERT INTO quote_line_items (quote_id, product_id, description, quantity, unit, unit_price, line_total, item_order)
VALUES 
('QUO-2025-0008', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation (Acoustic)', 280.0, 'sqm', 60.00, 16800.00, 1),
('QUO-2025-0008', NULL, 'Labour - Commercial Installation', 1.0, 'job', 5700.00, 5700.00, 2);


-- ============================================
-- 4. JOBS TABLE (6 records)
-- ============================================

/* SCHEDULED JOBS (2 records) - Future dates */

INSERT INTO jobs (job_number, quote_id, customer_first_name, customer_last_name, customer_email, customer_phone, customer_company, site_address, region, postcode, status, scheduled_date, scheduled_time, crew_lead_id, crew_member_ids, quoted_amount, notes, created_at)
VALUES 
('JOB-2025-0001', 'QUO-2025-0005', 'James', 'Thompson', 'james.t@email.com', '021-555-0113', NULL, '234 Great South Road, Auckland', 'Auckland', '2102', 'Scheduled', '2025-12-15', '08:00', 'INSTALLER_ID_1', ARRAY['INSTALLER_ID_2'], 10580.00, 'Residential retrofit. Customer will be home. Park in driveway.', NOW()),
('JOB-2025-0002', 'QUO-2025-0006', 'Michelle', 'Davis', 'michelle.d@email.com', '021-555-0114', 'Davis Homes', '89 Riccarton Road, Christchurch', 'Christchurch', '8011', 'Scheduled', '2025-12-18', '07:30', 'INSTALLER_ID_3', ARRAY['INSTALLER_ID_1', 'INSTALLER_ID_2'], 17940.00, 'New development. 3 townhouses. Site access via main gate. Site manager: Tom - 027-123-4567', NOW());

/* IN PROGRESS JOB (1 record) */

INSERT INTO jobs (job_number, quote_id, customer_first_name, customer_last_name, customer_email, customer_phone, site_address, region, postcode, status, scheduled_date, scheduled_time, actual_start_date, crew_lead_id, crew_member_ids, quoted_amount, notes, created_at)
VALUES 
('JOB-2025-0003', 'QUO-2025-0007', 'Christopher', 'Moore', 'chris.moore@email.com', '021-555-0115', '56 Parnell Road, Auckland', 'Auckland', '1052', 'In Progress', '2025-12-05', '08:30', '2025-12-05', 'INSTALLER_ID_2', ARRAY['INSTALLER_ID_3'], 14260.00, 'Heritage home. Day 1 of 2. Extra care with existing structure. Customer requested daily updates.', NOW() - INTERVAL '5 hours');

/* COMPLETED JOBS (3 records) */

INSERT INTO jobs (job_number, quote_id, customer_first_name, customer_last_name, customer_email, customer_phone, customer_company, site_address, region, postcode, status, scheduled_date, scheduled_time, actual_start_date, completion_date, crew_lead_id, crew_member_ids, quoted_amount, actual_cost, notes, completion_notes, created_at)
VALUES 
('JOB-2025-0004', 'QUO-2025-0008', 'Karen', 'Wilson', 'karen.w@email.com', '021-555-0116', 'Wilson Developments', '178 The Terrace, Wellington', 'Wellington', '6011', 'Completed', '2025-11-15', '07:00', '2025-11-15', '2025-11-16', 'INSTALLER_ID_1', ARRAY['INSTALLER_ID_2', 'INSTALLER_ID_3'], 25875.00, 23450.00, 'Commercial office refit. After-hours installation. 2-day job.', 'Job completed successfully. Customer very satisfied. Building manager signed off. Minor material savings due to efficient layout. Ready for invoicing.', NOW() - INTERVAL '20 days'),
('JOB-2025-0005', NULL, 'Brian', 'Scott', 'brian.s@email.com', '021-555-0119', NULL, '45 Beach Road, Auckland', 'Auckland', '1010', 'Completed', '2025-11-08', '09:00', '2025-11-08', '2025-11-08', 'INSTALLER_ID_2', ARRAY['INSTALLER_ID_1'], 8950.00, 8200.00, 'Small residential job. No formal quote (under $10k).', 'Standard installation. Customer paid on completion. All paperwork filed.', NOW() - INTERVAL '27 days'),
('JOB-2025-0006', NULL, 'Laura', 'Green', 'laura.green@email.com', '021-555-0120', 'Green Properties', '123 High Street, Christchurch', 'Christchurch', '8011', 'Completed', '2025-10-25', '08:00', '2025-10-25', '2025-10-26', 'INSTALLER_ID_3', ARRAY['INSTALLER_ID_2'], 18750.00, 17850.00, 'Rental property insulation. 2-unit duplex.', 'Both units completed. Tenant coordination went smoothly. Minor material savings. Photos uploaded. Certificate of compliance issued. Ready for final invoicing.', NOW() - INTERVAL '40 days');


-- ============================================
-- 5. JOB LINE ITEMS (Actual materials used)
-- ============================================

/* JOB-2025-0003 (In Progress) - Christopher Moore */
INSERT INTO job_line_items (job_id, product_id, description, quoted_quantity, actual_quantity, unit, unit_price, line_total, item_order)
VALUES 
('JOB-2025-0003', 'PRODUCT_ID_R24', 'R2.4 90mm Glasswool Insulation', 160.0, 165.0, 'sqm', 58.00, 9570.00, 1),
('JOB-2025-0003', NULL, 'Labour - Heritage Home Installation', 1.0, 1.0, 'job', 3120.00, 3120.00, 2);

/* JOB-2025-0004 (Completed) - Karen Wilson */
INSERT INTO job_line_items (job_id, product_id, description, quoted_quantity, actual_quantity, unit, unit_price, line_total, item_order)
VALUES 
('JOB-2025-0004', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation (Acoustic)', 280.0, 275.0, 'sqm', 60.00, 16500.00, 1),
('JOB-2025-0004', NULL, 'Labour - Commercial Installation', 1.0, 1.0, 'job', 5700.00, 5700.00, 2),
('JOB-2025-0004', NULL, 'Additional scaffolding rental', 1.0, 1.0, 'job', 1250.00, 1250.00, 3);

/* JOB-2025-0005 (Completed) - Brian Scott */
INSERT INTO job_line_items (job_id, product_id, description, quoted_quantity, actual_quantity, unit, unit_price, line_total, item_order)
VALUES 
('JOB-2025-0005', 'PRODUCT_ID_R36', 'R3.6 150mm Polyester Insulation', 110.0, 108.0, 'sqm', 55.00, 5940.00, 1),
('JOB-2025-0005', NULL, 'Labour - Standard Installation', 1.0, 1.0, 'job', 2260.00, 2260.00, 2);

/* JOB-2025-0006 (Completed) - Laura Green */
INSERT INTO job_line_items (job_id, product_id, description, quoted_quantity, actual_quantity, unit, unit_price, line_total, item_order)
VALUES 
('JOB-2025-0006', 'PRODUCT_ID_R27', 'R2.7 120mm Polyester Insulation', 220.0, 215.0, 'sqm', 50.00, 10750.00, 1),
('JOB-2025-0006', NULL, 'Labour - Dual Unit Installation', 1.0, 1.0, 'job', 4100.00, 4100.00, 2),
('JOB-2025-0006', NULL, 'Additional access equipment rental', 1.0, 1.0, 'job', 3000.00, 3000.00, 3);


-- ============================================
-- NOTES FOR USING THIS MOCK DATA:
-- ============================================

/*
BEFORE RUNNING:
1. Replace all INSTALLER_ID_X with actual team_member IDs from your team_members table
2. Replace all PRODUCT_ID_XXX with actual product IDs from your products table
3. Replace all assessment_id references (ASS-2025-XXXX) with actual UUIDs after assessments are inserted
4. Replace all quote_id references (QUO-2025-XXXX) with actual UUIDs after quotes are inserted
5. Replace all job_id references (JOB-2025-XXXX) with actual UUIDs after jobs are inserted

RECOMMENDED ORDER:
1. Insert ASSESSMENTS first
2. Query to get assessment UUIDs
3. Update quote INSERT statements with actual assessment UUIDs
4. Insert QUOTES
5. Query to get quote UUIDs
6. Insert QUOTE_LINE_ITEMS with actual quote UUIDs
7. Update job INSERT statements with actual quote UUIDs
8. Insert JOBS
9. Query to get job UUIDs
10. Insert JOB_LINE_ITEMS with actual job UUIDs

TESTING SCENARIOS COVERED:
✓ Scheduled assessments ready for VA recommendations
✓ Completed assessments ready for quoting
✓ Draft quotes in progress
✓ Sent quotes awaiting customer response
✓ Accepted quotes ready for job scheduling
✓ Scheduled jobs with future dates
✓ In-progress jobs
✓ Completed jobs ready for invoicing
✓ Quote and job line items with realistic pricing
✓ Various regions, customer types, and job sizes
✓ Realistic material usage (actual vs quoted)
*/
