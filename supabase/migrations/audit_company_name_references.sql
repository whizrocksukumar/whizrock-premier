-- ============================================================================
-- AUDIT: Find all references to 'company_name' in database
-- This helps us understand the impact before renaming 'name' to 'company_name'
-- ============================================================================

-- Check if 'company_name' column exists anywhere
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name LIKE '%company%name%'
ORDER BY table_name, column_name;

-- Check all columns in companies table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Check views that might reference company_name
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE view_definition LIKE '%company_name%'
   OR view_definition LIKE '%companies%';

-- Summary
SELECT 
    'Tables with company references' as check_type,
    COUNT(DISTINCT table_name) as count
FROM information_schema.columns
WHERE column_name LIKE '%company%';
