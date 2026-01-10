-- First, let's check what columns exist and add any missing ones

-- Add issued_by_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'issued_by_id'
    ) THEN
        ALTER TABLE job_completion_certificates ADD COLUMN issued_by_id UUID;
    END IF;
END $$;

-- Now add the foreign key constraints (skip if they already exist)

-- Foreign key for job_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_job_completion_certificates_job_id'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD CONSTRAINT fk_job_completion_certificates_job_id
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Foreign key for issued_by_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_job_completion_certificates_issued_by_id'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD CONSTRAINT fk_job_completion_certificates_issued_by_id
        FOREIGN KEY (issued_by_id) REFERENCES team_members(id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificates_job_id ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_date ON job_completion_certificates(issued_date);

-- Disable RLS
ALTER TABLE job_completion_certificates DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE job_completion_certificates IS 'Stores job completion certificates issued to customers';
