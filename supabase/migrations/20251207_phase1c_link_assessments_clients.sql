-- ============================================================================
-- PHASE 1C: PROPER CRM ARCHITECTURE - LINK ASSESSMENTS TO CLIENTS
-- Migrate from inline customer data to proper foreign key relationships
-- ============================================================================

-- STEP 1: Insert test customers into clients table
INSERT INTO clients (
    first_name,
    last_name,
    email,
    phone,
    company_id,
    address_line_1,
    city
)
VALUES
-- Auckland residential
('John', 'Smith', 'john.smith@email.com', '021-555-0101', NULL, '15 Queen Street, Auckland CBD', 'Auckland'),

-- Wellington commercial
('Sarah', 'Johnson', 'sarah.j@email.com', '021-555-0102', NULL, '42 Willis Street, Wellington Central', 'Wellington'),

-- Christchurch new build
('Michael', 'Brown', 'mbrown@email.com', '021-555-0103', NULL, '88 Riccarton Road, Christchurch', 'Christchurch'),

-- Tauranga heritage
('Emma', 'Wilson', 'emma.wilson@email.com', '021-555-0104', NULL, '23 Cameron Road, Tauranga', 'Tauranga'),

-- Auckland heritage
('David', 'Taylor', 'dtaylor@email.com', '021-555-0105', NULL, '156 Ponsonby Road, Auckland', 'Auckland'),

-- Auckland residential
('Lisa', 'Anderson', 'lisa.a@email.com', '021-555-0106', NULL, '67 Remuera Road, Auckland', 'Auckland'),

-- Wellington commercial
('Robert', 'Martinez', 'rob.martinez@email.com', '021-555-0107', NULL, '34 Lambton Quay, Wellington', 'Wellington'),

-- Christchurch renovation
('Jennifer', 'Garcia', 'jennifer.g@email.com', '021-555-0108', NULL, '91 Papanui Road, Christchurch', 'Christchurch'),

-- Tauranga investment
('Daniel', 'Lee', 'dan.lee@email.com', '021-555-0109', NULL, '78 The Strand, Tauranga', 'Tauranga'),

-- Hamilton new build
('Amanda', 'White', 'amanda.white@email.com', '021-555-0110', NULL, '123 Victoria Street, Hamilton', 'Hamilton'),

-- Auckland postponed
('Thomas', 'Harris', 'thomas.h@email.com', '021-555-0111', NULL, '45 High Street, Auckland', 'Auckland'),

-- Wellington cancelled
('Patricia', 'Clark', 'patricia.c@email.com', '021-555-0112', NULL, '67 Cuba Street, Wellington', 'Wellington');

-- STEP 2: Add client_id column to assessments table
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_client_id ON assessments(client_id);

-- STEP 3: Link existing assessments to clients by matching email
UPDATE assessments a
SET client_id = c.id
FROM clients c
WHERE a.customer_email = c.email;

-- STEP 4: Verify the linkage
SELECT 
    a.reference_number,
    a.customer_name as old_inline_name,
    c.first_name || ' ' || c.last_name as new_client_name,
    c.email,
    a.status,
    CASE WHEN a.client_id IS NOT NULL THEN '✓ Linked' ELSE '✗ Not Linked' END as link_status
FROM assessments a
LEFT JOIN clients c ON a.client_id = c.id
ORDER BY a.reference_number;

-- NOTE FOR LATER: After frontend is updated, these inline fields can be removed:
-- - customer_name
-- - customer_email  
-- - customer_phone
-- - customer_company
-- Keep them for now as backup during migration
