-- ============================================================================
-- QUICK TEST: Assessment Wordings System
-- Run this after the main migration to test with sample data
-- ============================================================================

-- Step 1: Verify tables exist
SELECT 'assessment_wordings table' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_wordings') 
            THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT 'result_type column in assessment_areas' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessment_areas' AND column_name = 'result_type')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- Step 2: Get first assessment with areas
SELECT 
    a.id as assessment_id,
    a.reference_number,
    aa.id as area_id,
    aa.area_name,
    aa.result_type
FROM assessments a
JOIN assessment_areas aa ON aa.assessment_id = a.id
LIMIT 5;

-- Step 3: Insert test wordings (replace UUIDs with actual IDs from step 2)
-- INSERT INTO assessment_wordings (assessment_id, area_id, result_type, wordings, recommended_action)
-- VALUES (
--     'YOUR_ASSESSMENT_ID_HERE',
--     'YOUR_AREA_ID_HERE',
--     'Pass',
--     'Ceiling insulation meets NZ Building Code requirements. R-value of 2.9 measured. No visible damage or deterioration.',
--     'No action required. Recommend inspection in 5 years.'
-- );

-- Step 4: Query wordings with area details
SELECT 
    a.reference_number,
    aa.area_name,
    aw.result_type,
    aw.wordings,
    aw.recommended_action,
    aw.created_at
FROM assessment_wordings aw
JOIN assessment_areas aa ON aa.id = aw.area_id
JOIN assessments a ON a.id = aw.assessment_id
ORDER BY a.reference_number, aa.area_name;

-- Step 5: Count results by type
SELECT 
    result_type,
    COUNT(*) as count
FROM assessment_wordings
GROUP BY result_type
ORDER BY 
    CASE result_type
        WHEN 'Pass' THEN 1
        WHEN 'Conditional' THEN 2
        WHEN 'Fail' THEN 3
        WHEN 'Pending' THEN 4
    END;
