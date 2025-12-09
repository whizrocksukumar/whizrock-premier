-- ============================================================================
-- INCIDENTS SYSTEM - DATABASE SCHEMA
-- Date: December 8, 2025
-- Purpose: Track job-related incidents, safety issues, and resolutions
-- ============================================================================

-- ============================================================================
-- PART 1: INCIDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Incident Reference
  incident_number TEXT UNIQUE NOT NULL,
  
  -- Relationships
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  reported_by UUID,
  assigned_to UUID,
  
  -- Incident Details
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'Safety Issue',
    'Quality Issue',
    'Equipment Failure',
    'Material Shortage',
    'Customer Complaint',
    'Weather Delay',
    'Site Access Issue',
    'Other'
  )),
  
  severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN (
    'Low',
    'Medium',
    'High',
    'Critical'
  )),
  
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN (
    'Open',
    'In Progress',
    'Pending Customer',
    'Resolved',
    'Closed',
    'Cancelled'
  )),
  
  -- Description
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT, -- Specific location within site
  
  -- Dates
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reported_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Resolution
  resolution_notes TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  
  -- Impact
  impact_on_schedule TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add foreign keys to team_members if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incidents_reported_by'
    ) THEN
      ALTER TABLE incidents 
      ADD CONSTRAINT fk_incidents_reported_by 
      FOREIGN KEY (reported_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incidents_assigned_to'
    ) THEN
      ALTER TABLE incidents 
      ADD CONSTRAINT fk_incidents_assigned_to 
      FOREIGN KEY (assigned_to) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_job ON incidents(job_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at ON incidents(occurred_at DESC);

-- ============================================================================
-- PART 2: INCIDENT PHOTOS/ATTACHMENTS
-- ============================================================================

-- Create storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-photos',
  'incident-photos',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident photos
DO $$ 
BEGIN
  -- INSERT: Authenticated users can upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'incident_photos_insert_policy'
  ) THEN
    CREATE POLICY incident_photos_insert_policy ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'incident-photos');
  END IF;

  -- SELECT: Authenticated users can view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'incident_photos_select_policy'
  ) THEN
    CREATE POLICY incident_photos_select_policy ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'incident-photos');
  END IF;

  -- DELETE: Authenticated users can delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'incident_photos_delete_policy'
  ) THEN
    CREATE POLICY incident_photos_delete_policy ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'incident-photos');
  END IF;
END $$;

-- Incident Photos Table
CREATE TABLE IF NOT EXISTS incident_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL,
  
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  
  caption TEXT,
  taken_at TIMESTAMP,
  
  uploaded_by UUID,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID,
  deleted_at TIMESTAMP
);

-- Add foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incident_photos_incident'
    ) THEN
      ALTER TABLE incident_photos 
      ADD CONSTRAINT fk_incident_photos_incident 
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incident_photos_uploaded_by'
    ) THEN
      ALTER TABLE incident_photos 
      ADD CONSTRAINT fk_incident_photos_uploaded_by 
      FOREIGN KEY (uploaded_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incident_photos_deleted_by'
    ) THEN
      ALTER TABLE incident_photos 
      ADD CONSTRAINT fk_incident_photos_deleted_by 
      FOREIGN KEY (deleted_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incident_photos_incident ON incident_photos(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_photos_uploaded_by ON incident_photos(uploaded_by);

-- ============================================================================
-- PART 3: INCIDENT NOTES/UPDATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL,
  
  note_text TEXT NOT NULL,
  note_type TEXT DEFAULT 'Update' CHECK (note_type IN (
    'Update',
    'Investigation',
    'Resolution',
    'Customer Contact',
    'Internal'
  )),
  
  is_internal BOOLEAN DEFAULT true,
  
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP
);

-- Add foreign keys
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incident_notes_incident'
    ) THEN
      ALTER TABLE incident_notes 
      ADD CONSTRAINT fk_incident_notes_incident 
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_incident_notes_created_by'
    ) THEN
      ALTER TABLE incident_notes 
      ADD CONSTRAINT fk_incident_notes_created_by 
      FOREIGN KEY (created_by) REFERENCES team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incident_notes_incident ON incident_notes(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_notes_created ON incident_notes(created_at DESC);

-- ============================================================================
-- PART 4: AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_incidents_updated_at'
  ) THEN
    CREATE TRIGGER trigger_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incidents_updated_at();
  END IF;
END $$;

-- Auto-set resolved_at when status changes to Resolved
CREATE OR REPLACE FUNCTION set_incident_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Resolved' AND OLD.status != 'Resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  IF NEW.status = 'Closed' AND OLD.status != 'Closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_incident_status_dates'
  ) THEN
    CREATE TRIGGER trigger_incident_status_dates
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION set_incident_resolved_at();
  END IF;
END $$;

-- ============================================================================
-- PART 5: GENERATE INCIDENT NUMBER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_sequence TEXT;
  v_count INTEGER;
  v_incident_number TEXT;
BEGIN
  -- Format: INC-YYYYMMDD-XXX
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get count of incidents today
  SELECT COUNT(*) INTO v_count
  FROM incidents
  WHERE incident_number LIKE 'INC-' || v_date || '-%';
  
  -- Increment and format with leading zeros
  v_sequence := LPAD((v_count + 1)::TEXT, 3, '0');
  
  v_incident_number := 'INC-' || v_date || '-' || v_sequence;
  
  RETURN v_incident_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: SUMMARY
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  v_incidents_exists BOOLEAN;
  v_photos_exists BOOLEAN;
  v_notes_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incidents'
  ) INTO v_incidents_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incident_photos'
  ) INTO v_photos_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'incident_notes'
  ) INTO v_notes_exists;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'INCIDENTS SYSTEM SCHEMA CREATION COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'incidents table: %', CASE WHEN v_incidents_exists THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE 'incident_photos table: %', CASE WHEN v_photos_exists THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE 'incident_notes table: %', CASE WHEN v_notes_exists THEN '✅ Created' ELSE '❌ Failed' END;
  RAISE NOTICE 'Storage bucket: incident-photos ✅';
  RAISE NOTICE 'Functions: generate_incident_number() ✅';
  RAISE NOTICE 'Triggers: Auto-update timestamps ✅';
  RAISE NOTICE '===========================================';
END $$;
