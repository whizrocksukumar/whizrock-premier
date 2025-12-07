-- Check if Maria's ID exists in the users table (Supabase Auth)
-- and also in team_members
SELECT 'users table' as source, id::text, email FROM auth.users 
WHERE id = '16bc0e92-2bbd-4e89-95a6-5f82e849047d'
UNION ALL
SELECT 'team_members table' as source, id::text, email FROM team_members 
WHERE id = '16bc0e92-2bbd-4e89-95a6-5f82e849047d';
