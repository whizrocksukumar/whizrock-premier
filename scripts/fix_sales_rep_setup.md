# Fix Sales Rep Database Setup

## Problem
The database has foreign key constraints pointing to a `sales_reps` table, but we want `team_members` to be the single source of truth for all staff (including sales reps).

## Solution
Run the following SQL in the Supabase SQL Editor:

```sql
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
```

## After Running the SQL

Once you've run the above SQL, you can assign sales reps to test data by running:

```bash
node scripts/assign_sales_reps.js
```

## Benefits
- **Single source of truth**: All staff managed through `team_members`
- **Better for auth**: When authentication is implemented, it will use `team_members`
- **No data duplication**: Sales reps don't exist in two places
- **Consistent role management**: Sales Rep role is defined in `team_members.role`
