-- ============================================================================
-- TEST RECOMMENDATIONS DATA
-- Run this to add test recommendations for the VA workspace
-- NOTE: This script creates minimal recommendations without summary fields
-- Summary fields (section_count, total_area_sqm, total_packs_required) will be NULL
-- ============================================================================

DO $$
DECLARE
    opp_3 UUID;
    opp_4 UUID;
    client_3 UUID;
    client_4 UUID;
    va_user_id UUID := '16bc0e92-2bbd-4e89-95a6-5f82e849047d'; -- Maria Garcia's ID
BEGIN
    -- First, ensure Maria exists as an auth user (required by fk_user constraint)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = va_user_id) THEN
        -- Create Maria as an auth user for future authentication
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role
        ) VALUES (
            va_user_id,
            '00000000-0000-0000-0000-000000000000',
            'maria.garcia@premierinsulation.nz',
            crypt('TempPass123!', gen_salt('bf')), -- Temporary password
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"first_name":"Maria","last_name":"Garcia","role":"VA"}',
            'authenticated',
            'authenticated'
        );
        RAISE NOTICE 'Created auth user for Maria Garcia';
    END IF;
    
    RAISE NOTICE 'Using team member ID: %', va_user_id;
    
    -- Get opportunity IDs
    SELECT id INTO opp_3 FROM opportunities WHERE opp_number = 'TEST-003';
    SELECT id INTO opp_4 FROM opportunities WHERE opp_number = 'TEST-004';
    
    -- Get or create client for TEST-003 (Sophie Williams)
    SELECT client_id INTO client_3 FROM opportunities WHERE opp_number = 'TEST-003';
    IF client_3 IS NULL THEN
        -- Create a client for Sophie Williams
        INSERT INTO clients (first_name, last_name, email, phone)
        VALUES ('Sophie', 'Williams', 'sophie.williams@email.com', '+64 21 555 1003')
        RETURNING id INTO client_3;
        
        -- Update the opportunity to link to this client
        UPDATE opportunities SET client_id = client_3 WHERE opp_number = 'TEST-003';
    END IF;
    
    -- Get or create client for TEST-004 (David Chen)
    SELECT client_id INTO client_4 FROM opportunities WHERE opp_number = 'TEST-004';
    IF client_4 IS NULL THEN
        -- Create a client for David Chen
        INSERT INTO clients (first_name, last_name, email, phone)
        VALUES ('David', 'Chen', 'david.chen@buildpro.nz', '+64 21 555 1004')
        RETURNING id INTO client_4;
        
        -- Update the opportunity to link to this client
        UPDATE opportunities SET client_id = client_4 WHERE opp_number = 'TEST-004';
    END IF;
    
    -- Delete existing test recommendations (if re-running)
    DELETE FROM product_recommendations WHERE recommendation_number IN ('REC-2024-003', 'REC-2024-004');
    
    -- Recommendation 1: TEST-003 (Sophie Williams - In Progress, Draft)
    INSERT INTO product_recommendations (
        recommendation_number,
        opportunity_id,
        client_id,
        created_by_user_id,
        status,
        notes,
        created_at
    ) VALUES (
        'REC-2024-003',
        opp_3,
        client_3,
        va_user_id,
        'Draft',
        'Large villa - Ceiling and underfloor insulation. Premium glasswool products. Draft in progress.',
        NOW() - INTERVAL '2 days'
    );
    
    -- Recommendation 2: TEST-004 (David Chen - Submitted)
    INSERT INTO product_recommendations (
        recommendation_number,
        opportunity_id,
        client_id,
        created_by_user_id,
        status,
        notes,
        created_at
    ) VALUES (
        'REC-2024-004',
        opp_4,
        client_4,
        va_user_id,
        'Submitted',
        'New build - 3 townhouses. Full insulation package for all units. Contractor pricing required.',
        NOW() - INTERVAL '1 day'
    );
    
    RAISE NOTICE 'Created 2 test recommendations';
    
END $$;

-- Verify created recommendations
SELECT 
    pr.recommendation_number,
    pr.status,
    o.opp_number,
    o.contact_first_name || ' ' || o.contact_last_name as customer,
    tm.first_name || ' ' || tm.last_name as created_by,
    pr.created_at
FROM product_recommendations pr
JOIN opportunities o ON pr.opportunity_id = o.id
JOIN team_members tm ON pr.created_by_user_id = tm.id
WHERE pr.recommendation_number LIKE 'REC-2024-%'
ORDER BY pr.created_at DESC;
