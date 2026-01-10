-- =====================================================
-- STEP 1: Create the table first
-- =====================================================
CREATE TABLE IF NOT EXISTS job_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_date TIMESTAMP NOT NULL DEFAULT NOW(),
  issued_by_id UUID REFERENCES team_members(id),

  -- Installer signature
  installer_signature_name TEXT,
  installer_signature_date DATE,

  -- Customer signature
  customer_signature_name TEXT,
  customer_signature_date DATE,

  -- Additional fields
  warranty_start_date DATE,
  warranty_end_date DATE,
  notes TEXT,
  pdf_url TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON job_completion_certificates(issued_date);

-- =====================================================
-- STEP 3: Disable RLS for development
-- =====================================================
ALTER TABLE job_completion_certificates DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create certificate number generator function
-- =====================================================
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  seq_num INTEGER;
  cert_num TEXT;
BEGIN
  -- Get current year
  year := TO_CHAR(NOW(), 'YYYY');

  -- Count existing certificates for this year
  SELECT COALESCE(COUNT(*), 0) INTO seq_num
  FROM job_completion_certificates
  WHERE EXTRACT(YEAR FROM issued_date) = EXTRACT(YEAR FROM NOW());

  -- Increment for next number
  seq_num := seq_num + 1;

  -- Format as CERT-YYYY-0001
  cert_num := 'CERT-' || year || '-' || LPAD(seq_num::TEXT, 4, '0');

  RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Add table comment
-- =====================================================
COMMENT ON TABLE job_completion_certificates IS 'Stores job completion certificates issued to customers';

-- =====================================================
-- STEP 6 (Optional): Test the function
-- =====================================================
-- You can test the function by running:
-- SELECT generate_certificate_number();
-- Expected output: CERT-2026-0001

-- =====================================================
-- STEP 7 (Optional): Create a test certificate
-- =====================================================
-- Uncomment the following to create a test certificate for a completed job:
/*
INSERT INTO job_completion_certificates (
  job_id,
  certificate_number,
  issued_date,
  installer_signature_name,
  installer_signature_date,
  warranty_start_date
)
SELECT
  id,
  generate_certificate_number(),
  COALESCE(completion_date, NOW()),
  'James Thompson',
  completion_date,
  completion_date
FROM jobs
WHERE status = 'Completed' AND completion_date IS NOT NULL
LIMIT 1;
*/
