-- ============================================================================
-- TEST DATA FOR OPPORTUNITIES & TASKS SYSTEM
-- Run this AFTER running 20251207_opportunities_tasks_system.sql
-- This creates realistic test data for development and testing
-- ============================================================================

-- Note: This script assumes you already have team_members with roles.
-- If not, uncomment and modify the team_members section below.

-- ============================================================================
-- OPTIONAL: CREATE TEST TEAM MEMBERS (uncomment if needed)
-- ============================================================================

/*
-- Insert test team members if they don't exist
INSERT INTO team_members (first_name, last_name, email, role, phone, is_active)
VALUES 
  ('John', 'Smith', 'john.smith@premierinsulation.nz', 'Sales Rep', '+64 21 111 0001', true),
  ('Sarah', 'Johnson', 'sarah.johnson@premierinsulation.nz', 'Sales Rep', '+64 21 111 0002', true),
  ('Maria', 'Garcia', 'maria.garcia@premierinsulation.nz', 'VA', '+64 21 111 0003', true),
  ('Tom', 'Wilson', 'tom.wilson@premierinsulation.nz', 'Installer', '+64 21 111 0004', true)
ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- PART 1: CREATE TEST OPPORTUNITIES
-- ============================================================================

DO $$
DECLARE
    sales_rep_1 UUID;
    sales_rep_2 UUID;
    va_user UUID;
    installer_user UUID;
BEGIN
    -- Get team member IDs
    SELECT id INTO sales_rep_1 FROM team_members WHERE role = 'Sales Rep' LIMIT 1;
    SELECT id INTO sales_rep_2 FROM team_members WHERE role = 'Sales Rep' OFFSET 1 LIMIT 1;
    SELECT id INTO va_user FROM team_members WHERE role = 'VA' LIMIT 1;
    SELECT id INTO installer_user FROM team_members WHERE role = 'Installer' LIMIT 1;

    -- If no team members found, exit
    IF sales_rep_1 IS NULL THEN
        RAISE NOTICE 'No team members found. Please create team_members first.';
        RETURN;
    END IF;

    -- Delete existing test opportunities (if re-running script)
    DELETE FROM tasks WHERE opportunity_id IN (
        SELECT id FROM opportunities WHERE opp_number LIKE 'TEST-%'
    );
    DELETE FROM opportunities WHERE opp_number LIKE 'TEST-%';

    -- Opportunity 1: NEW stage - Just received inquiry
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-001', 'Emma', 'Thompson', 'emma.thompson@email.com', '+64 21 555 1001',
        'Primary Contact', 'Homeowner', '123 Victoria Street', 'Auckland', '1010',
        'NEW', 'Awaiting Contact', NULL, 15000.00,
        sales_rep_1, sales_rep_1, CURRENT_DATE + INTERVAL '14 days',
        'New inquiry from website. Interested in full home insulation. Property built 1980s. Has budget concerns.',
        NOW() - INTERVAL '2 hours'
    );

    -- Opportunity 2: NEW stage - Assessment scheduled, awaiting VA
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-002', 'James', 'Mitchell', 'james.mitchell@email.com', '+64 21 555 1002',
        'Primary Contact', 'Homeowner', '456 Queen Street', 'Wellington', '6011',
        'NEW', 'Assessment Scheduled', 'Not Started', 18500.00,
        sales_rep_1, sales_rep_1, CURRENT_DATE + INTERVAL '10 days',
        'Free assessment completed yesterday. Customer wants ceiling and underfloor insulation. Waiting for VA to create recommendation.',
        NOW() - INTERVAL '1 day'
    );

    -- Opportunity 3: NEW stage - VA creating recommendation
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-003', 'Sophie', 'Williams', 'sophie.williams@email.com', '+64 21 555 1003',
        'Decision Maker', 'Homeowner', '789 Lambton Quay', 'Wellington', '6011',
        'NEW', 'Assessment Complete', 'In Progress', 22000.00,
        sales_rep_2, sales_rep_2, CURRENT_DATE + INTERVAL '7 days',
        'Large villa renovation. Assessment completed. VA is currently creating product recommendation. Customer prefers premium glasswool products.',
        NOW() - INTERVAL '3 days'
    );

    -- Opportunity 4: QUALIFIED stage - VA recommendation submitted
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-004', 'David', 'Chen', 'david.chen@buildpro.nz', '+64 21 555 1004',
        'Decision Maker', 'Builder', '321 Construction Road', 'Christchurch', '8011',
        'QUALIFIED', 'Quote Required', 'Submitted', 45000.00,
        sales_rep_2, sales_rep_2, CURRENT_DATE + INTERVAL '5 days',
        'New build project - 3 townhouses. VA recommendation submitted this morning. Ready to convert to quote with contractor pricing.',
        NOW() - INTERVAL '5 days'
    );

    -- Opportunity 5: QUOTED stage - Quote sent, awaiting response
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-005', 'Rachel', 'Brown', 'rachel.brown@email.com', '+64 21 555 1005',
        'Primary Contact', 'Homeowner', '654 Park Road', 'Auckland', '1023',
        'QUOTED', 'Follow-up Required', 'Converted to Quote', 12750.00,
        sales_rep_1, sales_rep_1, CURRENT_DATE + INTERVAL '3 days',
        'Quote sent 2 days ago. Customer reviewing with husband. Follow-up call scheduled for tomorrow. Ceiling insulation only.',
        NOW() - INTERVAL '8 days'
    );

    -- Opportunity 6: WON stage - Job scheduled
    INSERT INTO opportunities (
        opp_number, contact_first_name, contact_last_name, contact_email, contact_phone,
        contact_type, client_type, site_address, site_city, site_postcode,
        stage, sub_status, recommendation_status, estimated_value, actual_value,
        sales_rep_id, created_by_user_id, due_date, notes, created_at
    ) VALUES (
        'TEST-006', 'Michael', 'Davis', 'michael.davis@email.com', '+64 21 555 1006',
        'Primary Contact', 'Homeowner', '987 Hillside Avenue', 'Hamilton', '3216',
        'WON', 'Job Scheduled', 'Converted to Quote', 16500.00, 16500.00,
        sales_rep_2, sales_rep_2, CURRENT_DATE + INTERVAL '10 days',
        'Contract signed! Job scheduled for next week. Customer very happy with quote. Full ceiling and underfloor package.',
        NOW() - INTERVAL '15 days'
    );

    RAISE NOTICE 'Created 6 test opportunities';

END $$;

-- ============================================================================
-- PART 2: CREATE TEST TASKS FOR EACH OPPORTUNITY
-- ============================================================================

DO $$
DECLARE
    opp_1 UUID;
    opp_2 UUID;
    opp_3 UUID;
    opp_4 UUID;
    opp_5 UUID;
    opp_6 UUID;
    sales_rep_1 UUID;
    sales_rep_2 UUID;
    va_user UUID;
BEGIN
    -- Get opportunity IDs
    SELECT id INTO opp_1 FROM opportunities WHERE opp_number = 'TEST-001';
    SELECT id INTO opp_2 FROM opportunities WHERE opp_number = 'TEST-002';
    SELECT id INTO opp_3 FROM opportunities WHERE opp_number = 'TEST-003';
    SELECT id INTO opp_4 FROM opportunities WHERE opp_number = 'TEST-004';
    SELECT id INTO opp_5 FROM opportunities WHERE opp_number = 'TEST-005';
    SELECT id INTO opp_6 FROM opportunities WHERE opp_number = 'TEST-006';
    
    -- Get team member IDs
    SELECT id INTO sales_rep_1 FROM team_members WHERE role = 'Sales Rep' LIMIT 1;
    SELECT id INTO sales_rep_2 FROM team_members WHERE role = 'Sales Rep' OFFSET 1 LIMIT 1;
    SELECT id INTO va_user FROM team_members WHERE role = 'VA' LIMIT 1;

    -- Tasks for TEST-001 (Emma Thompson - NEW, just received)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES (
        opp_1, 'Call Emma to introduce services and schedule free assessment', 'Call Customer',
        sales_rep_1, sales_rep_1, CURRENT_DATE,
        'Not Started', 'High', 0,
        'First contact. Website inquiry mentioned ceiling and wall insulation interest.'
    );

    -- Tasks for TEST-002 (James Mitchell - Assessment complete, needs VA)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_2, 'Create Product Recommendation for James Mitchell', 'Create Recommendation',
        sales_rep_1, va_user, CURRENT_DATE + INTERVAL '1 day',
        'Not Started', 'High', 0,
        'Assessment ref: ASS-2024-056. Property: 150m² ceiling area, 120m² underfloor. Customer prefers mid-tier pricing.'
    );

    -- Tasks for TEST-003 (Sophie Williams - VA in progress)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_3, 'Create Product Recommendation for Sophie Williams villa', 'Create Recommendation',
        sales_rep_2, va_user, CURRENT_DATE,
        'In Progress', 'High', 60,
        'Large villa - 3 sections: Ceiling (200m²), Underfloor (180m²), Walls (240m²). Premium glasswool products required. Almost complete.'
    );

    -- Tasks for TEST-004 (David Chen - VA submitted, needs quote conversion)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_4, 'Review VA recommendation and convert to formal quote', 'Create Quote',
        sales_rep_2, sales_rep_2, CURRENT_DATE,
        'Not Started', 'Urgent', 0,
        'VA recommendation submitted. Apply contractor pricing tier (15% discount). Include 3 separate quotes for each townhouse.'
    );
    
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_4, 'Send quotes to David Chen via email', 'Send Quote',
        sales_rep_2, sales_rep_2, CURRENT_DATE + INTERVAL '1 day',
        'Not Started', 'High', 0,
        'Email 3 separate PDF quotes. Include payment terms and installation timeline.'
    );

    -- Tasks for TEST-005 (Rachel Brown - Quote sent, follow-up needed)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, due_time, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_5, 'Follow-up call with Rachel about quote', 'Call Customer',
        sales_rep_1, sales_rep_1, CURRENT_DATE + INTERVAL '1 day', '10:00:00',
        'Not Started', 'High', 0,
        'Quote sent 2 days ago. Customer reviewing with husband. Address any questions about R-values and installation process.'
    );
    
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_5, 'Prepare to negotiate price if needed', 'Follow Up',
        sales_rep_1, sales_rep_1, CURRENT_DATE + INTERVAL '2 days',
        'Not Started', 'Normal', 0,
        'If customer hesitant on price, prepared to offer 5% discount or payment plan options.'
    );

    -- Tasks for TEST-006 (Michael Davis - WON, job scheduled)
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, completed_at, notes
    ) VALUES 
    (
        opp_6, 'Send installation confirmation to Michael', 'Send Quote',
        sales_rep_2, sales_rep_2, CURRENT_DATE - INTERVAL '3 days',
        'Completed', 'High', 100, NOW() - INTERVAL '3 days',
        'Installation confirmation sent. Job scheduled for next week.'
    );
    
    INSERT INTO tasks (
        opportunity_id, task_description, task_type, created_by_user_id, assigned_to_user_id,
        due_date, status, priority, completion_percent, notes
    ) VALUES 
    (
        opp_6, 'Coordinate with installation team', 'Site Visit',
        sales_rep_2, sales_rep_2, CURRENT_DATE + INTERVAL '5 days',
        'Not Started', 'Normal', 0,
        'Confirm installer availability, materials ordered, and site access details with customer.'
    );

    RAISE NOTICE 'Created test tasks for all opportunities';

END $$;

-- ============================================================================
-- PART 3: VERIFICATION - SHOW CREATED TEST DATA
-- ============================================================================

-- Show all test opportunities with task counts
SELECT 
    o.opp_number,
    o.contact_first_name || ' ' || o.contact_last_name as customer_name,
    o.stage,
    o.sub_status,
    o.recommendation_status,
    o.estimated_value,
    COUNT(t.id) as task_count,
    SUM(CASE WHEN t.status = 'Not Started' THEN 1 ELSE 0 END) as pending_tasks,
    SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
    SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
FROM opportunities o
LEFT JOIN tasks t ON o.id = t.opportunity_id
WHERE o.opp_number LIKE 'TEST-%'
GROUP BY o.id, o.opp_number, o.contact_first_name, o.contact_last_name, 
         o.stage, o.sub_status, o.recommendation_status, o.estimated_value
ORDER BY o.opp_number;

-- Show VA tasks specifically
SELECT 
    o.opp_number,
    o.contact_first_name || ' ' || o.contact_last_name as customer,
    t.task_type,
    t.status,
    t.priority,
    t.completion_percent,
    t.due_date,
    tm.first_name || ' ' || tm.last_name as assigned_to
FROM tasks t
JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN team_members tm ON t.assigned_to_user_id = tm.id
WHERE o.opp_number LIKE 'TEST-%'
  AND t.task_type = 'Create Recommendation'
ORDER BY t.due_date;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

SELECT 
    '=== TEST DATA SUMMARY ===' as summary,
    (SELECT COUNT(*) FROM opportunities WHERE opp_number LIKE 'TEST-%') as opportunities_created,
    (SELECT COUNT(*) FROM tasks WHERE opportunity_id IN (SELECT id FROM opportunities WHERE opp_number LIKE 'TEST-%')) as tasks_created,
    (SELECT SUM(estimated_value) FROM opportunities WHERE opp_number LIKE 'TEST-%') as total_pipeline_value;

-- ============================================================================
-- CLEANUP SCRIPT (run this to remove all test data)
-- ============================================================================

/*
-- To remove all test data, uncomment and run:

DELETE FROM tasks 
WHERE opportunity_id IN (
    SELECT id FROM opportunities WHERE opp_number LIKE 'TEST-%'
);

DELETE FROM opportunities 
WHERE opp_number LIKE 'TEST-%';

SELECT 'Test data cleaned up' as status;
*/

-- ============================================================================
-- END OF TEST DATA SCRIPT
-- ============================================================================
