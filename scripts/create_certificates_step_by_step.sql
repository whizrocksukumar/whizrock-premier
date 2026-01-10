-- =====================================================
-- RUN EACH SECTION SEPARATELY TO FIND THE ISSUE
-- =====================================================

-- STEP 1: Create basic table structure (run this first)
CREATE TABLE IF NOT EXISTS job_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_date TIMESTAMP NOT NULL DEFAULT NOW(),
  issued_by_id UUID,
  installer_signature_name TEXT,
  installer_signature_date DATE,
  customer_signature_name TEXT,
  customer_signature_date DATE,
  warranty_start_date DATE,
  warranty_end_date DATE,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 2: Add foreign key constraints (run after Step 1 succeeds)
ALTER TABLE job_completion_certificates
  ADD CONSTRAINT fk_job_completion_certificates_job_id
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE job_completion_certificates
  ADD CONSTRAINT fk_job_completion_certificates_issued_by_id
  FOREIGN KEY (issued_by_id) REFERENCES team_members(id);

-- STEP 3: Create indexes (run after Step 2 succeeds)
CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON job_completion_certificates(issued_date);

-- STEP 4: Disable RLS (run after Step 3 succeeds)
ALTER TABLE job_completion_certificates DISABLE ROW LEVEL SECURITY;

-- STEP 5: Add comment (run after Step 4 succeeds)
COMMENT ON TABLE job_completion_certificates IS 'Stores job completion certificates issued to customers';
