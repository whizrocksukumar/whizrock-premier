-- ============================================================================
-- POPULATE CLIENTS TABLE FROM ASSESSMENTS DATA
-- Extract unique customers from assessments and create client records
-- ============================================================================

-- First, let's see the clients table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Insert unique customers from assessments into clients table
-- Map assessment customer data to client fields
INSERT INTO clients (
    first_name,
    last_name,
    email,
    phone,
    company_id,
    status,
    created_at
)
SELECT DISTINCT
    SPLIT_PART(customer_name, ' ', 1) as first_name,
    SUBSTRING(customer_name FROM POSITION(' ' IN customer_name) + 1) as last_name,
    customer_email as email,
    customer_phone as phone,
    NULL as company_id,  -- We'll handle companies separately
    'Active' as status,
    NOW() as created_at
FROM assessments
WHERE customer_email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Verify the inserted clients
SELECT 
    id,
    first_name,
    last_name,
    email,
    phone,
    status
FROM clients
ORDER BY last_name, first_name;
