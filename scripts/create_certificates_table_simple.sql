-- Simple version: Just create the table without the function
-- You can add the function later after confirming the table works

CREATE TABLE IF NOT EXISTS job_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_date TIMESTAMP NOT NULL DEFAULT NOW(),
  issued_by_id UUID REFERENCES team_members(id),

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

CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON job_completion_certificates(issued_date);

ALTER TABLE job_completion_certificates DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE job_completion_certificates IS 'Stores job completion certificates issued to customers';
