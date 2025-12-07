-- ============================================================================
-- LINK COMPANIES TO OPPORTUNITIES
-- This creates company records and links them to test opportunities
-- ============================================================================

DO $$
DECLARE
    company_mitchell UUID;
    company_williams UUID;
    company_chen UUID;
    opp_2 UUID;
    opp_3 UUID;
    opp_4 UUID;
BEGIN
    -- Get opportunity IDs
    SELECT id INTO opp_2 FROM opportunities WHERE opp_number = 'TEST-002';
    SELECT id INTO opp_3 FROM opportunities WHERE opp_number = 'TEST-003';
    SELECT id INTO opp_4 FROM opportunities WHERE opp_number = 'TEST-004';
    
    -- Check if companies already exist (using 'company_name' column)
    SELECT id INTO company_mitchell FROM companies WHERE company_name = 'Mitchell Property Services' LIMIT 1;
    IF company_mitchell IS NULL THEN
        -- Create company for James Mitchell (TEST-002)
        INSERT INTO companies (
            company_name,
            industry,
            phone,
            email,
            address_line_1,
            city,
            postal_code
        ) VALUES (
            'Mitchell Property Services',
            'Residential',
            '+64 21 555 1002',
            'info@mitchellproperty.co.nz',
            '456 Queen Street',
            'Wellington',
            '6011'
        ) RETURNING id INTO company_mitchell;
    END IF;
    
    SELECT id INTO company_williams FROM companies WHERE company_name = 'Williams Heritage Homes' LIMIT 1;
    IF company_williams IS NULL THEN
        -- Create company for Sophie Williams (TEST-003)
        INSERT INTO companies (
            company_name,
            industry,
            phone,
            email,
            address_line_1,
            city,
            postal_code
        ) VALUES (
            'Williams Heritage Homes',
            'Residential',
            '+64 21 555 1003',
            'sophie@williamshomes.co.nz',
            '789 Lambton Quay',
            'Wellington',
            '6011'
        ) RETURNING id INTO company_williams;
    END IF;
    
    SELECT id INTO company_chen FROM companies WHERE company_name = 'BuildPro Construction Ltd' LIMIT 1;
    IF company_chen IS NULL THEN
        -- Create company for David Chen (TEST-004)
        INSERT INTO companies (
            company_name,
            industry,
            phone,
            email,
            address_line_1,
            city,
            postal_code
        ) VALUES (
            'BuildPro Construction Ltd',
            'Construction',
            '+64 21 555 1004',
            'david.chen@buildpro.nz',
            '321 Construction Road',
            'Christchurch',
            '8011'
        ) RETURNING id INTO company_chen;
    END IF;
    
    -- Update opportunities with company IDs
    UPDATE opportunities SET company_id = company_mitchell WHERE id = opp_2;
    UPDATE opportunities SET company_id = company_williams WHERE id = opp_3;
    UPDATE opportunities SET company_id = company_chen WHERE id = opp_4;
    
    RAISE NOTICE 'Created companies and linked to test opportunities';
    
END $$;

-- Verify the updates
SELECT 
    o.opp_number,
    o.contact_first_name || ' ' || o.contact_last_name as contact,
    c.company_name,
    o.stage,
    o.sub_status
FROM opportunities o
LEFT JOIN companies c ON o.company_id = c.id
WHERE o.opp_number LIKE 'TEST-%'
ORDER BY o.opp_number;
