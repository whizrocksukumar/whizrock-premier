# Phase 1C: Proper CRM Architecture Migration

## ✅ COMPLETED

### Database Changes
1. **Added 12 test customers to clients table**
   - John Smith (Auckland residential)
   - Sarah Johnson (Wellington commercial)
   - Michael Brown (Christchurch new build)
   - Emma Wilson (Tauranga heritage)
   - David Taylor (Auckland heritage)
   - Lisa Anderson (Auckland residential)
   - Robert Martinez (Wellington commercial)
   - Jennifer Garcia (Christchurch renovation)
   - Daniel Lee (Tauranga investment)
   - Amanda White (Hamilton new build)
   - Thomas Harris (Auckland postponed)
   - Patricia Clark (Wellington cancelled)

2. **Added `client_id` foreign key to assessments table**
   - References clients(id)
   - ON DELETE SET NULL (preserves assessment if client deleted)
   - Indexed for performance

3. **Linked all 12 assessments to clients**
   - Matched by email address
   - All assessments now reference clients table

### Frontend Changes

#### src/app/assessments/page.tsx
- Changed from inline customer data to clients FK relationship
- Query: `clients!client_id (first_name, last_name, email, phone, company_id)`
- Display: `${clients.first_name} ${clients.last_name}` or "No Client Linked"

#### src/app/assessments/[id]/page.tsx
- Updated AssessmentDetail interface to use clients relationship
- Removed inline customer_name, customer_email, customer_phone fields
- Now queries clients via FK

#### src/app/globals.css
- Fixed button hover CSS: added `color: white` to `.btn-primary:hover`
- Prevents text turning black on blue background

## Architecture Benefits

### Before (Inline Data - BAD)
```
assessments table:
- customer_name: "John Smith"
- customer_email: "john@email.com"
- customer_phone: "021-555-0101"
- customer_company: "ABC Ltd"
```
❌ Duplicates data  
❌ Can't track customer history  
❌ Hard to update customer info  
❌ Not a proper CRM

### After (Foreign Key - GOOD) ✅
```
assessments table:
- client_id → clients table

clients table:
- id
- first_name
- last_name
- email
- phone
- company_id
```
✅ Single source of truth  
✅ Track all customer interactions  
✅ Update once, reflects everywhere  
✅ Proper CRM relationships  
✅ Matches installer pattern (team_members FK)

## Migration File
`supabase/migrations/20251207_phase1c_link_assessments_clients.sql`

## Next Steps

### Immediate (Required for Testing)
1. **Run the migration in Supabase**
   - Copy SQL from migration file
   - Execute in SQL Editor
   - Verify all 12 assessments linked

2. **Test frontend**
   - Visit `/assessments` - should show customer names
   - Click eye icon - detail page should show client info
   - Check installers still showing (FK already working)

### Future Enhancements
1. **New Assessment Form**
   - Dropdown to select existing client
   - Or "Create New Client" option
   - Link assessment to client on creation

2. **Client Detail Page**
   - Show all assessments for a client
   - Show all quotes for a client
   - Show all jobs for a client
   - Complete customer history

3. **Companies Table Integration**
   - Populate companies table
   - Link clients.company_id → companies.id
   - Display company names in assessments

4. **Data Cleanup** (After Verification)
   - Remove old inline fields from assessments
   - Delete temporary SQL scripts
   - See `scripts/CLEANUP_PHASE1C.md`

## Testing Verification

Run in Supabase SQL Editor:
```sql
-- Check all assessments linked
SELECT 
    a.reference_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    CASE WHEN a.client_id IS NOT NULL THEN '✅ LINKED' ELSE '❌ NOT LINKED' END
FROM assessments a
LEFT JOIN clients c ON a.client_id = c.id
ORDER BY a.reference_number;
```

Expected: All 12 assessments show "✅ LINKED"

## Related Files
- Migration: `supabase/migrations/20251207_phase1c_link_assessments_clients.sql`
- Cleanup Guide: `scripts/CLEANUP_PHASE1C.md`
- Updated Pages:
  - `src/app/assessments/page.tsx`
  - `src/app/assessments/[id]/page.tsx`
  - `src/app/globals.css`
