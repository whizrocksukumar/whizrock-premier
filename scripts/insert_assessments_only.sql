-- ============================================
-- HELPER QUERY: Get Team Member IDs
-- Run this FIRST to get actual UUIDs to replace placeholders
-- ============================================

SELECT 
  id,
  first_name || ' ' || last_name as name,
  role,
  '-- Replace INSTALLER_ID with: ' || id as replacement_note
FROM team_members 
WHERE role = 'Installer'
ORDER BY first_name;

-- Expected output:
-- James Thompson (Installer) -> Use this UUID for INSTALLER_ID_1
-- Mike Chen (Installer) -> Use this UUID for INSTALLER_ID_2  
-- Sarah Williams (Installer) -> Use this UUID for INSTALLER_ID_3

-- ============================================
-- HELPER QUERY: Get Product IDs
-- Run this to get actual product UUIDs
-- ============================================

SELECT 
  id,
  product_description,
  category,
  r_value,
  '-- Replace PRODUCT_ID_XXX with: ' || id as replacement_note
FROM products
WHERE product_description ILIKE '%R2.4%' OR product_description ILIKE '%R2.7%' OR product_description ILIKE '%R3.6%' OR product_description ILIKE '%vapor%'
ORDER BY product_description;

-- ============================================
-- QUICK INSERT OPTION (if you want to skip placeholders)
-- ============================================

-- Option 1: Insert assessments using subqueries for installer IDs
-- This avoids the placeholder issue entirely

INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, created_at)
VALUES 
('ASS-2025-0001', 'John Smith', 'john.smith@email.com', '021-555-0101', '15 Queen Street, Auckland CBD', 'Auckland', '1010', '2025-12-10', '09:00', (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 'Scheduled', 'Customer prefers morning appointments. Access via main entrance.', NOW()),
('ASS-2025-0002', 'Sarah Johnson', 'sarah.j@email.com', '021-555-0102', '42 Willis Street, Wellington Central', 'Wellington', '6011', '2025-12-11', '14:00', (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 'Scheduled', 'Large commercial property. Bring ladder access equipment.', NOW()),
('ASS-2025-0003', 'Michael Brown', 'mbrown@email.com', '021-555-0103', '88 Riccarton Road, Christchurch', 'Christchurch', '8011', '2025-12-12', '10:30', (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 'Scheduled', 'New build project. Coordinate with site manager.', NOW()),
('ASS-2025-0004', 'Emma Wilson', 'emma.wilson@email.com', '021-555-0104', '23 Cameron Road, Tauranga', 'Tauranga', '3110', '2025-12-13', '11:00', (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 'Scheduled', 'Renovation project. Asbestos testing completed - all clear.', NOW()),
('ASS-2025-0005', 'David Taylor', 'dtaylor@email.com', '021-555-0105', '156 Ponsonby Road, Auckland', 'Auckland', '1011', '2025-12-16', '08:30', (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 'Scheduled', 'Heritage building. Special care required for existing structure.', NOW());

-- Completed assessments
INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, completed_at, created_at)
VALUES 
('ASS-2025-0006', 'Lisa Anderson', 'lisa.a@email.com', '021-555-0106', '67 Remuera Road, Auckland', 'Auckland', '1050', '2025-11-20', '09:00', (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 'Completed', 'Standard residential assessment. Clean crawl space. Easy access. Recommend R3.6 polyester. Assessment completed successfully. Customer interested in proceeding with quote.', '2025-11-20 11:30:00', NOW() - INTERVAL '15 days'),
('ASS-2025-0007', 'Robert Martinez', 'rob.martinez@email.com', '021-555-0107', '34 Lambton Quay, Wellington', 'Wellington', '6011', '2025-11-22', '13:00', (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 'Completed', 'Commercial office building. Office building with suspended ceiling. Old insulation needs removal. Access during business hours only. Large commercial job. Quoted for polyester batts. Customer requested expedited timeline.', '2025-11-22 15:45:00', NOW() - INTERVAL '13 days'),
('ASS-2025-0008', 'Jennifer Garcia', 'jennifer.g@email.com', '021-555-0108', '91 Papanui Road, Christchurch', 'Christchurch', '8053', '2025-11-25', '10:00', (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 'Completed', 'Post-earthquake renovation. Some moisture present. Recommend moisture barrier installation. Customer approved budget up to $8,000. Recommended R2.7 with vapor barrier. Customer ready to proceed.', '2025-11-25 12:15:00', NOW() - INTERVAL '10 days'),
('ASS-2025-0009', 'Daniel Lee', 'dan.lee@email.com', '021-555-0109', '78 The Strand, Tauranga', 'Tauranga', '3110', '2025-11-28', '14:30', (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 'Completed', 'Investment property insulation upgrade. Tight crawl space. Old fiberglass needs removal. Recommend full replacement with polyester. Challenging access but doable. Quoted for removal and new installation. Customer considering options.', '2025-11-28 16:45:00', NOW() - INTERVAL '7 days'),
('ASS-2025-0010', 'Amanda White', 'amanda.white@email.com', '021-555-0110', '123 Victoria Street, Hamilton', 'Hamilton', '3204', '2025-12-01', '09:30', (SELECT id FROM team_members WHERE first_name = 'Mike' AND last_name = 'Chen' LIMIT 1), 'Completed', 'New build final insulation. New construction. Clean site. Standard residential install. Customer wants R2.7 minimum for building consent. Perfect conditions for installation. Customer ready to book immediately.', '2025-12-01 11:00:00', NOW() - INTERVAL '4 days');

-- Cancelled assessments
INSERT INTO assessments (reference_number, customer_name, customer_email, customer_phone, site_address, city, postcode, scheduled_date, scheduled_time, assigned_installer_id, status, notes, created_at)
VALUES 
('ASS-2025-0011', 'Thomas Harris', 'thomas.h@email.com', '021-555-0111', '45 High Street, Auckland', 'Auckland', '1010', '2025-11-15', '10:00', (SELECT id FROM team_members WHERE first_name = 'Sarah' AND last_name = 'Williams' LIMIT 1), 'Cancelled', 'Customer decided to postpone project until next year.', NOW() - INTERVAL '20 days'),
('ASS-2025-0012', 'Patricia Clark', 'patricia.c@email.com', '021-555-0112', '67 Cuba Street, Wellington', 'Wellington', '6011', '2025-11-18', '15:00', (SELECT id FROM team_members WHERE first_name = 'James' AND last_name = 'Thompson' LIMIT 1), 'Cancelled', 'Property sold before assessment. New owners will arrange own assessment.', NOW() - INTERVAL '17 days');
