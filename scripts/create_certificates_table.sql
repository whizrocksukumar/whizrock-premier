-- Create job_completion_certificates table
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON job_completion_certificates(issued_date);

-- Add RLS policies (disable for now, enable in production)
ALTER TABLE job_completion_certificates DISABLE ROW LEVEL SECURITY;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  seq_num INTEGER;
  cert_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  -- Use created_at instead of issued_date to avoid column reference issues
  SELECT COALESCE(COUNT(*), 0) + 1 INTO seq_num
  FROM job_completion_certificates
  WHERE EXTRACT(YEAR FROM COALESCE(issued_date, created_at)) = EXTRACT(YEAR FROM NOW());

  cert_num := 'CERT-' || year || '-' || LPAD(seq_num::TEXT, 4, '0');

  RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional - creates a test certificate)
-- INSERT INTO job_completion_certificates (
--   job_id,
--   certificate_number,
--   issued_date,
--   installer_signature_name,
--   installer_signature_date
-- )
-- SELECT
--   id,
--   generate_certificate_number(),
--   completion_date,
--   'James Thompson',
--   completion_date
-- FROM jobs
-- WHERE status = 'Completed' AND completion_date IS NOT NULL
-- LIMIT 1;

COMMENT ON TABLE job_completion_certificates IS 'Stores job completion certificates issued to customers';
