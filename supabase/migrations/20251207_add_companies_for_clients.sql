-- ============================================================================
-- ADD COMPANIES FOR TEST CLIENTS
-- Create companies and link clients to them (many clients to one company)
-- ============================================================================

-- STEP 1: Add missing columns to companies table (enterprise architecture)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'New Zealand',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- STEP 2: Insert companies with complete information
-- STEP 2: Insert companies with complete information
INSERT INTO companies (name, industry, website, phone, email, address_line_1, city, postal_code)
VALUES
-- Commercial contractors
('Adroit Builders Ltd', 'Construction', 'www.adroitbuilders.co.nz', '09-555-0201', 'info@adroitbuilders.co.nz', '23 Industrial Drive', 'Auckland', '1010'),
('Davis Homes & Development', 'Construction', 'www.davishomes.co.nz', '03-555-0202', 'contact@davishomes.co.nz', '156 Lincoln Road', 'Christchurch', '8011'),
('Martinez Commercial Contractors', 'Commercial Construction', 'www.martinezcc.co.nz', '04-555-0203', 'office@martinezcc.co.nz', '89 Thorndon Quay', 'Wellington', '6011'),
('Modern Build Contractors', 'Construction', 'www.modernbuild.co.nz', '07-555-0204', 'info@modernbuild.co.nz', '45 Grey Street', 'Hamilton', '3204'),

-- Property & Real Estate
('Wilson Properties Ltd', 'Property Management', 'www.wilsonproperties.co.nz', '07-555-0205', 'admin@wilsonproperties.co.nz', '12 Maunganui Road', 'Tauranga', '3110'),

-- Architectural Services
('Thompson Architectural Services', 'Architecture', 'www.thompsonarch.co.nz', '09-555-0206', 'projects@thompsonarch.co.nz', '78 Parnell Road', 'Auckland', '1052'),
('Heritage Home Renovations', 'Renovation', 'www.heritagehomes.co.nz', '07-555-0207', 'enquiries@heritagehomes.co.nz', '34 Duke Street', 'Cambridge', '3434'),

-- Installation Services
('Precision Installations NZ', 'Installation Services', 'www.precisioninstalls.co.nz', '03-555-0208', 'bookings@precisioninstalls.co.nz', '67 Blenheim Road', 'Christchurch', '8053'),
('Green Building Solutions', 'Sustainable Construction', 'www.greenbuilding.co.nz', '09-555-0209', 'info@greenbuilding.co.nz', '91 Karangahape Road', 'Auckland', '1010'),

-- Professional Services
('Anderson & Associates', 'Property Development', 'www.andersonassoc.co.nz', '04-555-0210', 'contact@andersonassoc.co.nz', '123 The Terrace', 'Wellington', '6011')
ON CONFLICT (name) DO NOTHING;

-- STEP 3: Update clients with company_id
-- Link Sarah Johnson to Adroit Builders Ltd
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Adroit Builders Ltd' LIMIT 1)
WHERE email = 'sarah.j@email.com';

-- Link Michael Brown to Davis Homes & Development
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Davis Homes & Development' LIMIT 1)
WHERE email = 'mbrown@email.com';

-- Link Emma Wilson to Heritage Home Renovations
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Heritage Home Renovations' LIMIT 1)
WHERE email = 'emma.wilson@email.com';

-- Link David Taylor to Thompson Architectural Services
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Thompson Architectural Services' LIMIT 1)
WHERE email = 'dtaylor@email.com';

-- Link Robert Martinez to Martinez Commercial Contractors
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Martinez Commercial Contractors' LIMIT 1)
WHERE email = 'rob.martinez@email.com';

-- Link Jennifer Garcia to Precision Installations NZ
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Precision Installations NZ' LIMIT 1)
WHERE email = 'jennifer.g@email.com';

-- Link Daniel Lee to Wilson Properties Ltd
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Wilson Properties Ltd' LIMIT 1)
WHERE email = 'dan.lee@email.com';

-- Link Amanda White to Modern Build Contractors
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Modern Build Contractors' LIMIT 1)
WHERE email = 'amanda.white@email.com';

-- Link Thomas Harris to Green Building Solutions
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Green Building Solutions' LIMIT 1)
WHERE email = 'thomas.h@email.com';

-- Link Patricia Clark to Anderson & Associates
UPDATE clients 
SET company_id = (SELECT id FROM companies WHERE name = 'Anderson & Associates' LIMIT 1)
WHERE email = 'patricia.c@email.com';

-- Verification query - Show complete company information
SELECT 
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email,
    co.name as company_name,
    co.industry,
    co.website,
    co.phone as company_phone,
    co.email as company_email
FROM clients c
LEFT JOIN companies co ON c.company_id = co.id
WHERE c.email IN (
    'sarah.j@email.com', 'mbrown@email.com', 'emma.wilson@email.com',
    'dtaylor@email.com', 'rob.martinez@email.com', 'jennifer.g@email.com',
    'dan.lee@email.com', 'amanda.white@email.com', 'thomas.h@email.com',
    'patricia.c@email.com'
)
ORDER BY co.name;
