-- ============================================================================
-- JOBS SYSTEM - COMPLETE SCHEMA (STOCK + TRACKING TABLES)
-- Date: December 7, 2025
-- Purpose: Add stock management, labour tracking, photos, comments, history
-- Dependencies: 20251205_phase1b_quotes_jobs.sql (jobs + job_line_items)
-- ============================================================================

-- ============================================================================
-- PART 1: STOCK MANAGEMENT TABLES
-- ============================================================================

-- Stock Levels Table
-- Tracks current stock quantities for each product
CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_location TEXT DEFAULT 'Main Warehouse',
  quantity_on_hand NUMERIC DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved NUMERIC DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available NUMERIC GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_level NUMERIC DEFAULT 10,
  reorder_quantity NUMERIC DEFAULT 50,
  last_stock_take_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT stock_levels_product_warehouse_unique UNIQUE (product_id, warehouse_location)
);

-- Stock Movements Table
-- Audit trail of all stock transactions
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  job_id UUID,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('INWARD', 'RESERVED', 'ALLOCATED', 'RETURNED', 'ADJUSTMENT', 'STOCK_TAKE')),
  quantity NUMERIC NOT NULL,
  quantity_before NUMERIC,
  quantity_after NUMERIC,
  warehouse_location TEXT DEFAULT 'Main Warehouse',
  reference_number TEXT, -- PO number, GRN number, Job number, etc.
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_stock_movements_job'
    ) THEN
      ALTER TABLE stock_movements 
      ADD CONSTRAINT fk_stock_movements_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add foreign key to team_members table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'created_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_stock_movements_created_by'
    ) THEN
      ALTER TABLE stock_movements 
      ADD CONSTRAINT fk_stock_movements_created_by 
      FOREIGN KEY (created_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Indexes for stock tables
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON stock_levels(warehouse_location);
CREATE INDEX IF NOT EXISTS idx_stock_levels_low_stock ON stock_levels(quantity_on_hand) WHERE quantity_on_hand <= reorder_level;

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_job ON stock_movements(job_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================================================
-- PART 2: JOB LABOUR ITEMS TABLE
-- ============================================================================

-- Track labour charges separately from materials
CREATE TABLE IF NOT EXISTS job_labour_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  description TEXT NOT NULL,
  area_sqm NUMERIC,
  
  -- Quoted values (from quote)
  quoted_rate NUMERIC, -- per sqm or per hour
  quoted_hours NUMERIC,
  quoted_amount NUMERIC,
  
  -- Actual values (from job completion)
  actual_hours NUMERIC,
  actual_rate NUMERIC,
  actual_amount NUMERIC,
  
  -- Tracking
  performed_by UUID,
  labour_date DATE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_labour_items' AND column_name = 'performed_by') THEN
    ALTER TABLE job_labour_items ADD COLUMN performed_by UUID;
  END IF;
END $$;

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_labour_items' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_labour_items_job'
    ) THEN
      ALTER TABLE job_labour_items 
      ADD CONSTRAINT fk_job_labour_items_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add foreign key to team_members table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_labour_items' AND column_name = 'performed_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_labour_items_performed_by'
    ) THEN
      ALTER TABLE job_labour_items 
      ADD CONSTRAINT fk_job_labour_items_performed_by 
      FOREIGN KEY (performed_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_labour_job ON job_labour_items(job_id);
CREATE INDEX IF NOT EXISTS idx_job_labour_performed_by ON job_labour_items(performed_by);

-- ============================================================================
-- PART 3: JOB PHOTOS STORAGE & TABLE
-- ============================================================================

-- Create storage bucket for job photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job photos
DO $$ 
BEGIN
  -- INSERT: Authenticated users can upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'job_photos_insert_policy'
  ) THEN
    CREATE POLICY job_photos_insert_policy ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'job-photos');
  END IF;

  -- SELECT: Authenticated users can view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'job_photos_select_policy'
  ) THEN
    CREATE POLICY job_photos_select_policy ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'job-photos');
  END IF;

  -- DELETE: Authenticated users can delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'job_photos_delete_policy'
  ) THEN
    CREATE POLICY job_photos_delete_policy ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'job-photos');
  END IF;

  -- UPDATE: Authenticated users can update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'job_photos_update_policy'
  ) THEN
    CREATE POLICY job_photos_update_policy ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'job-photos');
  END IF;
END $$;

-- Job Photos Table
-- Metadata for photos stored in storage bucket
CREATE TABLE IF NOT EXISTS job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('BEFORE', 'DURING', 'AFTER', 'ISSUE', 'OTHER')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_url TEXT NOT NULL, -- Full URL for display
  file_size INTEGER, -- Bytes
  mime_type TEXT,
  caption TEXT,
  taken_at TIMESTAMP,
  uploaded_by UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  deleted_by UUID
);

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_photos' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_photos_job'
    ) THEN
      ALTER TABLE job_photos 
      ADD CONSTRAINT fk_job_photos_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add foreign keys to team_members table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_photos' AND column_name = 'uploaded_by') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_photos_uploaded_by'
      ) THEN
        ALTER TABLE job_photos 
        ADD CONSTRAINT fk_job_photos_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES team_members(id) ON DELETE SET NULL;
      END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_photos' AND column_name = 'deleted_by') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_job_photos_deleted_by'
      ) THEN
        ALTER TABLE job_photos 
        ADD CONSTRAINT fk_job_photos_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES team_members(id) ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_photos_job ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_type ON job_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_job_photos_active ON job_photos(job_id, photo_type) WHERE is_deleted = false;

-- ============================================================================
-- PART 4: JOB COMMENTS TABLE
-- ============================================================================

-- Track all job-related communication and notes
CREATE TABLE IF NOT EXISTS job_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'NOTE' CHECK (comment_type IN ('NOTE', 'ISSUE', 'RESOLUTION', 'CUSTOMER_FEEDBACK', 'INTERNAL')),
  is_internal BOOLEAN DEFAULT true, -- false = visible to customer
  commented_by UUID,
  commented_at TIMESTAMP DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  parent_comment_id UUID -- For threaded replies
);

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_comments' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_comments_job'
    ) THEN
      ALTER TABLE job_comments 
      ADD CONSTRAINT fk_job_comments_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add foreign keys if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_comments' AND column_name = 'commented_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_comments_commented_by'
    ) THEN
      ALTER TABLE job_comments 
      ADD CONSTRAINT fk_job_comments_commented_by 
      FOREIGN KEY (commented_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_comments') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_comments' AND column_name = 'parent_comment_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_comments_parent'
    ) THEN
      ALTER TABLE job_comments 
      ADD CONSTRAINT fk_job_comments_parent 
      FOREIGN KEY (parent_comment_id) REFERENCES job_comments(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_comments_job ON job_comments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_date ON job_comments(commented_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_comments_type ON job_comments(comment_type);

-- ============================================================================
-- PART 5: JOB STATUS HISTORY TABLE & TRIGGER
-- ============================================================================

-- Auto-log all status changes for audit trail
CREATE TABLE IF NOT EXISTS job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_status_history' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_status_history_job'
    ) THEN
      ALTER TABLE job_status_history 
      ADD CONSTRAINT fk_job_status_history_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add foreign key to team_members table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_status_history' AND column_name = 'changed_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_status_history_changed_by'
    ) THEN
      ALTER TABLE job_status_history 
      ADD CONSTRAINT fk_job_status_history_changed_by 
      FOREIGN KEY (changed_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_status_history_job ON job_status_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_status_history_date ON job_status_history(changed_at DESC);

-- Function to auto-log status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO job_status_history (job_id, old_status, new_status, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on jobs table (only create if job_status_history table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_status_history') THEN
    DROP TRIGGER IF EXISTS trigger_log_job_status_change ON jobs;
    CREATE TRIGGER trigger_log_job_status_change
      AFTER UPDATE ON jobs
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION log_job_status_change();
  END IF;
END $$;

-- ============================================================================
-- PART 6: JOB COMPLETION CERTIFICATES TABLE
-- ============================================================================

-- Store certificate metadata and file references
CREATE TABLE IF NOT EXISTS job_completion_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_url TEXT, -- PDF stored in storage
  
  -- Generation
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID,
  
  -- Customer signature
  customer_signature_url TEXT,
  customer_signed_at TIMESTAMP,
  customer_name TEXT,
  
  -- Installer signature
  installer_signature_url TEXT,
  installer_signed_at TIMESTAMP,
  installer_name TEXT,
  
  -- Email tracking
  emailed_to_customer BOOLEAN DEFAULT false,
  emailed_at TIMESTAMP,
  customer_viewed_at TIMESTAMP,
  
  -- Additional fields
  work_completed_date DATE,
  warranty_period_months INTEGER DEFAULT 12,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key to jobs table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_completion_certificates' AND column_name = 'job_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_completion_certificates_job'
    ) THEN
      ALTER TABLE job_completion_certificates 
      ADD CONSTRAINT fk_job_completion_certificates_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add foreign key to team_members table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_completion_certificates' AND column_name = 'generated_by') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_job_completion_certificates_generated_by'
    ) THEN
      ALTER TABLE job_completion_certificates 
      ADD CONSTRAINT fk_job_completion_certificates_generated_by 
      FOREIGN KEY (generated_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_completion_cert_job ON job_completion_certificates(job_id);
CREATE INDEX IF NOT EXISTS idx_completion_cert_number ON job_completion_certificates(certificate_number);

-- ============================================================================
-- PART 7: UPDATE JOBS TABLE - ADD MISSING FIELDS
-- ============================================================================

-- Add fields that may be missing for complete job tracking
-- Check if assessments table exists before adding foreign key
DO $$ 
BEGIN
  -- Add assessment_id if assessments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assessment_id UUID;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_jobs_assessment'
    ) THEN
      ALTER TABLE jobs ADD CONSTRAINT fk_jobs_assessment 
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Add opportunity_id if opportunities table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS opportunity_id UUID;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_jobs_opportunity'
    ) THEN
      ALTER TABLE jobs ADD CONSTRAINT fk_jobs_opportunity 
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add other fields
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS warranty_period_months INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Create indexes for new foreign keys if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'assessment_id') THEN
    CREATE INDEX IF NOT EXISTS idx_jobs_assessment ON jobs(assessment_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_jobs_opportunity ON jobs(opportunity_id);
  END IF;
END $$;

-- ============================================================================
-- PART 8: UPDATE OPPORTUNITIES TABLE - ADD JOB LINK
-- ============================================================================

-- Link opportunities to jobs (for future Kanban update)
DO $$ 
BEGIN
  -- Only add if opportunities table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'opportunities') THEN
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS job_id UUID;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_opportunities_job'
    ) THEN
      ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_job 
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_opportunities_job ON opportunities(job_id);
  END IF;
END $$;

-- ============================================================================
-- PART 9: AUTO-UPDATE TRIGGERS FOR updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock_levels
DROP TRIGGER IF EXISTS update_stock_levels_updated_at ON stock_levels;
CREATE TRIGGER update_stock_levels_updated_at
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for job_labour_items
DROP TRIGGER IF EXISTS update_job_labour_items_updated_at ON job_labour_items;
CREATE TRIGGER update_job_labour_items_updated_at
    BEFORE UPDATE ON job_labour_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for job_completion_certificates
DROP TRIGGER IF EXISTS update_job_completion_certificates_updated_at ON job_completion_certificates;
CREATE TRIGGER update_job_completion_certificates_updated_at
    BEFORE UPDATE ON job_completion_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 10: COMMENTS ON TABLES FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE stock_levels IS 'Current stock quantities for all products';
COMMENT ON COLUMN stock_levels.quantity_on_hand IS 'Total physical stock in warehouse';
COMMENT ON COLUMN stock_levels.quantity_reserved IS 'Stock reserved for scheduled jobs';
COMMENT ON COLUMN stock_levels.quantity_available IS 'Computed: on_hand - reserved (available for new jobs)';

COMMENT ON TABLE stock_movements IS 'Audit trail of all stock transactions (inward, outward, adjustments)';
COMMENT ON COLUMN stock_movements.movement_type IS 'INWARD=receive stock, RESERVED=job scheduled, ALLOCATED=job completed, RETURNED=job cancelled, ADJUSTMENT=manual correction, STOCK_TAKE=physical count';

COMMENT ON TABLE job_labour_items IS 'Labour charges for jobs (separate from materials)';
COMMENT ON COLUMN job_labour_items.quoted_amount IS 'Labour cost from quote';
COMMENT ON COLUMN job_labour_items.actual_amount IS 'Actual labour cost after job completion';

COMMENT ON TABLE job_photos IS 'Job photos metadata (files stored in storage.job-photos bucket)';
COMMENT ON COLUMN job_photos.photo_type IS 'BEFORE, DURING, AFTER, ISSUE, OTHER';

COMMENT ON TABLE job_comments IS 'All job-related notes, issues, and communication';
COMMENT ON COLUMN job_comments.is_internal IS 'true = staff only, false = visible to customer';

COMMENT ON TABLE job_status_history IS 'Auto-logged audit trail of all job status changes';

COMMENT ON TABLE job_completion_certificates IS 'Completion certificates with signatures and PDF storage';

-- ============================================================================
-- PART 11: VERIFICATION QUERIES
-- ============================================================================

-- Check all tables created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'stock_levels', 
  'stock_movements', 
  'job_labour_items', 
  'job_photos', 
  'job_comments', 
  'job_status_history', 
  'job_completion_certificates'
)
ORDER BY tablename;

-- Check storage bucket created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'job-photos';

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'stock_levels', 
  'stock_movements', 
  'job_labour_items', 
  'job_photos', 
  'job_comments', 
  'job_status_history', 
  'job_completion_certificates'
)
ORDER BY indexname;

-- Check triggers created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND (trigger_name LIKE '%job%' OR trigger_name LIKE '%stock%')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Run 20251207_jobs_stock_functions.sql (create stock management functions)
-- 2. Build Jobs List page (src/app/jobs/page.tsx)
-- 3. Build Job Detail page (src/app/jobs/[id]/page.tsx)
-- 4. Build Completion Certificate page (src/app/jobs/[id]/certificate/page.tsx)
