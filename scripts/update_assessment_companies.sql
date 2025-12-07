-- ============================================================================
-- UPDATE ASSESSMENTS WITH REALISTIC COMPANY NAMES
-- Matching company types to assessment contexts
-- ============================================================================

-- ASS-2025-0001: John Smith - Auckland residential (existing house 1980s)
-- Leave as NULL (residential individual customer)

-- ASS-2025-0002: Sarah Johnson - Wellington commercial office building
UPDATE assessments 
SET customer_company = 'Adroit Builders Ltd'
WHERE reference_number = 'ASS-2025-0002';

-- ASS-2025-0003: Michael Brown - Christchurch new build
UPDATE assessments 
SET customer_company = 'Davis Homes & Development'
WHERE reference_number = 'ASS-2025-0003';

-- ASS-2025-0004: Emma Wilson - Tauranga heritage renovation (1920s)
UPDATE assessments 
SET customer_company = 'Heritage Home Renovations'
WHERE reference_number = 'ASS-2025-0004';

-- ASS-2025-0005: David Taylor - Auckland heritage building (architect overseeing)
UPDATE assessments 
SET customer_company = 'Thompson Architectural Services'
WHERE reference_number = 'ASS-2025-0005';

-- ASS-2025-0006: Lisa Anderson - Auckland residential (standard)
-- Leave as NULL (residential individual customer)

-- ASS-2025-0007: Robert Martinez - Wellington commercial office (large job)
UPDATE assessments 
SET customer_company = 'Martinez Commercial Contractors'
WHERE reference_number = 'ASS-2025-0007';

-- ASS-2025-0008: Jennifer Garcia - Christchurch post-earthquake renovation
UPDATE assessments 
SET customer_company = 'Precision Installations NZ'
WHERE reference_number = 'ASS-2025-0008';

-- ASS-2025-0009: Daniel Lee - Tauranga investment property
UPDATE assessments 
SET customer_company = 'Wilson Properties Ltd'
WHERE reference_number = 'ASS-2025-0009';

-- ASS-2025-0010: Amanda White - Hamilton new build (owner-builder)
UPDATE assessments 
SET customer_company = 'Modern Build Contractors'
WHERE reference_number = 'ASS-2025-0010';

-- ASS-2025-0011: Thomas Harris - Auckland postponed
UPDATE assessments 
SET customer_company = 'Green Building Solutions'
WHERE reference_number = 'ASS-2025-0011';

-- ASS-2025-0012: Patricia Clark - Wellington property sold
UPDATE assessments 
SET customer_company = 'Anderson & Associates'
WHERE reference_number = 'ASS-2025-0012';

-- Verification query
SELECT 
    reference_number,
    customer_name,
    customer_company,
    status,
    city
FROM assessments
ORDER BY reference_number;
