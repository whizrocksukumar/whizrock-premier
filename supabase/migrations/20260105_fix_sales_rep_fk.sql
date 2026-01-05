-- Fix sales rep foreign key constraints to point to team_members instead of sales_reps
-- This makes team_members the single source of truth for all staff

-- Step 1: Drop existing foreign key constraints
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_sales_rep_id_fkey;
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_sales_rep_id_fkey;

-- Step 2: Add new foreign key constraints pointing to team_members
ALTER TABLE clients
  ADD CONSTRAINT clients_sales_rep_id_fkey
  FOREIGN KEY (sales_rep_id)
  REFERENCES team_members(id)
  ON DELETE SET NULL;

ALTER TABLE companies
  ADD CONSTRAINT companies_sales_rep_id_fkey
  FOREIGN KEY (sales_rep_id)
  REFERENCES team_members(id)
  ON DELETE SET NULL;

-- Step 3: Drop the sales_reps table if it exists (no longer needed)
DROP TABLE IF EXISTS sales_reps CASCADE;

-- Note: This makes team_members the single source of truth for all staff members
-- Sales reps are identified by their role field in team_members
