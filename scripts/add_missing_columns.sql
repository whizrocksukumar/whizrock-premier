-- Add all missing columns to job_completion_certificates table

-- Add issued_date if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'issued_date'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN issued_date TIMESTAMP NOT NULL DEFAULT NOW();
    END IF;
END $$;

-- Add installer_signature_name if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'installer_signature_name'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN installer_signature_name TEXT;
    END IF;
END $$;

-- Add installer_signature_date if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'installer_signature_date'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN installer_signature_date DATE;
    END IF;
END $$;

-- Add customer_signature_name if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'customer_signature_name'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN customer_signature_name TEXT;
    END IF;
END $$;

-- Add customer_signature_date if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'customer_signature_date'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN customer_signature_date DATE;
    END IF;
END $$;

-- Add warranty_start_date if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'warranty_start_date'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN warranty_start_date DATE;
    END IF;
END $$;

-- Add warranty_end_date if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'warranty_end_date'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN warranty_end_date DATE;
    END IF;
END $$;

-- Add notes if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add pdf_url if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'pdf_url'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN pdf_url TEXT;
    END IF;
END $$;

-- Add created_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_completion_certificates'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_completion_certificates
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;
