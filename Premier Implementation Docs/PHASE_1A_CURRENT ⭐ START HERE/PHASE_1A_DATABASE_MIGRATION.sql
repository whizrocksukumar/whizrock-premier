-- ============================================================================
-- PREMIER INSULATION - PHASE 1A DATABASE MIGRATION
-- Date: December 5, 2025
-- Purpose: Create new tables for Assessment workflow, restructure Team
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE TEAM_MEMBERS TABLE (replaces sales_reps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  
  -- Role/Designation
  role TEXT NOT NULL DEFAULT 'Sales Rep',
  -- Values: 'Sales Rep', 'Installer', 'Receptionist', 'Admin'
  
  -- Status
  status TEXT DEFAULT 'active',
  -- Values: 'active', 'on_leave', 'inactive'
  
  -- Contact preference
  preferred_contact TEXT DEFAULT 'email',
  -- Values: 'email', 'phone', 'sms'
  
  -- Availability dates
  available_start_date DATE,
  available_end_date DATE,
  
  -- Employment dates
  hire_date DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- ============================================================================
-- STEP 2: INSERT MOCK TEAM DATA
-- ============================================================================

-- Installers
INSERT INTO team_members (first_name, last_name, email, phone, role, hire_date, status)
VALUES
  ('James', 'Thompson', 'james.thompson@premier.co.nz', '021-555-0101', 'Installer', '2023-01-15'::DATE, 'active'),
  ('Mike', 'Chen', 'mike.chen@premier.co.nz', '021-555-0102', 'Installer', '2023-03-20'::DATE, 'active'),
  ('Sarah', 'Williams', 'sarah.williams@premier.co.nz', '021-555-0103', 'Installer', '2024-06-10'::DATE, 'active')
ON CONFLICT (email) DO NOTHING;

-- Sales Reps
INSERT INTO team_members (first_name, last_name, email, phone, role, hire_date, status)
VALUES
  ('David', 'Garcia', 'david.garcia@premier.co.nz', '021-555-0201', 'Sales Rep', '2022-08-01'::DATE, 'active'),
  ('Emma', 'Johnson', 'emma.johnson@premier.co.nz', '021-555-0202', 'Sales Rep', '2023-05-12'::DATE, 'active'),
  ('Robert', 'Sullivan', 'robert.sullivan@premier.co.nz', '021-555-0203', 'Sales Rep', '2024-01-09'::DATE, 'active')
ON CONFLICT (email) DO NOTHING;

-- Receptionist
INSERT INTO team_members (first_name, last_name, email, phone, role, hire_date, status)
VALUES
  ('Lisa', 'Anderson', 'lisa.anderson@premier.co.nz', '021-555-0301', 'Receptionist', '2023-09-01'::DATE, 'active')
ON CONFLICT (email) DO NOTHING;

-- Master Admin
INSERT INTO team_members (first_name, last_name, email, phone, role, hire_date, status)
VALUES
  ('Percy', 'Darbhana', 'percy.darbhana@premier.co.nz', '021-555-0401', 'Admin', '2020-01-01'::DATE, 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference number
  reference_number TEXT UNIQUE NOT NULL,
  -- Format: "ASS-2025-001"
  
  -- Enquiry link (optional - can create assessment without enquiry)
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Location
  site_address TEXT NOT NULL,
  city TEXT,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  postcode TEXT,
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  -- Format: "14:00" (2pm)
  
  -- Assignment
  assigned_installer_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  -- Only references team_members WHERE role = 'Installer'
  
  -- Status
  status TEXT DEFAULT 'Scheduled',
  -- Values: 'Scheduled', 'In Progress', 'Completed', 'Cancelled'
  
  -- Notes from Premier
  notes TEXT,
  
  -- Metadata
  created_by_premier_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessments_reference ON assessments(reference_number);
CREATE INDEX IF NOT EXISTS idx_assessments_enquiry ON assessments(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_assessments_assigned_installer ON assessments(assigned_installer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_scheduled_date ON assessments(scheduled_date);

-- ============================================================================
-- STEP 4: CREATE ASSESSMENT_ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks assignment history (supports reassignment in Phase 1B)

CREATE TABLE IF NOT EXISTS assessment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to assessment
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  
  -- Who made the assignment
  assigned_by_user_id UUID,
  
  -- Who it's assigned to
  assigned_installer_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  
  -- When assigned
  assigned_date TIMESTAMP DEFAULT NOW(),
  
  -- Scheduled for when
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  
  -- Status of this assignment
  status TEXT DEFAULT 'Scheduled',
  -- Values: 'Scheduled', 'Completed', 'Cancelled', 'Reassigned'
  
  -- When completed
  completed_at TIMESTAMP,
  
  -- Optional notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_installer ON assessment_assignments(assigned_installer_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_scheduled_date ON assessment_assignments(scheduled_date);

-- ============================================================================
-- STEP 5: CREATE ASSESSMENT_PHOTOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to assessment
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  
  -- Storage location (Supabase)
  photo_url TEXT NOT NULL,
  -- Full URL from Supabase Storage
  
  photo_key TEXT NOT NULL,
  -- Reference for deletion: "assessments/ASS-2025-001/photo1.jpg"
  
  -- Photo metadata
  photo_type TEXT,
  -- Values: 'Before', 'After', 'Detail', 'Overall', 'Issue', 'Existing', 'Custom'
  
  description TEXT,
  
  uploaded_by TEXT,
  -- Installer name or user ID
  
  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessment_photos_assessment ON assessment_photos(assessment_id);

-- ============================================================================
-- STEP 6: UPDATE ENQUIRIES TABLE
-- ============================================================================

-- Add new columns if they don't already exist
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS premier_notes TEXT,
-- Notes from Premier when creating enquiry

ADD COLUMN IF NOT EXISTS attached_files JSONB,
-- Format: [{"filename": "floor_plan.pdf", "url": "storage_url", "key": "storage_key"}]

ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
-- Link to assessment (optional)

ADD COLUMN IF NOT EXISTS sent_to_va BOOLEAN DEFAULT FALSE,
-- Track if enquiry has been sent to VA

ADD COLUMN IF NOT EXISTS sent_to_va_date TIMESTAMP,
-- When was it sent to VA

ADD COLUMN IF NOT EXISTS assigned_va_user_id UUID;
-- Which VA it's assigned to

-- ============================================================================
-- STEP 7: UPDATE EXISTING FOREIGN KEY REFERENCES
-- ============================================================================
-- These would need to be done based on your existing schema
-- For now, this is just documentation

-- NOTE: If you have existing tables referencing sales_reps, you'll need to:
--   1. Update quotes.sales_rep_id to reference team_members
--   2. Update jobs.assigned_installer_id to reference team_members
--   3. Add constraint that jobs.assigned_installer_id only references team_members WHERE role = 'Installer'

-- Example (uncomment if needed):
-- ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_sales_rep_id_fkey;
-- ALTER TABLE quotes ADD CONSTRAINT quotes_sales_rep_id_fkey 
--   FOREIGN KEY (sales_rep_id) REFERENCES team_members(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 8: CREATE VIEWS FOR CONVENIENCE (Optional)
-- ============================================================================

-- View to get only installers
CREATE OR REPLACE VIEW installers AS
SELECT * FROM team_members WHERE role = 'Installer';

-- View to get only sales reps
CREATE OR REPLACE VIEW sales_reps_view AS
SELECT * FROM team_members WHERE role = 'Sales Rep';

-- View to get assessment schedule with installer names
CREATE OR REPLACE VIEW assessment_schedule AS
SELECT 
  a.id,
  a.reference_number,
  a.customer_name,
  a.site_address,
  a.scheduled_date,
  a.scheduled_time,
  CONCAT(tm.first_name, ' ', tm.last_name) as installer_name,
  a.status,
  a.created_at
FROM assessments a
LEFT JOIN team_members tm ON a.assigned_installer_id = tm.id
ORDER BY a.scheduled_date, a.scheduled_time;

-- ============================================================================
-- STEP 9: VERIFY TABLES CREATED
-- ============================================================================

-- Run this query to verify all tables exist:
/*
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'assessments', 'assessment_assignments', 'assessment_photos')
ORDER BY tablename;
*/

-- ============================================================================
-- STEP 10: BACKUP NOTES FOR EXISTING sales_reps TABLE
-- ============================================================================

-- If you want to preserve the old sales_reps table:
-- CREATE TABLE sales_reps_backup AS SELECT * FROM sales_reps;
-- ALTER TABLE sales_reps RENAME TO sales_reps_old;

-- After migration is complete and tested, you can drop:
-- DROP TABLE sales_reps_old;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- All tables created and mock data inserted.
-- Ready for Phase 1A implementation.

-- Next steps:
-- 1. Verify tables in Supabase dashboard
-- 2. Test data integrity
-- 3. Begin building pages starting with /assessments
