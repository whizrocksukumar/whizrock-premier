-- ============================================================================
-- RENAME companies.name TO companies.company_name
-- This improves clarity and aligns with coding conventions
-- ============================================================================

-- Step 1: Rename the column
ALTER TABLE companies 
RENAME COLUMN name TO company_name;

-- Step 2: Update any indexes that reference the old column name
-- (If there are any, PostgreSQL should handle this automatically)

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- Step 4: Test query to ensure it works
SELECT 
    company_name,
    industry,
    phone,
    email
FROM companies
LIMIT 5;
