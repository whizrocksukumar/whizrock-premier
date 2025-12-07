-- Add customer_company column to assessments table
-- This brings assessments in line with quotes and jobs which already have this field

ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS customer_company TEXT;

-- Create index for searching by company
CREATE INDEX IF NOT EXISTS idx_assessments_customer_company 
ON assessments(customer_company) 
WHERE customer_company IS NOT NULL;

-- Display confirmation
SELECT 
    'Added customer_company column to assessments table' AS status,
    COUNT(*) AS total_assessments,
    COUNT(customer_company) AS with_company_name
FROM assessments;
