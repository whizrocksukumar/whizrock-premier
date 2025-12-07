-- ============================================================================
-- DISABLE RLS ON ADDITIONAL TABLES FOR DEVELOPMENT
-- Allows frontend to query these tables with anon key
-- ============================================================================

-- Disable RLS on companies table
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on client_types table
ALTER TABLE IF EXISTS client_types DISABLE ROW LEVEL SECURITY;

-- Disable RLS on quotes table (for customer 360 view)
ALTER TABLE IF EXISTS quotes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on jobs table (for customer 360 view)
ALTER TABLE IF EXISTS jobs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on invoices table (for customer 360 view)
ALTER TABLE IF EXISTS invoices DISABLE ROW LEVEL SECURITY;

-- NOTE: In production, enable RLS and create proper policies
