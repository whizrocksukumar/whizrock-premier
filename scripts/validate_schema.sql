-- ============================================================================
-- SCHEMA VALIDATION - Run this FIRST before any data inserts
-- ============================================================================

-- Check if all required tables exist
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT ARRAY_AGG(table_name)
  INTO missing_tables
  FROM (
    SELECT unnest(ARRAY['team_members', 'assessments', 'quotes', 'jobs', 'quote_line_items', 'job_line_items']) AS table_name
  ) required
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = required.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All required tables exist';
  END IF;
END $$;

-- ============================================================================
-- VALIDATE TEAM_MEMBERS TABLE
-- ============================================================================

SELECT '=== TEAM_MEMBERS TABLE ===' as check_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'team_members'
ORDER BY ordinal_position;

SELECT COUNT(*) as team_member_count FROM team_members;

-- Check required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'team_members.id column missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'team_members' AND column_name = 'first_name'
  ) THEN
    RAISE EXCEPTION 'team_members.first_name column missing';
  END IF;
  
  RAISE NOTICE '✅ team_members table has required columns';
END $$;

-- ============================================================================
-- VALIDATE ASSESSMENTS TABLE
-- ============================================================================

SELECT '=== ASSESSMENTS TABLE ===' as check_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assessments'
ORDER BY ordinal_position;

SELECT COUNT(*) as assessment_count FROM assessments;

-- Check required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'reference_number'
  ) THEN
    RAISE EXCEPTION 'assessments.reference_number column missing';
  END IF;
  
  RAISE NOTICE '✅ assessments table has required columns';
END $$;

-- ============================================================================
-- VALIDATE QUOTES TABLE
-- ============================================================================

SELECT '=== QUOTES TABLE ===' as check_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quotes'
ORDER BY ordinal_position;

SELECT COUNT(*) as quote_count FROM quotes;

-- Check required columns for insert_test_quotes.sql
DO $$
DECLARE
  missing_cols TEXT[];
BEGIN
  SELECT ARRAY_AGG(col)
  INTO missing_cols
  FROM unnest(ARRAY[
    'quote_number',
    'customer_first_name',
    'customer_last_name',
    'customer_email',
    'customer_phone',
    'site_address',
    'city',
    'postcode',
    'assessment_id',
    'status',
    'subtotal',
    'gst_amount',
    'total_amount',
    'margin_percentage',
    'notes',
    'valid_until',
    'created_by',
    'created_at'
  ]) AS col
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = col
  );
  
  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'quotes table missing columns: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ quotes table has all required columns';
  END IF;
END $$;

-- ============================================================================
-- VALIDATE JOBS TABLE
-- ============================================================================

SELECT '=== JOBS TABLE ===' as check_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

SELECT COUNT(*) as job_count FROM jobs;

-- Check required columns for insert_test_jobs.sql
DO $$
DECLARE
  missing_cols TEXT[];
BEGIN
  SELECT ARRAY_AGG(col)
  INTO missing_cols
  FROM unnest(ARRAY[
    'job_number',
    'quote_id',
    'customer_first_name',
    'customer_last_name',
    'customer_email',
    'customer_phone',
    'site_address',
    'city',
    'postcode',
    'status',
    'scheduled_date',
    'start_date',
    'completion_date',
    'quoted_amount',
    'actual_cost',
    'crew_lead_id',
    'notes',
    'created_at'
  ]) AS col
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = col
  );
  
  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'jobs table missing columns: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✅ jobs table has all required columns';
  END IF;
END $$;

-- ============================================================================
-- CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT '=== FOREIGN KEY CHECKS ===' as check_name;

-- Check quotes.assessment_id can reference assessments.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'quotes' 
    AND constraint_name LIKE '%assessment%'
  ) THEN
    RAISE WARNING 'quotes.assessment_id foreign key might be missing';
  ELSE
    RAISE NOTICE '✅ quotes.assessment_id foreign key exists';
  END IF;
END $$;

-- Check jobs.quote_id can reference quotes.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'jobs' 
    AND constraint_name LIKE '%quote%'
  ) THEN
    RAISE WARNING 'jobs.quote_id foreign key might be missing';
  ELSE
    RAISE NOTICE '✅ jobs.quote_id foreign key exists';
  END IF;
END $$;

-- Check jobs.crew_lead_id can reference team_members.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'jobs' 
    AND constraint_name LIKE '%crew%'
  ) THEN
    RAISE WARNING 'jobs.crew_lead_id foreign key might be missing';
  ELSE
    RAISE NOTICE '✅ jobs.crew_lead_id foreign key exists';
  END IF;
END $$;

-- ============================================================================
-- DATA READINESS CHECK
-- ============================================================================

SELECT '=== DATA READINESS ===' as check_name;

-- Check team members exist
DO $$
DECLARE
  team_count INT;
BEGIN
  SELECT COUNT(*) INTO team_count FROM team_members;
  
  IF team_count = 0 THEN
    RAISE EXCEPTION 'No team members found. Run Phase 1A migration first.';
  ELSE
    RAISE NOTICE '✅ Found % team members', team_count;
  END IF;
END $$;

-- Check assessments exist for quote linking
DO $$
DECLARE
  assessment_count INT;
  completed_count INT;
BEGIN
  SELECT COUNT(*) INTO assessment_count FROM assessments;
  SELECT COUNT(*) INTO completed_count FROM assessments WHERE status = 'Completed';
  
  IF assessment_count = 0 THEN
    RAISE EXCEPTION 'No assessments found. Run insert_test_assessments.sql first.';
  ELSIF completed_count = 0 THEN
    RAISE WARNING 'No completed assessments found. Some quotes may not link to assessments.';
  ELSE
    RAISE NOTICE '✅ Found % assessments (% completed)', assessment_count, completed_count;
  END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ SCHEMA VALIDATION COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now run:';
  RAISE NOTICE '  1. scripts/insert_test_quotes.sql';
  RAISE NOTICE '  2. scripts/insert_test_jobs.sql';
  RAISE NOTICE '';
END $$;
