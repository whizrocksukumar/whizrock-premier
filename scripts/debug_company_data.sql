-- ============================================================================
-- DEBUG: Check Companies Data - COMPREHENSIVE CORRELATION CHECK
-- Run this to see exact relationships between companies, clients, assessments, and quotes
-- ============================================================================

-- 1. FULL CORRELATION: Companies → Clients → Assessments & Quotes
SELECT 
    co.name as company_name,
    co.id as company_id,
    c.id as client_id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email,
    COUNT(DISTINCT a.id) as assessment_count,
    COUNT(DISTINCT q.id) as quote_count,
    STRING_AGG(DISTINCT a.reference_number, ', ') as assessment_refs,
    STRING_AGG(DISTINCT q.id::text, ', ') as quote_ids
FROM companies co
LEFT JOIN clients c ON c.company_id = co.id
LEFT JOIN assessments a ON a.client_id = c.id
LEFT JOIN quotes q ON q.client_id = c.id
GROUP BY co.id, co.name, c.id, c.first_name, c.last_name, c.email
HAVING c.id IS NOT NULL
ORDER BY co.name, c.first_name;

-- 2. SUMMARY: Companies with counts
SELECT 
    co.name as company_name,
    co.id as company_id,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT a.id) as total_assessments,
    COUNT(DISTINCT q.id) as total_quotes
FROM companies co
LEFT JOIN clients c ON c.company_id = co.id
LEFT JOIN assessments a ON a.client_id = c.id
LEFT JOIN quotes q ON q.client_id = c.id
GROUP BY co.id, co.name
HAVING COUNT(DISTINCT c.id) > 0
ORDER BY total_contacts DESC, total_quotes DESC, total_assessments DESC;

-- 3. ORPHANED DATA CHECK: Clients without companies
SELECT 
    c.id as client_id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.company_id,
    COUNT(DISTINCT a.id) as assessment_count,
    COUNT(DISTINCT q.id) as quote_count
FROM clients c
LEFT JOIN assessments a ON a.client_id = c.id
LEFT JOIN quotes q ON q.client_id = c.id
WHERE c.company_id IS NULL
GROUP BY c.id, c.first_name, c.last_name, c.email, c.company_id
HAVING COUNT(DISTINCT a.id) > 0 OR COUNT(DISTINCT q.id) > 0
ORDER BY quote_count DESC, assessment_count DESC;

-- 4. SPECIFIC CHECK: Green Building Solutions detailed breakdown
SELECT 
    'Green Building Solutions' as company_name,
    c.id as client_id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    'Assessment: ' || COALESCE(a.reference_number, 'NONE') as assessment_ref,
    'Quote: ' || COALESCE(q.id::text, 'NONE') as quote_id,
    q.status as quote_status,
    q.created_at as quote_created
FROM companies co
JOIN clients c ON c.company_id = co.id
LEFT JOIN assessments a ON a.client_id = c.id
LEFT JOIN quotes q ON q.client_id = c.id
WHERE co.name = 'Green Building Solutions';

-- 5. SPECIFIC CHECK: Thompson Architectural Services detailed breakdown
SELECT 
    'Thompson Architectural Services' as company_name,
    c.id as client_id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    'Assessment: ' || COALESCE(a.reference_number, 'NONE') as assessment_ref,
    'Quote: ' || COALESCE(q.id::text, 'NONE') as quote_id,
    a.status as assessment_status,
    a.scheduled_date as assessment_date
FROM companies co
JOIN clients c ON c.company_id = co.id
LEFT JOIN assessments a ON a.client_id = c.id
LEFT JOIN quotes q ON q.client_id = c.id
WHERE co.name = 'Thompson Architectural Services';

-- 6. RECOMMENDATION: Clients that SHOULD be linked to companies (based on email domain or name matching)
SELECT 
    c.id as client_id,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.company_id as current_company_id,
    co.id as suggested_company_id,
    co.name as suggested_company_name,
    'Email domain match or name pattern' as match_reason
FROM clients c
LEFT JOIN companies co ON (
    c.email LIKE '%' || LOWER(REPLACE(co.name, ' ', '')) || '%'
    OR LOWER(c.last_name) LIKE '%' || LOWER(SPLIT_PART(co.name, ' ', 1)) || '%'
)
WHERE c.company_id IS NULL
  AND co.id IS NOT NULL
ORDER BY c.first_name;
