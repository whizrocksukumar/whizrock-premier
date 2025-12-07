# Phase 1C Cleanup - Files to Delete After Testing

## Purpose
After Phase 1C migration is tested and verified, these temporary files should be deleted.

## Migration Completed
- ✅ Added `client_id` foreign key to assessments table
- ✅ Migrated 12 test customers to clients table
- ✅ Linked assessments to clients via client_id
- ✅ Updated frontend to query clients via FK relationship

## Files to Delete After Verification

### 1. SQL Scripts (scripts/)
These were one-time data population scripts:
- `scripts/update_assessment_companies.sql` - Used to add company names to inline fields
- `scripts/populate_clients_from_assessments.sql` - If created, delete after migration
- `scripts/insert_test_assessments.sql` - Old test data script

### 2. Database Columns to Remove Later
After confirming all functionality works with client_id FK:

```sql
-- FUTURE CLEANUP: Remove old inline customer fields from assessments table
-- RUN ONLY AFTER thorough testing and user confirmation
ALTER TABLE assessments 
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS customer_email,
  DROP COLUMN IF EXISTS customer_phone,
  DROP COLUMN IF EXISTS customer_company;
```

**⚠️ WARNING:** Do NOT run the above SQL until:
1. All assessments are linked to clients (client_id IS NOT NULL)
2. Frontend is fully tested and working
3. User has confirmed everything works correctly
4. Backup is taken

## Verification Checklist

Before deleting old inline fields, verify:
- [ ] All 12 assessments display customer names correctly
- [ ] Assessment detail pages show client information
- [ ] No "No Client Linked" messages appearing
- [ ] Installers still showing correctly (FK already working)
- [ ] New assessment form links to clients (when implemented)
- [ ] Database backup taken

## Testing Commands

```sql
-- Check all assessments are linked to clients
SELECT 
    reference_number,
    CASE WHEN client_id IS NULL THEN '❌ NOT LINKED' ELSE '✅ LINKED' END as status,
    c.first_name || ' ' || c.last_name as client_name
FROM assessments a
LEFT JOIN clients c ON a.client_id = c.id
ORDER BY reference_number;

-- Count linked vs unlinked
SELECT 
    COUNT(*) FILTER (WHERE client_id IS NOT NULL) as linked,
    COUNT(*) FILTER (WHERE client_id IS NULL) as not_linked
FROM assessments;
```

## Timeline
- **Now**: Migration run, frontend updated
- **Next 7 days**: User testing and verification
- **After verified**: Delete temporary files and old inline columns
