-- ============================================================================
-- TEMPORARY: DISABLE RLS ON CLIENTS TABLE FOR DEVELOPMENT
-- This allows the frontend to query clients using the anon key
-- ============================================================================

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- NOTE: In production, you should enable RLS and create proper policies:
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all access to authenticated users" ON clients
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
