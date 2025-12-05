-- ============================================================================
-- PHASE 1B: QUOTES & JOBS SYSTEM - SCHEMA MIGRATION
-- Date: December 5, 2025
-- Purpose: Add customer fields and simplified structure to quotes/jobs tables
-- ============================================================================

-- ============================================================================
-- PREREQUISITE: Ensure team_members table exists (from Phase 1A)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Sales Rep',
  status TEXT DEFAULT 'active',
  preferred_contact TEXT DEFAULT 'email',
  available_start_date DATE,
  available_end_date DATE,
  hire_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert team members if they don't exist
INSERT INTO team_members (first_name, last_name, email, phone, role, hire_date, status)
VALUES
  ('James', 'Thompson', 'james.thompson@premier.co.nz', '021-555-0101', 'Installer', '2023-01-15'::DATE, 'active'),
  ('Mike', 'Chen', 'mike.chen@premier.co.nz', '021-555-0102', 'Installer', '2023-03-20'::DATE, 'active'),
  ('Sarah', 'Williams', 'sarah.williams@premier.co.nz', '021-555-0103', 'Installer', '2024-06-10'::DATE, 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- MODIFY QUOTES TABLE - Add customer fields
-- ============================================================================

-- Add customer identification fields
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS customer_first_name TEXT,
ADD COLUMN IF NOT EXISTS customer_last_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_company TEXT,
ADD COLUMN IF NOT EXISTS site_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Make client_id nullable since we're using customer fields instead
ALTER TABLE quotes ALTER COLUMN client_id DROP NOT NULL;

-- Drop existing quote status constraint if it exists
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS check_quote_status;

-- Add new constraint with our status values
ALTER TABLE quotes ADD CONSTRAINT check_quote_status 
CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Won', 'Rejected', 'Lost', 'Cancelled'));

-- Add assessment link
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL;

-- Add quote workflow fields
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS quote_date DATE,
ADD COLUMN IF NOT EXISTS accepted_date DATE,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS valid_until DATE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES team_members(id);

-- Change created_by type if it exists as TEXT
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'created_by' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE quotes ALTER COLUMN created_by TYPE UUID USING NULL;
    ALTER TABLE quotes ADD CONSTRAINT quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES team_members(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_assessment ON quotes(assessment_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- ============================================================================
-- CREATE JOBS TABLE
-- ============================================================================

-- Drop existing jobs table if it exists but has wrong structure
DROP TABLE IF EXISTS jobs CASCADE;

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job reference
  job_number TEXT UNIQUE NOT NULL,
  
  -- Link to quote (optional - will add FK later)
  quote_id UUID,
  
  -- Customer info
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_company TEXT,
  
  -- Location
  site_address TEXT NOT NULL,
  city TEXT,
  postcode TEXT,
  
  -- Status
  status TEXT DEFAULT 'Scheduled',
  
  -- Scheduling
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  
  -- Financials
  quoted_amount NUMERIC,
  actual_cost NUMERIC,
  
  -- Crew assignment (will add FK later)
  crew_lead_id UUID,
  crew_members JSONB,
  
  -- Job details
  notes TEXT,
  internal_notes TEXT,
  
  -- Photos/documentation
  before_photos JSONB,
  after_photos JSONB,
  
  -- Metadata
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign keys after table is created
ALTER TABLE jobs 
ADD CONSTRAINT fk_jobs_quote 
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;

ALTER TABLE jobs 
ADD CONSTRAINT fk_jobs_crew_lead 
FOREIGN KEY (crew_lead_id) REFERENCES team_members(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number);
CREATE INDEX IF NOT EXISTS idx_jobs_quote ON jobs(quote_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_crew_lead ON jobs(crew_lead_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_completion_date ON jobs(completion_date);

-- ============================================================================
-- CREATE QUOTE_LINE_ITEMS TABLE (if not exists)
-- ============================================================================

DROP TABLE IF EXISTS quote_line_items CASCADE;

CREATE TABLE quote_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL,
  product_id UUID,
  product_code TEXT,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'sqm',
  unit_cost NUMERIC,
  unit_price NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE quote_line_items
ADD CONSTRAINT fk_quote_line_items_quote
FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE quote_line_items
ADD CONSTRAINT fk_quote_line_items_product
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX idx_quote_line_items_quote ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_product ON quote_line_items(product_id);

-- ============================================================================
-- CREATE JOB_LINE_ITEMS TABLE (if not exists)
-- ============================================================================

DROP TABLE IF EXISTS job_line_items CASCADE;

CREATE TABLE job_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  product_id UUID,
  product_code TEXT,
  description TEXT NOT NULL,
  quantity_quoted NUMERIC,
  quantity_actual NUMERIC,
  unit TEXT DEFAULT 'sqm',
  unit_cost NUMERIC,
  line_cost NUMERIC,
  installed_by UUID,
  installation_date DATE,
  sort_order INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE job_line_items
ADD CONSTRAINT fk_job_line_items_job
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE job_line_items
ADD CONSTRAINT fk_job_line_items_product
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE job_line_items
ADD CONSTRAINT fk_job_line_items_installer
FOREIGN KEY (installed_by) REFERENCES team_members(id) ON DELETE SET NULL;

CREATE INDEX idx_job_line_items_job ON job_line_items(job_id);
CREATE INDEX idx_job_line_items_product ON job_line_items(product_id);
CREATE INDEX idx_job_line_items_installer ON job_line_items(installed_by);

-- ============================================================================
-- DATA VALIDATION FUNCTIONS
-- ============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_quote_number();
DROP FUNCTION IF EXISTS generate_job_number();

-- Function to generate next quote number
CREATE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quote_number FROM 'QUO-' || year_str || '-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM quotes
  WHERE quote_number LIKE 'QUO-' || year_str || '-%';
  
  RETURN 'QUO-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate next job number
CREATE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 'JOB-' || year_str || '-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM jobs
  WHERE job_number LIKE 'JOB-' || year_str || '-%';
  
  RETURN 'JOB-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('quotes', 'jobs', 'quote_line_items', 'job_line_items')
ORDER BY tablename;

-- Check quote columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('quote_number', 'customer_first_name', 'assessment_id', 'total_amount')
ORDER BY column_name;

-- Check job columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 1B migration complete!';
  RAISE NOTICE '   - Quotes table updated with customer fields';
  RAISE NOTICE '   - Jobs table created';
  RAISE NOTICE '   - Line items tables ready';
  RAISE NOTICE '   - Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Run scripts/insert_test_quotes.sql';
  RAISE NOTICE '   2. Run scripts/insert_test_jobs.sql';
  RAISE NOTICE '   3. Refresh dashboard to see data';
END $$;
